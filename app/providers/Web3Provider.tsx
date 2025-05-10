'use client';

// declare global {
//   interface Window {
//     ethereum?: import('ethers').Eip1193Provider;
//   }
// }

import React, { createContext, useContext, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useMutation } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia } from "viem/chains";
import { userHasWallet } from "@civic/auth-web3";
import { embeddedWallet } from "@civic/auth-web3/wagmi";
import { CivicAuthProvider } from "@civic/auth-web3/react";
import { useUser } from "@civic/auth-web3/react";
import { useAccount, useConnect, useBalance, useWriteContract, useReadContract, useEstimateGas, useSwitchChain } from "wagmi";
import { useAutoConnect } from "@civic/auth-web3/wagmi";
import { ResumeMetadata } from '@/app/lib/types';
import { 
  ResumeNFT__factory,
  VerificationManager__factory,
} from '@/app/lib/contracts/contract-types';
import { contractAddresses } from '@/app/lib/contracts/addresses';
import { ipfsService } from '@/app/lib/services/ipfs';
import { estimateGas } from 'viem/actions';
import { parseEther } from 'viem';
import { readContract, writeContract, simulateContract, getAccount, waitForTransactionReceipt } from '@wagmi/core'

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


// Custom hooks for contract interactions
// export function useContractWriteMutation() {
//   const { writeContractAsync } = useWriteContract()

//   return useMutation({
//     mutationFn: async ({ address, abi, functionName, args }: { address: `0x${string}`, abi: any, functionName: string, args: any }) => {
//       try {
//         console.log("Attempting contract write with:", {
//           address,
//           functionName,
//           args,
//         });

//         // Estimate gas first
//         const gasEstimate = await estimateGas(wagmiConfig.getClient(), {
//           account: address,
//           to: address,
//           value: parseEther('0.000000000000000001'),
//         });

//         console.log("Estimated gas:", {
//           gasEstimate: gasEstimate.toString(),
//           gasEstimateInEth: (Number(gasEstimate) * 0.000000001).toFixed(8), // Approximate ETH cost
//         });

//         const result = await writeContractAsync({
//           address,
//           abi,
//           functionName,
//           args,
//           chainId: sepolia.id,
//           // chainId: sepolia.id,
//           // gas: gasEstimate, // Use the estimated gas
//         });

//         console.log("Contract write result:", result);

//         if (!result) {
//           throw new Error("Contract write failed - no result returned");
//         }

//         return result;
//       } catch (error: any) {
//         console.error("Contract write error details:", {
//           error,
//           message: error?.message,
//           code: error?.code,
//           data: error?.data,
//           stack: error?.stack,
//         });

//         // Handle specific error cases
//         if (error?.message?.includes('insufficient funds')) {
//           throw new Error("Insufficient funds to complete the transaction. Please ensure you have enough ETH for gas fees.");
//         }

//         // Handle other common errors
//         if (error?.code === 'INSUFFICIENT_FUNDS') {
//           throw new Error("Insufficient funds to complete the transaction. Please ensure you have enough ETH for gas fees.");
//         }

//         if (error?.code === 'UNPREDICTABLE_GAS_LIMIT') {
//           throw new Error("Failed to estimate gas. The transaction may fail or require manual gas limit.");
//         }

//         // Re-throw other errors with more context
//         throw new Error(`Contract write failed: ${error?.message || 'Unknown error'}`);
//       }
//     },
//     onSuccess: (data) => {
//       console.log("Contract write successful:", data);
//     },
//     onError: (error) => {
//       console.error("Contract write failed:", error);
//     },
//     onMutate(variables) {
//       console.log("Contract write started:", variables);
//     },
//     onSettled(data, error, variables, context) {
//       console.log("Contract write settled:", { data, error, variables, context });
//     },
//   })
// }

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
  createNewResume: (name: string, ipfsUri: string) => Promise<string>;
  selectResume: (id: bigint) => void;
  updateResumeURI: (tokenId: string, metadataUri: string) => Promise<boolean>;
  saveResume: (resumeData: ResumeMetadata) => Promise<boolean>;
  getResumes: () => Promise<ResumeMetadata[]>;
  requestVerification: (entryId: number, organizationAddress: string, message: string) => Promise<void>;
  getVerificationStatus: (resumeId: string, entryId: string) => Promise<{ status: 'pending' | 'approved' | 'rejected' | 'none'; details?: string; timestamp?: number }>;
  isLoading: boolean;
  getResumeById: (resumeId: string) => Promise<ResumeMetadata | null>;
  getOrganizations: () => Promise<Array<{ address: string; name: string }>>;
  getOrganizationDetails: (address: string) => Promise<any>;
  registerOrganization: (name: string, email: string, website: string) => Promise<string>;
}

const Web3Context = createContext<Web3ContextType | null>(null);

// Provider component that combines Web3Service functionality with Civic Auth
export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <CivicAuthProvider clientId='25bca813-5e88-4086-bd3e-ad116da08d90' chains={[sepolia]} initialChain={sepolia} >
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
  const address = userHasWallet(userContext) ? userContext.ethereum.address : wagmiAddress;
  
  const [tokenId, setTokenId] = useState<bigint | null>(null);
  const [tokenIds, setTokenIds] = useState<bigint[]>([]);
  const [resumeNames, setResumeNames] = useState<Record<string, ResumeMetadata>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Contract interaction hooks
  // const contractWrite = useContractWriteMutation();
  const { switchChain } = useSwitchChain();
  
  // Query for token IDs owned by the user
  const { data: balance } = useReadContract({
    address: contractAddresses.resumeNFT as `0x${string}`,
    abi: ResumeNFT__factory.abi,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address,
    }
  });

  // Query for token URI of selected token
  const { data: tokenURI } = useReadContract({
    address: contractAddresses.resumeNFT as `0x${string}`,
    abi: ResumeNFT__factory.abi,
    functionName: 'tokenURI',
    args: tokenId ? [tokenId] : undefined,
    query: {
      enabled: !!tokenId,
    }
  });
  
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
  
  // Fetch token IDs when balance changes
  useEffect(() => {
    const fetchTokenIds = async () => {
      if (!address || !balance) return;

      try {
        const newTokenIds: bigint[] = [];
        for (let i = 0; i < Number(balance); i++) {
          const result = await readContract(wagmiConfig, {
            address: contractAddresses.resumeNFT as `0x${string}`,
            abi: ResumeNFT__factory.abi,
            functionName: 'tokenOfOwnerByIndex',
            args: [address as `0x${string}`, BigInt(i)],
          });
          if (result) {
            newTokenIds.push(result as bigint);
          }
        }
        setTokenIds(newTokenIds);
            
        // Set the first token as active if none is selected
        if (newTokenIds.length > 0 && !tokenId) {
          setTokenId(newTokenIds[0]);
        }
      } catch (error) {
        console.error("Error fetching token IDs:", error);
      }
    };

    fetchTokenIds();
  }, [address, balance, tokenId]);
  
  // Get all resumes for the user
  const getResumes = async (): Promise<ResumeMetadata[]> => {
    if (!address || !tokenIds.length) {
      return [];
    }

    try {
      const balance = await readContract(wagmiConfig, {
        address: contractAddresses.resumeNFT as `0x${string}`,
        abi: ResumeNFT__factory.abi,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      });
      
      if (balance === BigInt(0)) return [];

      const resumes: Array<ResumeMetadata> = [];
      
      // Fetch all NFTs owned by the address
      for (let i = 0; i < Number(balance); i++) {
        const tokenId = await readContract(wagmiConfig, {
          address: contractAddresses.resumeNFT as `0x${string}`,
          abi: ResumeNFT__factory.abi,
          functionName: 'tokenOfOwnerByIndex',
          args: [address as `0x${string}`, BigInt(i)],
        });
        
        if (!tokenId) continue;

        const tokenURI = await readContract(wagmiConfig, {
          address: contractAddresses.resumeNFT as `0x${string}`,
          abi: ResumeNFT__factory.abi,
          functionName: 'tokenURI',
          args: [tokenId],
        });
        
        if (!tokenURI) continue;

        const metadata = await ipfsService.getResumeMetadata(tokenURI);
        if (metadata) {
          console.log('metadata', metadata);
          metadata.tokenId = tokenId.toString();
          resumes.push(metadata);
        }
      }

      return resumes;
    } catch (error) {
      console.error("Error fetching resumes:", error);
      return [];
    }
  };
  
  // Request verification for an entry
  const requestVerification = async (entryId: number, organizationAddress: string, message: string): Promise<void> => {
    if (!tokenId || !address) {
      throw new Error('No resume selected or wallet not connected');
    }

    try {
      setIsLoading(true);
      
      // Call requestVerification on the ResumeNFT contract
      const { request } = await simulateContract(wagmiConfig, {
        address: contractAddresses.resumeNFT as `0x${string}`,
        abi: ResumeNFT__factory.abi,
        functionName: 'requestVerification',
        args: [
          tokenId,
          `entry${entryId}`,
          organizationAddress as `0x${string}`,
          message
        ],
        account: address as `0x${string}`,
        chainId: sepolia.id,
      });

      const result = await writeContract(wagmiConfig, request);
      console.log('Verification request submitted:', result);
    } catch (error) {
      console.error('Error requesting verification:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create a new resume
  const createNewResume = async (name: string, ipfsUri: string): Promise<string> => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    // Check if we have a balance
    console.log("Balance data:", balanceData);
    if (!balanceData || BigInt(balanceData.value) === BigInt(0)) {
      throw new Error("Insufficient funds. Please ensure you have enough ETH for gas fees.");
    }

    setIsLoading(true);
    console.log("Creating new resume:", {
      name,
      ipfsUri,
      address,
      contractAddress: contractAddresses.resumeNFT,
      balance: balanceData?.value.toString(),
      balanceInEth: (Number(balanceData?.value) / 1e18).toFixed(4),
    });
    
    try {
      // Check if we're on the correct network
      const currentChain = wagmiConfig.getClient().chain;
      console.log("Current chain:", currentChain);
      if (currentChain.id !== sepolia.id) {
        console.log("Switching to Sepolia network...");
        try {
          switchChain({ chainId: sepolia.id });
        } catch (error: any) {
          if (error?.code === 4001) {
            throw new Error("Please switch to Sepolia network to continue");
          }
          throw new Error(`Failed to switch network: ${error?.message || 'Unknown error'}`);
        }
      }

      const { connector } = getAccount(wagmiConfig)
      const { request } = await simulateContract(wagmiConfig, {
        abi: ResumeNFT__factory.abi,
        address: contractAddresses.resumeNFT as `0x${string}`,
        functionName: 'mintResume',
        args: [address as `0x${string}`, ipfsUri],
        account: address as `0x${string}`,
        chainId: sepolia.id,
        connector
      })

      console.log("Simulated contract request:", request);

      const result = await writeContract(wagmiConfig, request)
      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash: result });

      console.log("Mint resume result:", result);
      console.log("Transaction receipt:", receipt);

      if (!result) {
        throw new Error("Failed to mint resume - no result returned");
      }

      return receipt.transactionHash;
    } catch (error: any) {
      console.error("Error creating new resume:", {
        error,
        message: error?.message,
        code: error?.code,
        data: error?.data,
      });
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
    const embeddedConnector = connectors.find(c => c.name?.toLowerCase().includes('embedded'));
    if (embeddedConnector) {
      connect({ connector: embeddedConnector });
    } else {
      connect({ connector: connectors[0] });
    }
  };
  
  // Create wallet if user doesn't have one
  const createWallet = async () => {
    if (userContext.user && !userHasWallet(userContext)) {
      await userContext.createWallet();
      await connectWallet();
    }
  };
  
  // Update an existing resume's metadata URI
  const updateResumeURI = async (tokenId: string, metadataUri: string): Promise<boolean> => {
    if (!isConnected || !address) {
      throw new Error("Wallet not connected. Please connect your wallet first.");
    }

    try {
      setIsLoading(true);
      console.log("Updating resume metadata for token:", tokenId);

      const { connector } = getAccount(wagmiConfig)
      const { request } = await simulateContract(wagmiConfig, {
        abi: ResumeNFT__factory.abi,
        address: contractAddresses.resumeNFT as `0x${string}`,
        functionName: 'updateResumeURI',
        args: [BigInt(tokenId), metadataUri],
        account: address as `0x${string}`,
        chainId: sepolia.id,
        connector
      })
      
      const result = await writeContract(wagmiConfig, request)

      console.log("Update resume URI result:", result);

      if (!result) {
        throw new Error("Failed to update resume URI - no result returned");
      }

      return true;
    } catch (error) {
      console.error("Error updating resume URI:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Save entire resume to IPFS and update on-chain
  const saveResume = async (resumeData: ResumeMetadata): Promise<boolean> => {
    if (!address || !tokenId) {
      throw new Error("Resume not initialized");
    }

    try {
      setIsLoading(true);

      const metadataUri = await ipfsService.uploadResumeMetadata(resumeData);

      const { connector } = getAccount(wagmiConfig)
      const { request } = await simulateContract(wagmiConfig, {
        abi: ResumeNFT__factory.abi,
        address: contractAddresses.resumeNFT as `0x${string}`,
        functionName: 'updateResumeURI',
        args: [tokenId, metadataUri],
        account: address as `0x${string}`,
        chainId: sepolia.id,
        connector
      })
      
      const result = await writeContract(wagmiConfig, request)

      console.log("Update resume URI result:", result);

      if (!result) {
        throw new Error("Failed to update resume URI - no result returned");
      }

      return true;
    } catch (error) {
      console.error("Error saving resume:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };


  const getResumeById = async (resumeId: string): Promise<ResumeMetadata | null> => {
    try {
      const resume = await getResumes().then(resumes => resumes.find(r => r.tokenId === resumeId));
      return resume || null;
    } catch (error) {
      console.error('Error fetching resume by id:', error);
      throw error;
    }
  }

  const getOrganizations = async (): Promise<Array<{ address: string; name: string }>> => {
    try {
      // Get the total number of organizations
      const orgCount = await readContract(wagmiConfig, {
        address: contractAddresses.verificationManager as `0x${string}`,
        abi: VerificationManager__factory.abi,
        functionName: 'getOrganizationCount',
      });

      const organizations: Array<{ address: string; name: string }> = [];

      // Fetch each organization's details
      for (let i = 0; i < Number(orgCount); i++) {
        const orgAddress = await readContract(wagmiConfig, {
          address: contractAddresses.verificationManager as `0x${string}`,
          abi: VerificationManager__factory.abi,
          functionName: 'getOrganizationAtIndex',
          args: [BigInt(i)],
        });

        const orgDetails = await readContract(wagmiConfig, {
          address: contractAddresses.verificationManager as `0x${string}`,
          abi: VerificationManager__factory.abi,
          functionName: 'getOrganizationDetails',
          args: [orgAddress],
        });

        // Only include verified organizations
        if (orgDetails[3]) { // orgDetails[3] is the verifiedStatus
          organizations.push({
            address: orgAddress.toString(),
            name: orgDetails[0], // orgDetails[0] is the name
          });
        }
      }

      return organizations;
    } catch (error) {
      console.error("Error fetching organizations:", error);
      return [];
    }
  };

  const getVerificationStatus = async (resumeId: string, entryId: string): Promise<{ status: 'pending' | 'approved' | 'rejected' | 'none'; details?: string; timestamp?: number }> => {
    try {
      // Get the request ID for this entry
      const requestId = await readContract(wagmiConfig, {
        address: contractAddresses.verificationManager as `0x${string}`,
        abi: VerificationManager__factory.abi,
        functionName: 'resumeEntryRequests',
        args: [BigInt(resumeId), entryId],
      });

      if (!requestId || requestId === BigInt(0)) {
        return { status: 'none' as const };
      }

      // Get the request details
      const request = await readContract(wagmiConfig, {
        address: contractAddresses.verificationManager as `0x${string}`,
        abi: VerificationManager__factory.abi,
        functionName: 'getRequest',
        args: [requestId],
      });

      // Convert the status from the contract enum to our string type
      const status = request.status === 0 ? 'pending' as const : 
                    request.status === 1 ? 'approved' as const : 'rejected' as const;

      return {
        status,
        details: request.verificationDetails,
        timestamp: Number(request.timestamp),
      };
    } catch (error) {
      console.error('Error getting verification status:', error);
      return { status: 'none' as const };
    }
  };

  const getOrganizationDetails = async (address: string) => {
    try {
      const details = await readContract(wagmiConfig, {
        address: contractAddresses.verificationManager as `0x${string}`,
        abi: VerificationManager__factory.abi,
        functionName: 'getOrganizationDetails',
        args: [address as `0x${string}`],
      });
      return details;
    } catch (error) {
      console.error('Error getting organization details:', error);
      throw error;
    }
  };

  const registerOrganization = async (name: string, email: string, website: string): Promise<string> => {
    if (!address) throw new Error('No wallet connected');
    
    try {
      const { request } = await simulateContract(wagmiConfig, {
        address: contractAddresses.verificationManager as `0x${string}`,
        abi: VerificationManager__factory.abi,
        functionName: 'addOrganization',
        args: [address as `0x${string}`, name, email, website],
        account: address as `0x${string}`,
        chainId: sepolia.id,
      });

      const result = await writeContract(wagmiConfig, request);
      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash: result });
      console.log('Receipt:', receipt);
      return receipt.transactionHash;
    } catch (error) {
      console.error('Error registering organization:', error);
      throw error;
    }
  };

  // Create context value
  const contextValue: Web3ContextType = {
    userAuthenticated: !!userContext.user,
    walletConnected: !!address,
    address: address || null,
    balance: balanceData ? `${(Number(balanceData.value) / 10 ** 18).toFixed(4)} ${balanceData.symbol}` : null,
    tokenId,
    tokenIds,
    resumeNames,
    connectWallet,
    createWallet,
    createNewResume,
    selectResume,
    updateResumeURI,
    saveResume,
    getResumes,
    requestVerification,
    getVerificationStatus,
    isLoading,
    getResumeById,
    getOrganizations,
    getOrganizationDetails,
    registerOrganization,
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