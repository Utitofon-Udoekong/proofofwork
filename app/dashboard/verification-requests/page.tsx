"use client";

import { useState, useEffect } from "react";
import { UserButton } from "@civic/auth-web3/react";
import { useWeb3 } from "@/app/providers/Web3Provider";
import { VerificationRequest } from "@/app/lib/types";

export default function VerificationRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use our combined Web3Provider
  const { 
    userAuthenticated, 
    walletConnected, 
    createWallet, 
    connectWallet, 
    getResumeEntries,
    requestVerification,
    isLoading
  } = useWeb3();
  
  // Verification requests data
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  
  useEffect(() => {
    const fetchResumeEntries = async () => {
      try {
        if (!walletConnected) {
          setLoading(false);
          return;
        }
        
        setLoading(true);
        
        // Get resume entries using our provider
        const entries = await getResumeEntries();
        
        // Generate verification requests based on entries
        const mockRequests: VerificationRequest[] = [];
        
        entries.forEach((entry, index) => {
          if (entry.organization) {
            mockRequests.push({
              entryId: index,
              organization: entry.organization,
              status: entry.verified ? 'approved' : 'pending',
              requestDate: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
              responseDate: entry.verified ? new Date().toISOString() : undefined
            });
          }
        });
        
        setVerificationRequests(mockRequests);
      } catch (error) {
        console.error("Error fetching resume entries:", error);
        setError("Failed to load your verification requests. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchResumeEntries();
  }, [walletConnected, getResumeEntries]);

  const handleCancelRequest = async (requestId: number | string) => {
    // In a real implementation, this would call a contract method
    if (confirm("Are you sure you want to cancel this verification request?")) {
      // Mock implementation - just update the UI
      setVerificationRequests(verificationRequests.filter(req => req.entryId !== requestId));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  if (loading || isLoading) {
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
          <span className="block sm:inline">{error}</span>
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
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <h2 className="text-xl font-medium mb-4">No Verification Requests</h2>
          <p className="text-gray-600 mb-6">
            You haven't requested verification for any of your resume entries yet.
          </p>
          <a 
            href="/dashboard"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium inline-block"
          >
            Go to Resume
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entry
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organization
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {verificationRequests.map((request) => {
                  return (
                    <tr key={`${request.entryId}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{request.organization}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.organization}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(request.requestDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {request.status === 'pending' && (
                          <button
                            onClick={() => handleCancelRequest(request.entryId)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Cancel
                          </button>
                        )}
                        {request.status === 'approved' && (
                          <span className="text-green-600">
                            Verified on {request.responseDate ? new Date(request.responseDate).toLocaleDateString() : 'Unknown date'}
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
      
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">About Verification</h2>
        <p className="text-gray-700 mb-4">
          Verification requests are sent to the organizations listed in your resume entries. Once an organization verifies your entry,
          it will be permanently marked as verified on the blockchain.
        </p>
        <p className="text-gray-700">
          Verified entries add credibility to your resume and can be trusted by potential employers or clients.
        </p>
      </div>
    </div>
  );
} 