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
import { CivicAuthProvider } from "@civic/auth-web3/nextjs";
import { useUser } from "@civic/auth-web3/react";
import { useAccount, useConnect, useBalance, useWriteContract, useReadContract, useEstimateGas, useSwitchChain } from "wagmi";
import { useAutoConnect } from "@civic/auth-web3/wagmi";
import { ResumeMetadata } from '@/app/lib/types';
import { 
  ResumeNFT__factory,
} from '@/app/lib/contracts/contract-types';
import { contractAddresses } from '@/app/lib/contracts/addresses';
import { ipfsService } from '@/app/lib/services/ipfs';
import { estimateGas } from 'viem/actions';
import { parseEther } from 'viem';

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
export function useContractWriteMutation() {
  const { writeContractAsync } = useWriteContract()

  return useMutation({
    mutationFn: async ({ address, abi, functionName, args, chainId }: { address: `0x${string}`, abi: any, functionName: string, args: any, chainId: number }) => {
      try {
        console.log("Attempting contract write with:", {
          address,
          functionName,
          args,
        });

        // Estimate gas first
        const gasEstimate = await estimateGas(wagmiConfig.getClient(), {
          account: address,
          to: address,
          value: parseEther('0.000000000000000001'),
        });

        console.log("Estimated gas:", {
          gasEstimate: gasEstimate.toString(),
          gasEstimateInEth: (Number(gasEstimate) * 0.000000001).toFixed(8), // Approximate ETH cost
        });

        const result = await writeContractAsync({
          address,
          abi,
          functionName,
          args,
          chainId
          // chainId: sepolia.id,
          // gas: gasEstimate, // Use the estimated gas
        });

        console.log("Contract write result:", result);

        if (!result) {
          throw new Error("Contract write failed - no result returned");
        }

        return result;
      } catch (error: any) {
        console.error("Contract write error details:", {
          error,
          message: error?.message,
          code: error?.code,
          data: error?.data,
          stack: error?.stack,
        });

        // Handle specific error cases
        if (error?.message?.includes('insufficient funds')) {
          throw new Error("Insufficient funds to complete the transaction. Please ensure you have enough ETH for gas fees.");
        }

        // Handle other common errors
        if (error?.code === 'INSUFFICIENT_FUNDS') {
          throw new Error("Insufficient funds to complete the transaction. Please ensure you have enough ETH for gas fees.");
        }

        if (error?.code === 'UNPREDICTABLE_GAS_LIMIT') {
          throw new Error("Failed to estimate gas. The transaction may fail or require manual gas limit.");
        }

        // Re-throw other errors with more context
        throw new Error(`Contract write failed: ${error?.message || 'Unknown error'}`);
      }
    },
    onSuccess: (data) => {
      console.log("Contract write successful:", data);
    },
    onError: (error) => {
      console.error("Contract write failed:", error);
    },
    onMutate(variables) {
      console.log("Contract write started:", variables);
    },
    onSettled(data, error, variables, context) {
      console.log("Contract write settled:", { data, error, variables, context });
    },
  })
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
  createNewResume: (name: string, ipfsUri: string) => Promise<string>;
  selectResume: (id: bigint) => void;
  updateResumeName: (id: bigint, name: string) => Promise<void>;
  updateResumeURI: (tokenId: string, metadataUri: string) => Promise<boolean>;
  saveResume: (resumeData: ResumeMetadata) => Promise<boolean>;
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
  const address = userHasWallet(userContext) ? userContext.ethereum.address : wagmiAddress;
  
  const [tokenId, setTokenId] = useState<bigint | null>(null);
  const [tokenIds, setTokenIds] = useState<bigint[]>([]);
  const [resumeNames, setResumeNames] = useState<Record<string, ResumeMetadata>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Contract interaction hooks
  const contractWrite = useContractWriteMutation();
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
          const tokenId = useReadContract({
            address: contractAddresses.resumeNFT as `0x${string}`,
            abi: ResumeNFT__factory.abi,
            functionName: 'tokenOfOwnerByIndex',
            args: [address as `0x${string}`, BigInt(i)],
          });
          if (tokenId) {
            newTokenIds.push(tokenId.data as bigint);
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

      const result = await contractWrite.mutateAsync({
        address: contractAddresses.resumeNFT as `0x${string}`,
        abi: ResumeNFT__factory.abi,
        functionName: 'mintResume',
        args: [address as `0x${string}`, ipfsUri],
        chainId: sepolia.id,
      });

      if (!result) {
        throw new Error("Failed to mint resume - no result returned");
      }

      return result.toString();
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
      
      if (isConnected && address) {
        setIsLoading(true);
        
        const prevMeta = resumeNames[id.toString()] as ResumeMetadata | undefined;
        const metadata: ResumeMetadata = {
          version: prevMeta?.version || '1.0',
          profile: {
            ...(prevMeta?.profile || {
              name: name,
              lastUpdated: new Date().toISOString()
            }),
            name: name,
            lastUpdated: new Date().toISOString()
          },
          entries: prevMeta?.entries || [],
          chainId: prevMeta?.chainId,
          createdAt: prevMeta?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          name: name,
          description: prevMeta?.description || "ProofOfWork Resume",
          image: prevMeta?.image || "https://proofofwork.crypto/logo.png",
          external_url: prevMeta?.external_url,
          attributes: prevMeta?.attributes || []
        };

        const metadataUri = await ipfsService.uploadResumeMetadata(metadata);
        
        await contractWrite.mutateAsync({
          address: contractAddresses.resumeNFT as `0x${string}`,
          abi: ResumeNFT__factory.abi,
          functionName: 'updateResumeURI',
          args: [id, metadataUri],
          chainId: sepolia.id,
        });
      }
    } catch (error) {
      console.error("Error updating resume name:", error);
    } finally {
      setIsLoading(false);
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

      await contractWrite.mutateAsync({
        address: contractAddresses.resumeNFT as `0x${string}`,
        abi: ResumeNFT__factory.abi,
        functionName: 'updateResumeURI',
        args: [tokenId, metadataUri],
        chainId: sepolia.id,
      });

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

      await contractWrite.mutateAsync({
        address: contractAddresses.resumeNFT as `0x${string}`,
        abi: ResumeNFT__factory.abi,
        functionName: 'updateResumeURI',
        args: [tokenId, metadataUri],
        chainId: sepolia.id,
      });

      return true;
    } catch (error) {
      console.error("Error saving resume:", error);
      return false;
    } finally {
      setIsLoading(false);
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
    updateResumeName,
    updateResumeURI,
    saveResume,
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