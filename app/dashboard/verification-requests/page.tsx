"use client";

import { UserButton } from "@civic/auth-web3/react";
import { useWeb3 } from "@/app/providers/Web3Provider";
import { useVerificationRequests } from '@/app/hooks/useVerificationRequests';

export default function VerificationRequestsPage() {
  const { 
    userAuthenticated, 
    walletConnected, 
    createWallet, 
  } = useWeb3();
  
  // Use the new hook for verification requests
  const { data: verificationRequests = [], isLoading: loading, error } = useVerificationRequests();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-900 text-yellow-300">
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-900 text-green-300">
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-900 text-red-300">
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-700 text-gray-300">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading your verification requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error.message}</span>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  // If not authenticated, show login button
  if (!userAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="bg-white p-8 rounded-lg shadow-sm max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-4">Sign In</h2>
          <p className="text-gray-600 mb-6">
            Please sign in to view and manage your verification requests.
          </p>
          <UserButton />
        </div>
      </div>
    );
  }

  // If wallet isn't connected, show create wallet button
  if (!walletConnected) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="bg-white p-8 rounded-lg shadow-sm max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-4">Create a Wallet</h2>
          <p className="text-gray-600 mb-6">
            You need a wallet to use the verification features. Create one now to get started.
          </p>
          <button 
            onClick={() => createWallet()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Create Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Verification Requests</h1>
      
      {verificationRequests.length === 0 ? (
        <div className="bg-gray-800 p-8 rounded-lg shadow-sm text-center">
          <h2 className="text-xl font-medium mb-4">No Verification Requests</h2>
          <p className="text-gray-400 text-center py-4">You haven&apos;t requested verification for any of your resume entries yet.</p>
          <a 
            href="/dashboard"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium inline-block"
          >
            Go to Resume
          </a>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-900">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Entry
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Organization
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Requested Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {verificationRequests.map((request) => {
                  return (
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-100">{request.entryId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-100">{request.verificationDetails}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {new Date(request.timestamp * 1000).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {/* {request.status === 'pending' && (
                          <button
                            onClick={() => handleCancelRequest(request.id)}
                            className="text-red-400 hover:text-red-600"
                          >
                            Cancel
                          </button>
                        )} */}
                        {request.status === 'approved' && (
                          <span className="text-green-400">
                            Verified on {new Date(request.timestamp * 1000).toLocaleDateString()}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="mt-8 bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-100">About Verification</h2>
        <p className="text-gray-300 mb-4">
          Verification requests are sent to the organizations listed in your resume entries. Once an organization verifies your entry,
          it will be permanently marked as verified on the blockchain.
        </p>
        <p className="text-gray-300">
          Verified entries add credibility to your resume and can be trusted by potential employers or clients.
        </p>
      </div>
    </div>
  );
} 