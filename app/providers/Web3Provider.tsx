'use client';

declare global {
  interface Window {
    ethereum?: any;
  }
}

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { userHasWallet } from "@civic/auth-web3";
import { embeddedWallet } from "@civic/auth-web3/wagmi";
import { CivicAuthProvider, useUser } from "@civic/auth-web3/react";
import { useAccount, useConnect, useBalance } from "wagmi";
import { useAutoConnect } from "@civic/auth-web3/wagmi";
import { ethers } from 'ethers';
import { ResumeEntry, EntryType } from '@/app/lib/types';
import { 
  ResumeNFT__factory,
  VerificationRegistry__factory,
  ContractStructs
} from '@/app/lib/contracts/contract-types';
import { contractAddresses } from '@/app/lib/contracts/addresses';

// Helper function to convert EntryType string to uint8 for contract
const entryTypeToUint8 = (type: EntryType): number => {
  const typeMap: Record<EntryType, number> = {
    'work': 0,
    'education': 1,
    'certification': 2,
    'project': 3,
    'skill': 4,
    'award': 5
  };
  return typeMap[type];
};

// Helper function to convert uint8 from contract to EntryType string
const uint8ToEntryType = (typeValue: number): EntryType => {
  const typeMap: Record<number, EntryType> = {
    0: 'work',
    1: 'education',
    2: 'certification',
    3: 'project',
    4: 'skill',
    5: 'award'
  };
  return typeMap[typeValue] || 'work';
};

// Helper function to safely encode string to base64 (handles Unicode characters)
const safeEncode = (str: string): string => {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => 
    String.fromCharCode(parseInt(p1, 16))
  ));
};

// Create a client
const queryClient = new QueryClient();

// Configure Wagmi
const wagmiConfig = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  connectors: [
    embeddedWallet(),
  ],
});

// Helper interface for resume metadata
interface ResumeMetadata {
  name: string;
  createdAt: string;
}

// Create context for our enhanced Web3Provider
interface Web3ContextType {
  userAuthenticated: boolean;
  walletConnected: boolean;
  address: string | null;
  balance: string | null; 
  tokenId: bigint | null;
  tokenIds: bigint[];
  resumeNames: Record<string, ResumeMetadata>;
  // Methods
  connectWallet: () => Promise<void>;
  createWallet: () => Promise<void>;
  getResumeEntries: () => Promise<ResumeEntry[]>;
  addResumeEntry: (entryData: any) => Promise<{ success: boolean; entryIndex?: number }>;
  requestVerification: (entryIndex: number) => Promise<{ success: boolean }>;
  createNewResume: (name?: string) => Promise<bigint>;
  selectResume: (id: bigint) => void;
  updateResumeName: (id: bigint, name: string) => Promise<void>;
  isLoading: boolean;
}

const Web3Context = createContext<Web3ContextType | null>(null);

// Provider component that combines Web3Service functionality with Civic Auth
export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <CivicAuthProvider clientId={process.env.NEXT_PUBLIC_CIVIC_CLIENT_ID!}>
          <Web3ProviderInner>
            {children}
          </Web3ProviderInner>
        </CivicAuthProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}

// Inner provider component that has access to hooks
function Web3ProviderInner({ children }: { children: React.ReactNode }) {
  const userContext = useUser();
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { data: balanceData } = useBalance({ address });
  
  const [tokenId, setTokenId] = useState<bigint | null>(null);
  const [tokenIds, setTokenIds] = useState<bigint[]>([]);
  const [resumeNames, setResumeNames] = useState<Record<string, ResumeMetadata>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Auto-connect the wallet if user has one
  useAutoConnect();
  
  // Load resume names from local storage
  useEffect(() => {
    if (address) {
      try {
        const storedNames = localStorage.getItem(`resume-names-${address}`);
        if (storedNames) {
          setResumeNames(JSON.parse(storedNames));
        }
      } catch (error) {
        console.error("Error loading resume names from storage:", error);
      }
    }
  }, [address]);
  
  // Save resume names to local storage when they change
  useEffect(() => {
    if (address && Object.keys(resumeNames).length > 0) {
      try {
        localStorage.setItem(`resume-names-${address}`, JSON.stringify(resumeNames));
      } catch (error) {
        console.error("Error saving resume names to storage:", error);
      }
    }
  }, [resumeNames, address]);
  
  // Get contracts
  const getResumeNFTContract = useCallback(async () => {
    if (!isConnected || !address) {
      throw new Error("Wallet not connected");
    }
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const resumeNFTAddress = contractAddresses.resumeNFT || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    return ResumeNFT__factory.connect(resumeNFTAddress, signer);
  }, [isConnected, address]);
  
  // Get token IDs when wallet connected
  useEffect(() => {
    const getTokenIds = async () => {
      if (isConnected && address) {
        try {
          const resumeNFT = await getResumeNFTContract();
          const ids = await resumeNFT.getEntriesByOwner(address);
          
          setTokenIds(ids);
          
          // Set the active token ID to the first one if available
          if (ids && ids.length > 0) {
            setTokenId(ids[0]);
          } else {
            setTokenId(null);
          }
        } catch (error) {
          console.error("Error getting user's token IDs:", error);
        }
      }
    };
    
    getTokenIds();
  }, [isConnected, address, getResumeNFTContract]);
  
  // Create a new resume NFT
  const createNewResume = async (name?: string) => {
    try {
      setIsLoading(true);
      
      if (!isConnected || !address) {
        throw new Error("Wallet not connected");
      }
      
      const resumeName = name || `Resume #${tokenIds.length + 1}`;
      
      // Create a metadata object for the resume
      const metadata = {
        name: resumeName,
        description: `ProofOfWork Resume - ${resumeName}`,
        image: "https://proofofwork.crypto/logo.png", // Replace with actual logo URL
        created_at: new Date().toISOString(),
        owner: address,
        attributes: []
      };
      
      // In a production app, we would upload this metadata to IPFS or another decentralized storage
      // For now, we'll create a base64-encoded data URI using our safe encoding function
      const metadataStr = JSON.stringify(metadata);
      const metadataUri = `data:application/json;base64,${safeEncode(metadataStr)}`;
      
      const resumeNFT = await getResumeNFTContract();
      
      // Mint a new resume NFT with the metadata URI
      const tx = await resumeNFT.mintResume(address, metadataUri);
      const receipt = await tx.wait();
      
      // Get the token ID from the event
      const event = receipt?.logs.find(log => {
        try {
          const parsedLog = resumeNFT.interface.parseLog(log);
          return parsedLog?.name === "ResumeMinted";
        } catch (e) {
          return false;
        }
      });
      
      if (event) {
        const parsedLog = resumeNFT.interface.parseLog(event);
        const newTokenId = parsedLog?.args.tokenId;
        
        // Update the token IDs and set the active token ID
        setTokenIds(prev => [...prev, newTokenId]);
        setTokenId(newTokenId);
        
        // Save the resume name
        setResumeNames(prev => ({
          ...prev,
          [newTokenId.toString()]: {
            name: resumeName,
            createdAt: new Date().toISOString()
          }
        }));
        
        return newTokenId;
      }
      
      throw new Error("Failed to get token ID from transaction");
    } catch (error) {
      console.error("Error creating resume:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Select a resume
  const selectResume = (id: bigint) => {
    if (tokenIds.includes(id)) {
      setTokenId(id);
    } else {
      console.error("Invalid token ID:", id);
    }
  };
  
  // Connect wallet helper
  const connectWallet = async () => {
    if (!isConnected) {
      await connect({ connector: connectors[0] });
    }
  };
  
  // Create wallet if user doesn't have one
  const createWallet = async () => {
    if (userContext.user && !userHasWallet(userContext)) {
      await userContext.createWallet();
      await connectWallet();
    }
  };
  
  // Get resume entries
  const getResumeEntries = async (): Promise<ResumeEntry[]> => {
    if (!isConnected || !address || !tokenId) {
      return [];
    }
    
    try {
      const resumeNFT = await getResumeNFTContract();
      const entries = await resumeNFT.getResumeEntries(tokenId);
      
      // Transform the contract data to our ResumeEntry format
      return entries.map((entry: ContractStructs.ResumeEntryStructOutput, index: number) => {
        // Convert the numeric entryType to string EntryType
        const type = uint8ToEntryType(Number(entry.entryType));
        
        // Parse the metadata JSON to extract additional fields
        let additionalFields = {};
        try {
          if (entry.metadata) {
            additionalFields = JSON.parse(entry.metadata);
          }
        } catch (e) {
          console.error("Failed to parse metadata JSON:", e);
        }
        
        return {
          id: index,
          type,
          title: entry.title,
          company: entry.organization,
          description: entry.description,
          startDate: new Date(Number(entry.startDate) * 1000).toISOString().split('T')[0],
          endDate: Number(entry.endDate) > 0 
            ? new Date(Number(entry.endDate) * 1000).toISOString().split('T')[0]
            : 'Present',
          verified: entry.verified,
          organization: entry.organization,
          ...additionalFields
        };
      });
    } catch (error) {
      console.error("Error getting resume entries:", error);
      return [];
    }
  };
  
  // Add resume entry
  const addResumeEntry = async (entryData: {
    type: EntryType;
    title: string;
    company: string;
    description: string;
    startDate: string;
    endDate: string;
    organization: string;
    // Additional fields based on type
    [key: string]: any;
  }) => {
    try {
      if (!isConnected || !address || !tokenId) {
        throw new Error("Resume not initialized");
      }
      
      setIsLoading(true);
      
      // Convert dates to Unix timestamps
      const startTimestamp = Math.floor(new Date(entryData.startDate).getTime() / 1000);
      const endTimestamp = entryData.endDate 
        ? Math.floor(new Date(entryData.endDate).getTime() / 1000)
        : 0; // 0 for current positions
      
      // Convert the entry type to uint8 for the contract
      const entryTypeValue = entryTypeToUint8(entryData.type);
      
      // Extract core fields to avoid duplication in metadata
      const { title, description, startDate, endDate, organization, company, type, ...additionalFields } = entryData;
      
      // Create a metadata object to store additional fields based on entry type
      const metadata = JSON.stringify(additionalFields);
      
      // Use the typed contract method
      const resumeNFT = await getResumeNFTContract();
      const tx = await resumeNFT.addResumeEntry(
        tokenId,
        BigInt(entryTypeValue),
        entryData.title,
        entryData.description,
        BigInt(startTimestamp),
        BigInt(endTimestamp),
        entryData.organization || entryData.company,
        metadata
      );
      
      const receipt = await tx.wait();
      
      // Get the entry index from the event
      const event = receipt?.logs.find(log => {
        try {
          const parsedLog = resumeNFT.interface.parseLog(log);
          return parsedLog?.name === "ResumeEntryAdded";
        } catch (e) {
          return false;
        }
      });
      
      if (event) {
        const parsedLog = resumeNFT.interface.parseLog(event);
        return { 
          success: true, 
          entryIndex: Number(parsedLog?.args.entryIndex)
        };
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error adding resume entry:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Request verification
  const requestVerification = async (entryIndex: number) => {
    try {
      if (!isConnected || !address || !tokenId) {
        throw new Error("Resume not initialized");
      }
      
      setIsLoading(true);
      
      // Use the typed contract method
      const resumeNFT = await getResumeNFTContract();
      const tx = await resumeNFT.requestVerification(
        tokenId, 
        BigInt(entryIndex)
      );
      await tx.wait();
      
      return { success: true };
    } catch (error) {
      console.error("Error requesting verification:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update resume name
  const updateResumeName = async (id: bigint, name: string) => {
    if (!tokenIds.includes(id)) {
      console.error("Invalid token ID:", id);
      return;
    }
    
    try {
      // Update in local state first for immediate UI feedback
      setResumeNames(prev => {
        const current = prev[id.toString()] || { createdAt: new Date().toISOString() };
        return {
          ...prev,
          [id.toString()]: {
            ...current,
            name
          }
        };
      });
      
      // Try to update on-chain metadata if connected
      if (isConnected && address) {
        setIsLoading(true);
        
        // Create updated metadata
        const metadata = {
          name: name,
          description: `ProofOfWork Resume - ${name}`,
          image: "https://proofofwork.crypto/logo.png",
          updated_at: new Date().toISOString(),
          created_at: resumeNames[id.toString()]?.createdAt || new Date().toISOString(),
          owner: address,
          attributes: []
        };
        
        const metadataStr = JSON.stringify(metadata);
        const metadataUri = `data:application/json;base64,${safeEncode(metadataStr)}`;
        
        // Get contract instance
        const resumeNFT = await getResumeNFTContract();
        
        // The contract doesn't have a direct setTokenURI method accessible,
        // but we can use updateEntry for the first entry if it exists
        try {
          // Get current entries
          const entries = await resumeNFT.getResumeEntries(id);
          
          if (entries.length > 0) {
            // For simplicity, we'll just update the first entry to trigger a tokenURI update
            // Using a placeholder entry if needed
            const entry = entries[0];
            
            // Call updateEntry with the same values but new tokenURI
            const tx = await resumeNFT.updateEntry(
              id,                         // tokenId
              0,                          // entryIndex (first entry)
              entry.entryType,            // keep same type
              entry.title,                // keep same title
              entry.description,          // keep same description
              entry.startDate,            // keep same startDate
              entry.endDate,              // keep same endDate
              entry.organization,         // keep same organization
              entry.metadata,             // keep same metadata
              metadataUri                 // new token URI
            );
            
            await tx.wait();
            console.log("Resume metadata updated on-chain");
          } else {
            console.log("No entries to update - metadata update skipped");
          }
        } catch (error) {
          console.error("Error updating resume entry:", error);
          // The local state update was still done, so the name will be updated in the UI
        }
      }
    } catch (error) {
      console.error("Error updating resume name:", error);
      // Local state update was already done, so user still sees the name change
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create context value
  const contextValue: Web3ContextType = {
    userAuthenticated: !!userContext.user,
    walletConnected: isConnected,
    address: address || null,
    balance: balanceData ? `${(Number(balanceData.value) / 10**18).toFixed(4)} ${balanceData.symbol}` : null,
    tokenId,
    tokenIds,
    resumeNames,
    connectWallet,
    createWallet,
    getResumeEntries,
    addResumeEntry,
    requestVerification,
    createNewResume,
    selectResume,
    updateResumeName,
    isLoading
  };
  
  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
}

// Hook to use the Web3 context
export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
} 