'use client';

import { useWeb3 } from '@/app/providers/Web3Provider';
import { useState, useEffect } from 'react';
import Link from "next/link";

interface OrganizationStatus {
  name: string;
  email: string;
  website: string;
  isVerified: boolean;
  verificationTimestamp: number;
  lastUpdateTimestamp: number;
  exists: boolean;
}

export default function OrganizationPage() {
  const { address, getOrganizationDetails, registerOrganization } = useWeb3();
  const [status, setStatus] = useState<OrganizationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    website: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!address) return;
      
      try {
        setLoading(true);
        const details = await getOrganizationDetails(address);
        if (details) {
          setStatus({
            name: details[0],
            email: details[1],
            website: details[2],
            isVerified: details[3],
            verificationTimestamp: Number(details[4]),
            lastUpdateTimestamp: Number(details[5]),
            exists: details[6],
          });
        }
      } catch (err) {
        console.error('Error fetching organization status:', err);
        setError('Failed to load organization status');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [address, getOrganizationDetails]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    try {
      setSubmitting(true);
      setError(null);
      
      // Call the contract to register organization
      // This will be implemented in Web3Provider
      await registerOrganization(formData.name, formData.email, formData.website);
      
      // Refresh status
      const details = await getOrganizationDetails(address);
      if (details) {
        setStatus({
          name: details[0],
          email: details[1],
          website: details[2],
          isVerified: details[3],
          verificationTimestamp: Number(details[4]),
          lastUpdateTimestamp: Number(details[5]),
          exists: details[6],
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register organization');
    } finally {
      setSubmitting(false);
    }
  };

  if (!address) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Organizations</h1>
          <Link
            href="/dashboard/organizations/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Create Organization
          </Link>
        </div>
        <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 text-center">
          <p className="text-gray-300">Please connect your wallet to continue</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Organizations</h1>
          <Link
            href="/dashboard/organizations/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Create Organization
          </Link>
        </div>
        <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 text-center">
          <div className="flex justify-center my-8">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>
          <p className="text-gray-300">Loading organization status...</p>
        </div>
      </div>
    );
  }

  if (status?.exists) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Organizations</h1>
          <Link
            href="/dashboard/organizations/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Create Organization
          </Link>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Organization Status</h2>
            <div className="flex items-center mb-4">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                status.isVerified ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
              <span className="text-gray-300">
                {status.isVerified ? 'Verified' : 'Pending Verification'}
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-gray-400">Name</p>
                <p className="text-white">{status.name}</p>
              </div>
              <div>
                <p className="text-gray-400">Email</p>
                <p className="text-white">{status.email}</p>
              </div>
              <div>
                <p className="text-gray-400">Website</p>
                <a 
                  href={status.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300"
                >
                  {status.website}
                </a>
              </div>
              <div>
                <p className="text-gray-400">Last Updated</p>
                <p className="text-white">
                  {new Date(status.lastUpdateTimestamp * 1000).toLocaleString()}
                </p>
              </div>
              {status.isVerified && (
                <div>
                  <p className="text-gray-400">Verified On</p>
                  <p className="text-white">
                    {new Date(status.verificationTimestamp * 1000).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Register Organization</h2>
          <p className="text-gray-300 mb-6">
            Register your organization to verify work experience claims. Your registration will be reviewed by our team.
          </p>
          <div className="bg-blue-900/30 border border-blue-700/50 rounded p-4 mb-6">
            <p className="text-blue-300 text-sm">
              <span className="font-semibold">Note:</span> Your connected wallet address ({address}) will be used to identify your organization. 
              Make sure to use the same wallet for all future verifications.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-900/30 border border-red-900/50 rounded text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-gray-300 mb-2">Organization Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className={`px-4 py-2 rounded ${
                submitting
                  ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {submitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registering...
                </span>
              ) : (
                'Register Organization'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 