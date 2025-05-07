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
import { CivicAuthProvider } from "@civic/auth-web3/nextjs";
import { useUser } from "@civic/auth-web3/react";
import { useAccount, useConnect, useBalance } from "wagmi";
import { useAutoConnect } from "@civic/auth-web3/wagmi";
import { ethers } from 'ethers';
import { ResumeEntry, EntryType, ProfileMetadata } from '@/app/lib/types';
import { 
  ResumeNFT__factory,
  VerificationRegistry__factory,
  ContractStructs
} from '@/app/lib/contracts/contract-types';
import { contractAddresses } from '@/app/lib/contracts/addresses';
import { ipfsService } from '@/app/lib/services/ipfs';

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
  chains: [sepolia],
  transports: {
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
  createNewResume: (name: string, profileData?: Partial<ProfileMetadata>) => Promise<string>;
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
        <CivicAuthProvider>
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
  const { address: wagmiAddress, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { data: balanceData } = useBalance({ 
    address: userHasWallet(userContext) ? userContext.ethereum.address : wagmiAddress 
  });
  
  // Determine the primary wallet address (prioritize Civic Auth's embedded wallet)
  const address = userHasWallet(userContext) ? userContext.ethereum.address : wagmiAddress;
  
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
    if (!address) {
      throw new Error("Wallet not connected");
    }
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const resumeNFTAddress = contractAddresses.resumeNFT || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    return ResumeNFT__factory.connect(resumeNFTAddress, signer);
  }, [address]);
  
  const getVerificationRegistryContract = useCallback(async () => {
    if (!address) {
      throw new Error("Wallet not connected");
    }
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const registryAddress = contractAddresses.verificationRegistry || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
    return VerificationRegistry__factory.connect(registryAddress, signer);
  }, [address]);
  
  // Get tokens
  useEffect(() => {
    const getTokenIds = async () => {
      if (address) {
        try {
          const resumeNFT = await getResumeNFTContract();
          
          // First check if the contract has the function
          if (typeof resumeNFT.getEntriesByOwner !== 'function') {
            console.error("Contract function getEntriesByOwner not found");
            return;
          }

          try {
            // Call with catch to handle specific contract errors
            const tokenIds = await resumeNFT.getEntriesByOwner(address);
            setTokenIds(tokenIds || []);
            
            // Set the first token as active if none is selected
            if (tokenIds && tokenIds.length > 0 && !tokenId) {
              setTokenId(tokenIds[0]);
            }
          } catch (contractError) {
            console.error("Error calling getEntriesByOwner:", contractError);
            
            // Fallback: Try to get tokens by balanceOf and tokenOfOwnerByIndex if available
            try {
              if (typeof resumeNFT.balanceOf === 'function' && 
                  typeof resumeNFT.tokenOfOwnerByIndex === 'function') {
                
                const balance = await resumeNFT.balanceOf(address);
                const tokenIds = [];
                
                for (let i = 0; i < balance; i++) {
                  const tokenId = await resumeNFT.tokenOfOwnerByIndex(address, i);
                  tokenIds.push(tokenId);
                }
                
                setTokenIds(tokenIds);
                
                if (tokenIds.length > 0 && !tokenId) {
                  setTokenId(tokenIds[0]);
                }
              } else {
                console.error("Alternative token fetching methods not available");
              }
            } catch (fallbackError) {
              console.error("Error in fallback token fetching:", fallbackError);
            }
          }
        } catch (error) {
          console.error("Error getting token IDs:", error);
          // Don't let this crash the app
          setTokenIds([]);
        }
      }
    };
    
    getTokenIds();
  }, [address, getResumeNFTContract, tokenId]);
  
  // Create a new resume
  const createNewResume = async (name: string, profileData?: Partial<ProfileMetadata>) => {
    if (!isConnected || !address) {
      throw new Error("Wallet not connected. Please connect your wallet first.");
    }

    try {
      setIsLoading(true);
      console.log("Creating new resume for address:", address);

      // Create standardized profile metadata
      const defaultProfileData: ProfileMetadata = {
        name: name || "My Professional Resume",
        headline: profileData?.headline || "",
        bio: profileData?.bio || "", 
        location: profileData?.location || "",
        contactEmail: profileData?.contactEmail || "",
        avatarUrl: profileData?.avatarUrl || "",
        skills: profileData?.skills || [],
        languages: profileData?.languages || [],
        socialLinks: profileData?.socialLinks || {},
        lastUpdated: new Date().toISOString()
      };

      // Combine with any additional fields from passed profileData
      const mergedProfileData = {
        ...defaultProfileData,
        ...profileData, 
        name: name || defaultProfileData.name // Ensure name is set
      };

      // Upload to IPFS
      const metadataUri = await ipfsService.uploadStandardResumeMetadata(mergedProfileData);
      console.log("Resume metadata uploaded to IPFS:", metadataUri);

      // Get the contract
      const resumeNFT = await getResumeNFTContract();
      const tx = await resumeNFT.mintResume(address, metadataUri);

      console.log("Minting transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      // Find the token ID from the event
      const mintEvent = receipt?.logs.find(log => {
        try {
          const parsedLog = resumeNFT.interface.parseLog(log);
          return parsedLog?.name === "ResumeMinted";
        } catch (e) {
          return false;
        }
      });

      if (mintEvent) {
        const parsedLog = resumeNFT.interface.parseLog(mintEvent);
        const newTokenId = parsedLog?.args.tokenId;
        console.log("New resume token ID:", newTokenId);
        
        // Update state
        setTokenId(newTokenId?.toString());
        
        return newTokenId?.toString();
      } else {
        console.error("Could not find ResumeMinted event in transaction logs");
        throw new Error("Resume creation failed: Event not found");
      }
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
  
  // Connect wallet helper - prioritize connecting to the Civic embedded wallet
  const connectWallet = async () => {
    // Find the embedded wallet connector (Civic)
    const embeddedConnector = connectors.find(c => c.name?.toLowerCase().includes('embedded'));
    
    if (embeddedConnector) {
      await connect({ connector: embeddedConnector });
    } else {
      // Fallback to the first connector if Civic's embedded wallet connector isn't found
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
    if (!address || !tokenId) {
      return [];
    }
    
    try {
      const resumeNFT = await getResumeNFTContract();
      const entries = await resumeNFT.getResumeEntries(tokenId);
      
      // Transform the contract data to our ResumeEntry format
      const transformedEntries = await Promise.all(entries.map(async (entry: ContractStructs.ResumeEntryStructOutput, index: number) => {
        // Convert the numeric entryType to string EntryType
        const type = uint8ToEntryType(Number(entry.entryType));
        
        // Parse the metadata JSON to extract additional fields
        let additionalFields = {};
        try {
          if (entry.metadata) {
            const parsedMetadata = JSON.parse(entry.metadata);
            
            // Check if this metadata is stored on IPFS
            if (parsedMetadata.ipfsUri) {
              try {
                // We need to fetch the actual metadata from IPFS
                const ipfsUrl = ipfsService.getHttpUrl(parsedMetadata.ipfsUri);
                const response = await fetch(ipfsUrl);
                
                if (response.ok) {
                  // Successfully fetched the metadata from IPFS
                  additionalFields = await response.json();
                } else {
                  console.error("Failed to fetch metadata from IPFS:", response.statusText);
                  additionalFields = { ipfsUri: parsedMetadata.ipfsUri };
                }
              } catch (ipfsError) {
                console.error("Error fetching from IPFS:", ipfsError);
                additionalFields = { ipfsUri: parsedMetadata.ipfsUri };
              }
            } else {
              // Metadata is stored directly on-chain
              additionalFields = parsedMetadata;
            }
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
      }));
      
      return transformedEntries;
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
      if (!address || !tokenId) {
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
      
      // Create a metadata object for additional fields based on entry type
      const entryMetadata = {
        ...additionalFields,
        entryType: type,
        createdAt: new Date().toISOString()
      };
      
      // Upload entry-specific metadata to IPFS if there are additional fields
      let metadataJson = "{}";
      
      if (Object.keys(additionalFields).length > 0) {
        try {
          // Check if the metadata is large (over 200 chars when stringified)
          // If it's large, store it on IPFS; otherwise, store directly on-chain
          const rawMetadataJson = JSON.stringify(entryMetadata);
          
          if (rawMetadataJson.length > 200) {
            // For larger metadata sets, store them on IPFS
            const metadataUri = await ipfsService.uploadResumeMetadata(entryMetadata);
            
            // Store just the IPFS URI on-chain instead of the full metadata
            metadataJson = JSON.stringify({ 
              ipfsUri: metadataUri,
              size: rawMetadataJson.length
            });
          } else {
            // For smaller metadata, just store directly on-chain
            metadataJson = rawMetadataJson;
          }
        } catch (error) {
          console.error("Error creating metadata JSON:", error);
          metadataJson = JSON.stringify(entryMetadata);
        }
      }
      
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
        metadataJson
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
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Request verification
  const requestVerification = async (entryIndex: number) => {
    try {
      if (!address || !tokenId) {
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
    try {
      setResumeNames(prev => ({
        ...prev,
        [id.toString()]: {
          ...prev[id.toString()],
          name
        }
      }));
      
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
        
        // Upload metadata to IPFS
        const metadataUri = await ipfsService.uploadResumeMetadata(metadata);
        
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
    walletConnected: !!address,
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