'use client';

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

// Create context for our enhanced Web3Provider
interface Web3ContextType {
  userAuthenticated: boolean;
  walletConnected: boolean;
  address: string | null;
  balance: string | null; 
  tokenId: bigint | null;
  // Methods
  connectWallet: () => Promise<void>;
  createWallet: () => Promise<void>;
  getResumeEntries: () => Promise<ResumeEntry[]>;
  addResumeEntry: (entryData: any) => Promise<{ success: boolean; entryIndex?: number }>;
  requestVerification: (entryIndex: number) => Promise<{ success: boolean }>;
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
  const [isLoading, setIsLoading] = useState(false);
  
  // Auto-connect the wallet if user has one
  useAutoConnect();
  
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
  
  const getVerificationRegistryContract = useCallback(async () => {
    if (!isConnected || !address) {
      throw new Error("Wallet not connected");
    }
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const verificationRegistryAddress = contractAddresses.verificationRegistry || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    return VerificationRegistry__factory.connect(verificationRegistryAddress, signer);
  }, [isConnected, address]);
  
  // Get token ID when wallet connected
  useEffect(() => {
    const getTokenId = async () => {
      if (isConnected && address) {
        try {
          const resumeNFT = await getResumeNFTContract();
          const tokenIds = await resumeNFT.getEntriesByOwner(address);
          
          if (tokenIds && tokenIds.length > 0) {
            setTokenId(tokenIds[0]);
          }
        } catch (error) {
          console.error("Error getting user's token ID:", error);
        }
      }
    };
    
    getTokenId();
  }, [isConnected, address, getResumeNFTContract]);
  
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
  
  // Create context value
  const contextValue: Web3ContextType = {
    userAuthenticated: !!userContext.user,
    walletConnected: isConnected,
    address: address || null,
    balance: balanceData ? `${(Number(balanceData.value) / 10**18).toFixed(4)} ${balanceData.symbol}` : null,
    tokenId,
    connectWallet,
    createWallet,
    getResumeEntries,
    addResumeEntry,
    requestVerification,
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