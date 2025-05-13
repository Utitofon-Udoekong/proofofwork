"use client";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { metaMask } from "wagmi/connectors";
import { useState } from "react";
import { useUser } from "@civic/auth-web3/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { useWeb3 } from "../providers/Web3Provider";
import { useOrganizations } from '@/app/hooks/useOrganizations';
import { parseError } from '@/app/lib/parseError';
// Contract owner address
const OWNER_ADDRESS = process.env.contractOwnerAddress?.toLowerCase();

const AdminNavbar = () => {
  const { signOut } = useUser();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();

  const handleSignOut = async () => {
    try {
      await signOut();
      disconnect();
      redirect('/');
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <nav className="bg-gray-800 border-b border-gray-700 mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/admin" className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-xl font-bold text-white">Admin Dashboard</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="px-4 py-1 rounded-full bg-blue-600 flex items-center justify-center ">
                <span className="text-white text-sm font-medium">
                  {address ? `${address.slice(0, 4)}...${address.slice(-4)}` : '...'}
                </span>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { verifyOrganization, revokeOrganization, removeOrganization } = useWeb3();

  // Use the new hook for organizations
  const { data: orgs = [], isLoading: loadingOrgs, error } = useOrganizations();
  const [txLoading, setTxLoading] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  const isOwner = isConnected && address && address.toLowerCase() === OWNER_ADDRESS;

  // Admin actions
  const handleVerify = async (orgAddress: string) => {
    
    setTxLoading(orgAddress);
    setTxError(null);
    try {
      await verifyOrganization(orgAddress);
      // No need to manually update orgs, event-driven invalidation will refetch
    } catch (err: any) {
      setTxError(err.message || "Failed to verify organization");
    } finally {
      setTxLoading(null);
    }
  };

  const handleRevoke = async (orgAddress: string) => {
    setTxLoading(orgAddress);
    setTxError(null);
    try {
      await revokeOrganization(orgAddress);
    } catch (err: any) {
      setTxError(err.message || "Failed to revoke organization");
    } finally {
      setTxLoading(null);
    }
  };

  const handleRemove = async (orgAddress: string) => {
    setTxLoading(orgAddress);
    setTxError(null);
    try {
      await removeOrganization(orgAddress);
    } catch (err: any) {
      setTxError(err.message || "Failed to remove organization");
    } finally {
      setTxLoading(null);
    }
  };

  // UI
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-3xl font-bold text-white mb-6">Admin Login</h1>
        <button
          onClick={() => connect({ connector: metaMask() })}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded text-lg"
          disabled={isPending}
        >
          {isPending ? "Connecting..." : "Connect MetaMask"}
        </button>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="max-w-md mx-auto mt-20 bg-gray-800 p-8 rounded-lg border border-gray-700 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Admin Access Required</h1>
        <p className="text-gray-300">You must be connected as the contract owner to access this page.</p>
        <button
          onClick={() => disconnect()}
          className="mt-4 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <AdminNavbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="w-full mx-auto">

          <h1 className="text-2xl font-bold text-white mb-6">Admin: Organization Moderation</h1>
          {loadingOrgs ? (
            <div className="text-gray-300">Loading organizations...</div>
          ) : error ? (
            <div className="text-red-400">{parseError(error)}</div>
          ) : (
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <div className="grid grid-cols-12 gap-4 p-4 bg-gray-700 text-sm font-medium text-gray-300">
                <div className="col-span-3">Name</div>
                <div className="col-span-3">Email</div>
                <div className="col-span-3">Website</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1">Actions</div>
              </div>
              <div className="divide-y divide-gray-700">
                {orgs.map((org) => (
                  <div key={org.address} className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-750">
                    <div className="col-span-3">
                      <div className="font-medium text-white">{org.name}</div>
                      <div className="text-xs text-gray-400">{org.address}</div>
                    </div>
                    <div className="col-span-3 text-sm text-gray-300">{org.email}</div>
                    <div className="col-span-3 text-sm text-gray-300">{org.website}</div>
                    <div className="col-span-2">
                      {org.isVerified ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900 text-green-300">
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-900 text-yellow-300">
                          Pending
                        </span>
                      )}
                    </div>
                    <div className="col-span-1 flex items-center gap-4">
                      {!org.isVerified && (
                        <button
                          onClick={() => handleVerify(org.address)}
                          disabled={txLoading === org.address}
                          className="text-green-400 hover:text-green-300 disabled:opacity-50 cursor-pointer"
                          title="Verify"
                        >
                          {txLoading === org.address ? (
                            <span className="inline-block animate-spin">⟳</span>
                          ) : (
                            "✓"
                          )}
                        </button>
                      )}
                      {org.isVerified && (
                        <button
                          onClick={() => handleRevoke(org.address)}
                          disabled={txLoading === org.address}
                          className="text-yellow-400 hover:text-yellow-300 disabled:opacity-50 cursor-pointer"
                          title="Revoke"
                        >
                          {txLoading === org.address ? (
                            <span className="inline-block animate-spin">⟳</span>
                          ) : (
                            "↺"
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handleRemove(org.address)}
                        disabled={txLoading === org.address}
                        className="text-red-400 hover:text-red-300 disabled:opacity-50 cursor-pointer"
                        title="Remove"
                      >
                        {txLoading === org.address ? (
                          <span className="inline-block animate-spin">⟳</span>
                        ) : (
                          "×"
                        )}
                      </button>
                      {txError && txLoading === org.address && (
                        <div className="text-red-400 text-xs">{txError}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>

  );
} 