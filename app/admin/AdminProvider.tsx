"use client";
import React, { createContext, useContext } from "react";
import { readContract, writeContract, simulateContract, waitForTransactionReceipt } from '@wagmi/core';
import { VerificationManager__factory } from '@/app/lib/contracts/contract-types';
import { contractAddresses } from '@/app/lib/contracts/addresses';
import { sepolia } from "wagmi/chains";
import { useAccount } from "wagmi";
import { adminWagmiConfig } from "./layout";

interface AdminContextType {
  verifyOrganization: (orgAddress: string) => Promise<void>;
  revokeOrganization: (orgAddress: string) => Promise<void>;
  removeOrganization: (orgAddress: string) => Promise<void>;
  getOrganizations: () => Promise<any[]>;
  address: string | undefined;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();

  const verifyOrganization = async (orgAddress: string) => {
    if (!address) throw new Error("Wallet not connected");
    const { request } = await simulateContract(adminWagmiConfig, {
      address: contractAddresses.verificationManager as `0x${string}`,
      abi: VerificationManager__factory.abi,
      functionName: 'verifyOrganization',
      args: [orgAddress as `0x${string}`],
      account: address as `0x${string}`,
      chainId: sepolia.id,
    });
    const result = await writeContract(adminWagmiConfig, request);
    await waitForTransactionReceipt(adminWagmiConfig, { hash: result });
  };

  const revokeOrganization = async (orgAddress: string) => {
    if (!address) throw new Error("Wallet not connected");
    const { request } = await simulateContract(adminWagmiConfig, {
      address: contractAddresses.verificationManager as `0x${string}`,
      abi: VerificationManager__factory.abi,
      functionName: 'revokeOrganization',
      args: [orgAddress as `0x${string}`],
      account: address as `0x${string}`,
      chainId: sepolia.id,
    });
    const result = await writeContract(adminWagmiConfig, request);
    await waitForTransactionReceipt(adminWagmiConfig, { hash: result });
  };

  const removeOrganization = async (orgAddress: string) => {
    if (!address) throw new Error("Wallet not connected");
    const { request } = await simulateContract(adminWagmiConfig, {
      address: contractAddresses.verificationManager as `0x${string}`,
      abi: VerificationManager__factory.abi,
      functionName: 'removeOrganization',
      args: [orgAddress as `0x${string}`],
      account: address as `0x${string}`,
      chainId: sepolia.id,
    });
    const result = await writeContract(adminWagmiConfig, request);
    await waitForTransactionReceipt(adminWagmiConfig, { hash: result });
  };

  const getOrganizations = async (): Promise<any[]> => {
    // Get the total number of organizations
    const orgCount = await readContract(adminWagmiConfig, {
      address: contractAddresses.verificationManager as `0x${string}`,
      abi: VerificationManager__factory.abi,
      functionName: 'getOrganizationCount',
      chainId: sepolia.id,
    });
    const organizations: any[] = [];
    for (let i = 0; i < Number(orgCount); i++) {
      const orgAddress = await readContract(adminWagmiConfig, {
        address: contractAddresses.verificationManager as `0x${string}`,
        abi: VerificationManager__factory.abi,
        functionName: 'getOrganizationAtIndex',
        args: [BigInt(i)],
        chainId: sepolia.id,
      });
      const orgDetails = await readContract(adminWagmiConfig, {
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
  };

  return (
    <AdminContext.Provider value={{ verifyOrganization, revokeOrganization, removeOrganization, getOrganizations, address }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within an AdminProvider");
  return ctx;
} 