"use client";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { metaMask } from "wagmi/connectors";
import { useState } from "react";
import { useUser } from "@civic/auth-web3/react";
import { embeddedWallet } from "@civic/auth-web3/wagmi";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWeb3 } from "../providers/Web3Provider";
import { useOrganizations } from '@/app/hooks/useOrganizations';
// Contract owner address
const OWNER_ADDRESS = process.env.contractOwnerAddress?.toLowerCase();

const AdminNavbar = () => {
  const { signOut } = useUser();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const { connect } = useConnect();
  
  const handleSignOut = async () => {
    try {
      await signOut();
      disconnect();
      connect({ connector: embeddedWallet() });
      router.replace('/');
    } catch (error) {
      console.error(error);
    }
  }

 

  return (
    <nav className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 mb-8 shadow-lg">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <span className="text-xl font-bold text-white">Admin Dashboard</span>
                <p className="text-xs text-gray-400">Organization Management</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="px-4 py-2 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <span className="text-blue-300 text-sm font-medium">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '...'}
                </span>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-4 py-2 border border-red-500/30 text-sm font-medium rounded-md text-red-300 bg-red-600/20 hover:bg-red-600/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
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

function parseUserFriendlyError(error: unknown): { message: string, details?: string } {
  if (!error) return { message: "Unknown error" };
  let msg = "";
  let details = "";
  if (typeof error === "string") {
    try {
      const parsed = JSON.parse(error);
      msg = parsed.message || error;
      details = error;
    } catch {
      msg = error;
      details = error;
    }
  } else if (typeof error === "object" && error !== null) {
    // Try to extract common error fields
    const errObj = error as Record<string, any>;
    msg = errObj.message || errObj.reason || errObj.code || "Unknown error";
    details = JSON.stringify(error, null, 2);
    if (errObj.body) {
      try {
        const body = JSON.parse(errObj.body);
        if (body && body.error && body.error.message) {
          msg = body.error.message;
        }
      } catch {}
    }
    if (errObj.data && errObj.data.message) {
      msg = errObj.data.message;
    }
    if (errObj.response && errObj.response.data && errObj.response.data.message) {
      msg = errObj.response.data.message;
    }
    if (errObj.message && typeof errObj.message === 'string' && errObj.message.includes('Origin')) {
      const match = errObj.message.match(/"message":"([^"]+)"/);
      if (match && match[1]) {
        msg = match[1];
      }
    }
  } else if (error instanceof Error) {
    msg = error.message;
    details = error.stack || String(error);
  }
  if (!msg) msg = "Unknown error";
  return { message: msg, details };
}

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { verifyOrganization, revokeOrganization, removeOrganization } = useWeb3();
  const { data: orgs = [], isLoading: loadingOrgs, error } = useOrganizations();
  const [txLoading, setTxLoading] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  const isOwner = isConnected && address && address.toLowerCase() === OWNER_ADDRESS;

  const filteredOrgs = orgs.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleVerify = async (orgAddress: string) => {
    setTxLoading(orgAddress);
    setTxError(null);
    try {
      await verifyOrganization(orgAddress);
    } catch (err: unknown) {
      setTxError(err instanceof Error ? err.message : "Failed to verify organization");
    } finally {
      setTxLoading(null);
    }
  };

  const handleRevoke = async (orgAddress: string) => {
    setTxLoading(orgAddress);
    setTxError(null);
    try {
      await revokeOrganization(orgAddress);
    } catch (err: unknown) {
      setTxError(err instanceof Error ? err.message : "Failed to revoke organization");
    } finally {
      setTxLoading(null);
    }
  };

  const handleRemove = async (orgAddress: string) => {
    setTxLoading(orgAddress);
    setTxError(null);
    try {
      await removeOrganization(orgAddress);
    } catch (err: unknown) {
      setTxError(err instanceof Error ? err.message : "Failed to remove organization");
    } finally {
      setTxLoading(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <AdminNavbar />
        <div className="max-w-md mx-auto mt-20 p-8 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-xl">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">Admin Login</h1>
          <button
            onClick={() => connect({ connector: metaMask() })}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <span className="inline-block animate-spin">⟳</span>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21.49 13.28l-1.73-1.73c.29-.29.47-.69.47-1.13 0-.44-.18-.84-.47-1.13l1.73-1.73c.29-.29.47-.69.47-1.13 0-.44-.18-.84-.47-1.13l-1.73-1.73c-.29-.29-.69-.47-1.13-.47-.44 0-.84.18-1.13.47l-1.73 1.73c-.29.29-.69.47-1.13.47-.44 0-.84-.18-1.13-.47l-1.73-1.73c-.29-.29-.69-.47-1.13-.47-.44 0-.84.18-1.13.47l-1.73 1.73c-.29.29-.47.69-.47 1.13 0 .44.18.84.47 1.13l1.73 1.73c-.29.29-.47.69-.47 1.13 0 .44.18.84.47 1.13l-1.73 1.73c-.29.29-.47.69-.47 1.13 0 .44.18.84.47 1.13l1.73 1.73c.29.29.69.47 1.13.47.44 0 .84-.18 1.13-.47l1.73-1.73c.29-.29.69-.47 1.13-.47.44 0 .84.18 1.13.47l1.73 1.73c.29.29.69.47 1.13.47.44 0 .84-.18 1.13-.47l1.73-1.73c.29-.29.47-.69.47-1.13 0-.44-.18-.84-.47-1.13z"/>
                </svg>
                <span>Connect MetaMask</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <AdminNavbar />
        <div className="max-w-md mx-auto mt-20 p-8 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-xl text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Admin Access Required</h1>
          <p className="text-gray-300 mb-6">You must be connected as the contract owner to access this page.</p>
          <button
            onClick={() => disconnect()}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-all duration-200"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <AdminNavbar />
      <main className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">Organization Management</h1>
            <div className="relative">
              <input
                type="text"
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="w-5 h-5 text-gray-400 absolute right-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {loadingOrgs ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            (() => {
              const parsed = parseUserFriendlyError(error);
              return (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-300">
                  <div className="flex items-center justify-between">
                    <span>{parsed.message}</span>
                    {parsed.details && (
                      <button
                        className="ml-4 text-xs underline text-red-200 hover:text-red-100"
                        onClick={() => setShowErrorDetails((v) => !v)}
                      >
                        {showErrorDetails ? "Hide Details" : "Show Details"}
                      </button>
                    )}
                  </div>
                  {showErrorDetails && parsed.details && (
                    <pre className="mt-2 text-xs text-red-200 whitespace-pre-wrap break-all max-h-64 overflow-auto bg-red-950/40 p-2 rounded">
                      {parsed.details}
                    </pre>
                  )}
                </div>
              );
            })()
          ) : (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-xl overflow-hidden">
              <div className="grid grid-cols-12 gap-4 p-4 bg-gray-700/50 text-sm font-medium text-gray-300">
                <div className="col-span-3">Name</div>
                <div className="col-span-3">Email</div>
                <div className="col-span-3">Website</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1">Actions</div>
              </div>
              <div className="divide-y divide-gray-700/50">
                {filteredOrgs.map((org) => (
                  <div key={org.address} className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-700/30 transition-colors duration-200">
                    <div className="col-span-3">
                      <div className="font-medium text-white">{org.name}</div>
                      <div className="text-xs text-gray-400 font-mono">{org.address}</div>
                    </div>
                    <div className="col-span-3 text-sm text-gray-300">{org.email}</div>
                    <div className="col-span-3 text-sm text-gray-300">
                      <a href={org.website} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-400 hover:text-blue-300 transition-colors duration-200">
                        {org.website}
                      </a>
                    </div>
                    <div className="col-span-2">
                      {org.isVerified ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-300 border border-green-500/30">
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-900/50 text-yellow-300 border border-yellow-500/30">
                          Pending
                        </span>
                      )}
                    </div>
                    <div className="col-span-1 flex items-center gap-3">
                      {!org.isVerified && (
                        <button
                          onClick={() => handleVerify(org.address)}
                          disabled={txLoading === org.address}
                          className="p-1.5 rounded-lg bg-green-900/20 text-green-400 hover:bg-green-900/30 hover:text-green-300 disabled:opacity-50 transition-all duration-200"
                          title="Verify"
                        >
                          {txLoading === org.address ? (
                            <span className="inline-block animate-spin">⟳</span>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      )}
                      {org.isVerified && (
                        <button
                          onClick={() => handleRevoke(org.address)}
                          disabled={txLoading === org.address}
                          className="p-1.5 rounded-lg bg-yellow-900/20 text-yellow-400 hover:bg-yellow-900/30 hover:text-yellow-300 disabled:opacity-50 transition-all duration-200"
                          title="Revoke"
                        >
                          {txLoading === org.address ? (
                            <span className="inline-block animate-spin">⟳</span>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handleRemove(org.address)}
                        disabled={txLoading === org.address}
                        className="p-1.5 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/30 hover:text-red-300 disabled:opacity-50 transition-all duration-200"
                        title="Remove"
                      >
                        {txLoading === org.address ? (
                          <span className="inline-block animate-spin">⟳</span>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </button>
                      {txError && txLoading === org.address && (
                        <div className="absolute mt-12 text-red-400 text-xs bg-red-900/20 p-2 rounded-lg border border-red-500/30">
                          {txError}
                        </div>
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