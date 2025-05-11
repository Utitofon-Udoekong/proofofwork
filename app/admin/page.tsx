"use client";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { metaMask } from "wagmi/connectors";
import { useEffect, useState } from "react";
import { useAdmin } from "./AdminProvider";

// Contract owner address
const OWNER_ADDRESS = process.env.contractOwnerAddress?.toLowerCase();

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { verifyOrganization, revokeOrganization, removeOrganization, getOrganizations } = useAdmin();

  const [orgs, setOrgs] = useState<any[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txLoading, setTxLoading] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  const isOwner = isConnected && address && address.toLowerCase() === OWNER_ADDRESS;

  // Fetch all organizations after authentication
  useEffect(() => {
    if (!isOwner) return;
    setLoadingOrgs(true);
    (async () => {
      try {
        const organizations = await getOrganizations();
        setOrgs(organizations);
      } catch (err) {
        setError("Failed to load organizations");
      } finally {
        setLoadingOrgs(false);
      }
    })();
  }, [isOwner, getOrganizations]);

  // Admin actions
  const handleVerify = async (orgAddress: string) => {
    setTxLoading(orgAddress);
    setTxError(null);
    try {
      await verifyOrganization(orgAddress);
      setOrgs((prev) => prev.map((o) => o.address === orgAddress ? { ...o, isVerified: true } : o));
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
      setOrgs((prev) => prev.map((o) => o.address === orgAddress ? { ...o, isVerified: false } : o));
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
      setOrgs((prev) => prev.filter((o) => o.address !== orgAddress));
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
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Admin: Organization Moderation</h1>
      {loadingOrgs ? (
        <div className="text-gray-300">Loading organizations...</div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : (
        <div className="space-y-6">
          {orgs.map((org) => (
            <div key={org.address} className="bg-gray-800 rounded-lg border border-gray-700 p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-lg font-semibold text-white">{org.name}</div>
                  <div className="text-gray-400 text-sm">{org.address}</div>
                  <div className="text-gray-400 text-sm">{org.email}</div>
                  <div className="text-gray-400 text-sm">{org.website}</div>
                  <div className="text-gray-400 text-sm">
                    Status: {org.isVerified ? (
                      <span className="text-green-400">Verified</span>
                    ) : (
                      <span className="text-yellow-400">Pending</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {!org.isVerified && (
                    <button
                      onClick={() => handleVerify(org.address)}
                      disabled={txLoading === org.address}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                    >
                      {txLoading === org.address ? "Verifying..." : "Verify"}
                    </button>
                  )}
                  {org.isVerified && (
                    <button
                      onClick={() => handleRevoke(org.address)}
                      disabled={txLoading === org.address}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded"
                    >
                      {txLoading === org.address ? "Revoking..." : "Revoke"}
                    </button>
                  )}
                  <button
                    onClick={() => handleRemove(org.address)}
                    disabled={txLoading === org.address}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                  >
                    {txLoading === org.address ? "Removing..." : "Remove"}
                  </button>
                  {txError && txLoading === org.address && (
                    <div className="text-red-400 text-xs mt-1">{txError}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 