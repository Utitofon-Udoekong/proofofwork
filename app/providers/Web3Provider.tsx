'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { userHasWallet } from "@civic/auth-web3";
import { embeddedWallet, useAutoConnect } from "@civic/auth-web3/wagmi";
import { useUser } from "@civic/auth-web3/react";
import { CivicAuthProvider } from "@civic/auth-web3/nextjs";
import { useAccount, useConnect, useBalance, useReadContract, useSwitchChain, useDisconnect } from "wagmi";
import { ResumeMetadata } from '@/app/lib/types';
import {
  ResumeNFT__factory,
  VerificationManager__factory,
} from '@/app/lib/contracts/contract-types';
import { contractAddresses } from '@/app/lib/contracts/addresses';
import { ipfsService } from '@/app/lib/services/ipfs';
import { readContract, simulateContract, writeContract, waitForTransactionReceipt } from '@wagmi/core'
import { parseError } from '@/app/lib/parseError';
import type { VerificationRequest, VerificationRequestStatus, Organization } from '@/app/lib/types';
import { useAppContractEvents } from '@/app/hooks/useAppContractEvents';

// Create a client
const queryClient = new QueryClient();

// Configure Wagmi
const wagmiConfig = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(process.env.sepoliaAlchemyApiKey),
  },
  connectors: [
    embeddedWallet(),
  ],
});


interface Web3ContextType {
  userAuthenticated: boolean;
  walletConnected: boolean;
  isConnectingWallet: boolean;
  authStatus: 'authenticated' | 'unauthenticated' | 'loading';
  address: string | null;
  balance: string | null;
  tokenIds: bigint[];
  // Methods
  connectWallet: () => Promise<void>;
  createWallet: () => Promise<void>;
  createNewResume: (name: string, ipfsUri: string) => Promise<string>;
  saveResume: (resumeId: string, resumeData: ResumeMetadata) => Promise<string>;
  getResumes: () => Promise<ResumeMetadata[]>;
  requestVerification: (resumeId: string, entryId: string, organizationAddress: string, message: string) => Promise<string>;
  getVerificationStatus: (resumeId: string, entryId: string) => Promise<{ status: 'pending' | 'approved' | 'rejected' | 'none'; details?: string; timestamp?: number }>;
  isLoading: boolean;
  getResumeById: (resumeId: string) => Promise<ResumeMetadata | null>;
  getOrganizations: () => Promise<Organization[]>;
  verifyOrganization: (orgAddress: string) => Promise<void>;
  revokeOrganization: (orgAddress: string) => Promise<void>;
  removeOrganization: (orgAddress: string) => Promise<void>;
  getOrganizationDetails: (address: string) => Promise<Organization | null>;
  registerOrganization: (name: string, email: string, website: string) => Promise<string>;
  logout: () => Promise<boolean>;
  getPendingVerificationRequests: () => Promise<VerificationRequest[]>;
  getUserVerificationRequests: () => Promise<VerificationRequest[]>;
  approveVerificationRequest: (requestId: number, verificationDetails: string) => Promise<string>;
  rejectVerificationRequest: (requestId: number, reason: string) => Promise<string>;
}

const Web3Context = createContext<Web3ContextType | null>(null);

// Provider component that combines Web3Service functionality with Civic Auth
export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <CivicAuthProvider chains={[sepolia]} initialChain={sepolia} >
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
  // Auto-connect the wallet if user has one
  useAutoConnect();
  const { address: wagmiAddress, isConnected, isConnecting } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balanceData } = useBalance({
    address: userHasWallet(userContext) ? userContext.ethereum.address : wagmiAddress
  });
  const address = userHasWallet(userContext) ? userContext.ethereum.address : wagmiAddress;

  const [tokenIds, setTokenIds] = useState<bigint[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Track auth status
  const authStatus = useMemo(() => {
    if (userContext.isLoading) return 'loading';
    return userContext.user ? 'authenticated' : 'unauthenticated';
  }, [userContext.isLoading, userContext.user]);

  // Initialize IPFS service on first load
  useEffect(() => {
    const initIPFS = async () => {
      try {
        await ipfsService.initialize();
      } catch (error) {
        console.error('Failed to initialize IPFS service:', error);
      }
    };
    initIPFS();
  }, []);

  // Contract interaction hooks
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

      } catch (error) {
        console.error("Error fetching token IDs:", error);
      }
    };

    fetchTokenIds();
  }, [address, balance]);

  // Get all resumes for the user
  const getResumes = useCallback(async (): Promise<ResumeMetadata[]> => {
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
          metadata.tokenId = tokenId.toString();
          resumes.push(metadata);
        }
      }

      return resumes;
    } catch (error) {
      console.error("Error fetching resumes:", error);
      return [];
    }
  }, [address, tokenIds]);

  // Request verification for an entry
  const requestVerification = async (resumeId: string, entryId: string, organizationAddress: string, message: string): Promise<string> => {
    if (!address) {
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
          address as `0x${string}`,
          BigInt(resumeId),
          entryId,
          organizationAddress as `0x${string}`,
          message
        ],
        account: address as `0x${string}`,
        chainId: sepolia.id,
      });

      const result = await writeContract(wagmiConfig, request);
      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash: result });
                  return receipt.transactionHash;
    } catch (error) {
      throw new Error(parseError(error));
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
    if (!balanceData || BigInt(balanceData.value) === BigInt(0)) {
      throw new Error("Insufficient funds. Please ensure you have enough ETH for gas fees.");
    }

    setIsLoading(true);

    try {
      // Check if we're on the correct network
      const currentChain = wagmiConfig.getClient().chain;
      if (currentChain.id !== sepolia.id) {
        try {
          switchChain({ chainId: sepolia.id });
        } catch (error: unknown) {
          if (error && typeof error === 'object' && 'code' in error && error.code === 4001) {
            throw new Error("Please switch to Sepolia network to continue");
          }
          throw new Error(parseError(error));
        }
      }

      const { request } = await simulateContract(wagmiConfig, {
        abi: ResumeNFT__factory.abi,
        address: contractAddresses.resumeNFT as `0x${string}`,
        functionName: 'mintResume',
        args: [address as `0x${string}`, ipfsUri],
        account: address as `0x${string}`,
        chainId: sepolia.id,
      })

      const hash = await writeContract(wagmiConfig, request);
      await waitForTransactionReceipt(wagmiConfig, { hash });
      
      if (!hash) {
        throw new Error("Failed to mint resume - no result returned");
      }

      return hash;
    } catch (error: unknown) {
      throw new Error(parseError(error));
    } finally {
      setIsLoading(false);
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

  // Save entire resume to IPFS and update on-chain
  const saveResume = async (resumeId: string, resumeData: ResumeMetadata): Promise<string> => {
    if (!isConnected || !address) {
      throw new Error("Wallet not connected. Please connect your wallet first.");
    }

    try {
      setIsLoading(true);
            const metadataUri = await ipfsService.uploadResumeMetadata(resumeData);

      const { request } = await simulateContract(wagmiConfig, {
        abi: ResumeNFT__factory.abi,
        address: contractAddresses.resumeNFT as `0x${string}`,
        functionName: 'updateResumeURI',
        args: [BigInt(resumeId), metadataUri],
        account: address as `0x${string}`,
        chainId: sepolia.id,
      })

      const result = await writeContract(wagmiConfig, request)
      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash: result });
      
      if (!result) {
        throw new Error("Failed to update resume URI - no result returned");
      }

      return receipt.transactionHash;
    } catch (error) {
      throw new Error(parseError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const getResumeById = async (resumeId: string): Promise<ResumeMetadata | null> => {
    try {
      const tokenURI = await readContract(wagmiConfig, {
        address: contractAddresses.resumeNFT as `0x${string}`,
        abi: ResumeNFT__factory.abi,
        functionName: 'tokenURI',
        args: [BigInt(resumeId)],
        chainId: sepolia.id,
      });
      const metadata = await ipfsService.getResumeMetadata(tokenURI);
      if (metadata) {
        metadata.tokenId = resumeId;
        return metadata;
      }
      return null;
    } catch (error) {
      throw new Error(parseError(error));
    }
  };

  // Memoized getVerificationStatus
  const getVerificationStatus = useCallback(async (resumeId: string, entryId: string): Promise<{ status: 'pending' | 'approved' | 'rejected' | 'none'; details?: string; timestamp?: number }> => {
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
      throw new Error(parseError(error));
    }
  }, []);

  // Memoized getOrganizations
  const getOrganizations = useCallback(async (): Promise<Organization[]> => {
    try {
      // Get the total number of organizations
      const orgCount = await readContract(wagmiConfig, {
        address: contractAddresses.verificationManager as `0x${string}`,
        abi: VerificationManager__factory.abi,
        functionName: 'getOrganizationCount',
      });

      const organizations: Organization[] = [];

      // Fetch each organization's details
      for (let i = 0; i < Number(orgCount); i++) {
        const orgAddress = await readContract(wagmiConfig, {
          address: contractAddresses.verificationManager as `0x${string}`,
          abi: VerificationManager__factory.abi,
          functionName: 'getOrganizationAtIndex',
          args: [BigInt(i)],
          chainId: sepolia.id,
        });
        const orgDetails = await readContract(wagmiConfig, {
          address: contractAddresses.verificationManager as `0x${string}`,
          abi: VerificationManager__factory.abi,
          functionName: 'getOrganizationDetails',
          args: [orgAddress],
          chainId: sepolia.id,
        });
        organizations.push({
          address: orgAddress.toString(),
          name: orgDetails[0],
          email: orgDetails[1],
          website: orgDetails[2],
          isVerified: orgDetails[3],
          verificationTimestamp: Number(orgDetails[4]),
          lastUpdateTimestamp: Number(orgDetails[5]),
          exists: orgDetails[6],
        });
      }
      return organizations;
    } catch (error) {
      throw new Error(parseError(error));
    }
  }, []);

  const verifyOrganization = async (orgAddress: string): Promise<void> => {
    if (!address) throw new Error("Wallet not connected");
    
    try {
      const { request } = await simulateContract(wagmiConfig, {
        abi: VerificationManager__factory.abi,
        address: contractAddresses.verificationManager as `0x${string}`,
        functionName: 'verifyOrganization',
        args: [orgAddress as `0x${string}`],
        account: address as `0x${string}`,
        chainId: sepolia.id,
      });

      const hash = await writeContract(wagmiConfig, request);
      await waitForTransactionReceipt(wagmiConfig, { hash });
    } catch (err) {
      console.error("Error verifying organization:", err);
      throw new Error(parseError(err));
    }
  };

  const revokeOrganization = async (orgAddress: string): Promise<void> => {
    if (!address) throw new Error("Wallet not connected");
    
    try {
      const { request } = await simulateContract(wagmiConfig, {
        abi: VerificationManager__factory.abi,
        address: contractAddresses.verificationManager as `0x${string}`,
        functionName: 'revokeOrganization',
        args: [orgAddress as `0x${string}`],
        account: address as `0x${string}`,
        chainId: sepolia.id,
      });

      const hash = await writeContract(wagmiConfig, request);
      await waitForTransactionReceipt(wagmiConfig, { hash });
    } catch (error) {
      console.error("Error revoking organization:", error);
      throw new Error(parseError(error));
    }
  };

  const removeOrganization = async (orgAddress: string): Promise<void> => {
    if (!address) throw new Error("Wallet not connected");
    
    try {
      const { request } = await simulateContract(wagmiConfig, {
        abi: VerificationManager__factory.abi,
        address: contractAddresses.verificationManager as `0x${string}`,
        functionName: 'removeOrganization',
        args: [orgAddress as `0x${string}`],
        account: address as `0x${string}`,
        chainId: sepolia.id,
      });

      const hash = await writeContract(wagmiConfig, request);
      await waitForTransactionReceipt(wagmiConfig, { hash });
    } catch (error) {
      console.error("Error removing organization:", error);
      throw new Error(parseError(error));
    }
  };

  const getOrganizationDetails = async (address: string): Promise<Organization | null> => {
    try {
      const orgDetails = await readContract(wagmiConfig, {
        address: contractAddresses.verificationManager as `0x${string}`,
        abi: VerificationManager__factory.abi,
        functionName: 'getOrganizationDetails',
        args: [address as `0x${string}`],
        chainId: sepolia.id,
      });

      return {
        address: address,
        name: orgDetails[0],
        email: orgDetails[1],
        website: orgDetails[2],
        isVerified: orgDetails[3],
        verificationTimestamp: Number(orgDetails[4]),
        lastUpdateTimestamp: Number(orgDetails[5]),
        exists: orgDetails[6],
      };
    } catch (err) {
      console.error("Error getting organization details:", err);
      return null;
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
            return receipt.transactionHash;
    } catch (error) {
      throw new Error(parseError(error));
    }
  };

  // Get pending verification requests for the organization
  const getPendingVerificationRequests = async (): Promise<VerificationRequest[]> => {
    if (!address) throw new Error('No wallet connected');
    const statusMap: VerificationRequestStatus[] = ["pending", "approved", "rejected"];
    try {
      const requestIds = await readContract(wagmiConfig, {
        address: contractAddresses.verificationManager as `0x${string}`,
        abi: VerificationManager__factory.abi,
        functionName: 'getPendingRequestsForOrg',
        args: [address as `0x${string}`, BigInt(0), BigInt(50)], // Get up to 50 requests
      });

      const requests = await Promise.all(
        requestIds.map(async (id) => {
          const request = await readContract(wagmiConfig, {
            address: contractAddresses.verificationManager as `0x${string}`,
            abi: VerificationManager__factory.abi,
            functionName: 'getRequest',
            args: [id],
          });

          return {
            id: Number(id),
            user: request.user.toString(),
            resumeId: Number(request.resumeId),
            entryId: request.entryId,
            details: request.details,
            status: statusMap[Number(request.status)],
            timestamp: Number(request.timestamp),
            verificationDetails: request.verificationDetails,
          } as VerificationRequest;
        })
      );

      return requests;
    } catch (error) {
      throw new Error(parseError(error));
    }
  };

  // Get verification requests for a user
  const getUserVerificationRequests = async (): Promise<VerificationRequest[]> => {
    if (!address) throw new Error('No wallet connected');
    const statusMap: VerificationRequestStatus[] = ["pending", "approved", "rejected"];
    try {
      const requestIds = await readContract(wagmiConfig, {
        address: contractAddresses.verificationManager as `0x${string}`,
        abi: VerificationManager__factory.abi,
        functionName: 'getUserRequests',
        args: [address as `0x${string}`, BigInt(0), BigInt(50)], // Get up to 50 requests
      });

      const requests = await Promise.all(
        requestIds.map(async (id) => {
          const request = await readContract(wagmiConfig, {
            address: contractAddresses.verificationManager as `0x${string}`,
            abi: VerificationManager__factory.abi,
            functionName: 'getRequest',
            args: [id],
          });

          return {
            id: Number(id),
            user: request.user.toString(),
            resumeId: Number(request.resumeId),
            entryId: request.entryId,
            details: request.details,
            status: statusMap[Number(request.status)],
            timestamp: Number(request.timestamp),
            verificationDetails: request.verificationDetails,
          } as VerificationRequest;
        })
      );

      return requests;
    } catch (error) {
      throw new Error(parseError(error));
    }
  };

  // Approve a verification request
  const approveVerificationRequest = async (requestId: number, verificationDetails: string): Promise<string> => {
    if (!address) throw new Error('No wallet connected');

    try {
      setIsLoading(true);
      const { request } = await simulateContract(wagmiConfig, {
        address: contractAddresses.verificationManager as `0x${string}`,
        abi: VerificationManager__factory.abi,
        functionName: 'approveRequest',
        args: [BigInt(requestId), verificationDetails],
        account: address as `0x${string}`,
        chainId: sepolia.id,
      });

      const result = await writeContract(wagmiConfig, request);
      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash: result });
      return receipt.transactionHash;
    } catch (error) {
      throw new Error(parseError(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Reject a verification request
  const rejectVerificationRequest = async (requestId: number, reason: string): Promise<string> => {
    if (!address) throw new Error('No wallet connected');

    try {
      setIsLoading(true);
      const { request } = await simulateContract(wagmiConfig, {
        address: contractAddresses.verificationManager as `0x${string}`,
        abi: VerificationManager__factory.abi,
        functionName: 'rejectRequest',
        args: [BigInt(requestId), reason],
        account: address as `0x${string}`,
        chainId: sepolia.id,
      });

      const result = await writeContract(wagmiConfig, request);
      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash: result });
      return receipt.transactionHash;
    } catch (error) {
      throw new Error(parseError(error));
    } finally {
      setIsLoading(false);
    }
  };

  // --- LOGOUT METHOD ---
  const logout = async (): Promise<boolean> => {
    try {
      if (userContext.signOut) await userContext.signOut();
      disconnect();
      return true;
    } catch (e) {
      console.error("Error during logout:", e);
      return false;
    }
  };

  const queryClient = useQueryClient();

  useAppContractEvents((eventName, logs, contract) => {
    if (contract === 'VerificationManager') {
      if (
        eventName === 'OrganizationAdded' ||
        eventName === 'OrganizationVerified' ||
        eventName === 'OrganizationRevoked' ||
        eventName === 'OrganizationRemoved'
      ) {
        queryClient.invalidateQueries({ queryKey: ['organizations'] });
        queryClient.invalidateQueries({ queryKey: ['organizationDetails'] });
      }
      if (
        eventName === 'RequestCreated' ||
        eventName === 'RequestApproved' ||
        eventName === 'RequestRejected'
      ) {
        queryClient.invalidateQueries({ queryKey: ['verificationRequests'] });
      }
    }
    if (contract === 'ResumeNFT') {
      if (eventName === 'Transfer') {
        queryClient.invalidateQueries({ queryKey: ['resumes'] });
      }
    }
  });

  // Create context value
  const contextValue: Web3ContextType = {
    userAuthenticated: !!userContext.user,
    walletConnected: !!address,
    isConnectingWallet: isConnecting,
    authStatus,
    address: address || null,
    balance: balanceData ? `${(Number(balanceData.value) / 10 ** 18).toFixed(4)} ${balanceData.symbol}` : null,
    tokenIds,
    connectWallet,
    createWallet,
    createNewResume,
    saveResume,
    getResumes,
    requestVerification,
    getVerificationStatus,
    isLoading,
    getResumeById,
    getOrganizations,
    verifyOrganization,
    revokeOrganization,
    removeOrganization,
    getOrganizationDetails,
    registerOrganization,
    logout,
    getPendingVerificationRequests,
    getUserVerificationRequests,
    approveVerificationRequest,
    rejectVerificationRequest,
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