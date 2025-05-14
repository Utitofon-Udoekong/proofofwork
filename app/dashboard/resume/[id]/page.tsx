'use client';

import { useWeb3 } from '@/app/providers/Web3Provider';
import { use, useEffect, useState } from 'react';
import { ResumeMetadata, Organization } from '@/app/lib/types';
import { ipfsService } from '@/app/lib/services/ipfs';
import Link from 'next/link';
import { parseError } from '@/app/lib/parseError';
import { useOrganizations } from '@/app/hooks/useOrganizations';
import Image from 'next/image';

// Modal component for attachments
function AttachmentModal({ isOpen, onClose, attachment }: { isOpen: boolean; onClose: () => void; attachment: string }) {
  const gatewayUrl = ipfsService.getHttpUrl(attachment);
  const [contentType, setContentType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only run the effect if the modal is open and gatewayUrl is present
    if (isOpen && gatewayUrl) {
      const checkContentType = async () => {
        try {
          const response = await fetch(gatewayUrl, { method: 'HEAD' });
          const contentTypeHeader = response.headers.get('content-type');
          setContentType(contentTypeHeader);
        } catch (err) {
          console.error('Error checking content type:', err);
          setError('Failed to load content');
        }
      };
      checkContentType();
    } else if (!isOpen) {
      // Reset state when modal is closed
      setContentType(null);
      setError(null);
    }
  }, [isOpen, gatewayUrl]); // Add isOpen to dependencies

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Attachment Preview</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 overflow-auto max-h-[calc(90vh-8rem)]">
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-400 mb-4">{error}</p>
              <a
                href={gatewayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                Open in new tab
              </a>
            </div>
          ) : !contentType ? (
            <div className="flex justify-center items-center h-[70vh]">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : contentType.startsWith('application/pdf') ? (
            <iframe
              src={gatewayUrl}
              className="w-full h-[70vh]"
              title="PDF Preview"
            />
          ) : contentType.startsWith('image/') ? (
            <Image
              src={gatewayUrl}
              alt="Attachment Preview"
              className="max-w-full h-auto"
              width={500}
              height={500}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-300 mb-4">This file type cannot be previewed</p>
              <a
                href={gatewayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                Open in new tab
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface VerificationStatus {
  status: 'pending' | 'approved' | 'rejected' | 'none';
  details?: string;
  timestamp?: number;
}

interface VerificationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (organizationAddress: string, details: string) => Promise<void>;
  organizations: Organization[];
  isLoading: boolean;
  error?: string | null;
}

function VerificationRequestModal({ isOpen, onClose, onSubmit, organizations, isLoading, error }: VerificationRequestModalProps) {
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [details, setDetails] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Request Verification</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          {error && (
            <div className="mb-4 p-2 bg-red-900/30 border border-red-900/50 rounded text-red-300 text-sm">
              {error}
            </div>
          )}
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Select Organization</label>
            <select
              value={selectedOrg || ''}
              onChange={(e) => setSelectedOrg(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            >
              <option value="">Select an organization...</option>
              {organizations.map((org) => (
                <option key={org.address} value={org.address}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Verification Details</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Enter details about your work experience..."
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white h-32"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={() => onSubmit(selectedOrg, details)}
              disabled={!selectedOrg || isLoading}
              className={`px-4 py-2 rounded ${!selectedOrg || isLoading
                  ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Requesting...
                </span>
              ) : (
                'Request Verification'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get icon for entry type
const getEntryTypeIcon = (type: string) => {
  switch (type) {
    case 'work':
      return (
        <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
          <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
        </svg>
      );
    case 'education':
      return (
        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
        </svg>
      );
    case 'certification':
      return (
        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
        </svg>
      );
    case 'project':
      return (
        <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    case 'skill':
      return (
        <svg className="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
        </svg>
      );
    case 'award':
      return (
        <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
        </svg>
      );
    default:
      return null;
  }
};

// Get additional info to display based on entry type
const getEntryAdditionalInfo = (entry: ResumeMetadata['entries'][number]) => {
  switch (entry.type) {
    case 'work':
      return (
        <>
          {entry.role && <p className="text-gray-300">{entry.role}</p>}
          {entry.location && <p className="text-sm text-gray-400">Location: {entry.location}</p>}
        </>
      );
    case 'education':
      return (
        <>
          {entry.degree && <p className="text-gray-300">{entry.degree} in {entry.fieldOfStudy}</p>}
          {entry.grade && <p className="text-sm text-gray-400">Grade: {entry.grade}</p>}
        </>
      );
    case 'certification':
      return (
        <>
          {entry.issuedBy && <p className="text-gray-300">Issued by: {entry.issuedBy}</p>}
          {entry.credentialID && <p className="text-sm text-gray-400">ID: {entry.credentialID}</p>}
          {entry.expirationDate && <p className="text-sm text-gray-400">Expires: {entry.expirationDate}</p>}
        </>
      );
    case 'project':
      return (
        <>
          {entry.projectUrl && (
            <a href={entry.projectUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm">
              View Project
            </a>
          )}
        </>
      );
    case 'skill':
      return (
        <>
          {entry.proficiencyLevel && (
            <span className={`text-sm font-medium px-2 py-0.5 rounded ${
              entry.proficiencyLevel === 'beginner' ? 'bg-blue-900 text-blue-300' :
              entry.proficiencyLevel === 'intermediate' ? 'bg-green-900 text-green-300' :
              entry.proficiencyLevel === 'advanced' ? 'bg-purple-900 text-purple-300' :
              'bg-red-900 text-red-300'
            }`}>
              {entry.proficiencyLevel.charAt(0).toUpperCase() + entry.proficiencyLevel.slice(1)}
            </span>
          )}
        </>
      );
    default:
      return null;
  }
};

// Get proper names for entry types
const getEntryTypeName = (type: string) => {
  switch (type) {
    case 'work': return 'Work Experience';
    case 'education': return 'Education';
    case 'certification': return 'Certification';
    case 'project': return 'Project';
    case 'skill': return 'Skill';
    case 'award': return 'Award';
    default: return type;
  }
};

const VerifiedBadge = () => (
  <div className="group relative inline-block">
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-600/20 text-green-400 border border-green-500">
      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      Verified
    </span>
    <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-max bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
      This entry has been verified by an organization
    </span>
  </div>
);

export default function ResumeViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getResumeById, address: userAddress, requestVerification, getVerificationStatus } = useWeb3();
  const [resume, setResume] = useState<ResumeMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<string | null>(null);
  const [verifyingEntry, setVerifyingEntry] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationStatuses, setVerificationStatuses] = useState<Record<string, VerificationStatus>>({});
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(false);

  // Use the new hook for organizations
  const { data: organizations = []} = useOrganizations();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getResumeById(id);
        if (!result) {
          setError("Resume not found");
          return;
        }
        setResume(result);
        // Fetch verification status for each entry
        const statuses: Record<string, VerificationStatus> = {};
        for (const entry of result.entries) {
          const status = await getVerificationStatus(id, entry.id);
          statuses[entry.id] = status;
        }
        setVerificationStatuses(statuses);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load resume');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, getResumeById, getVerificationStatus]);

  const handleRequestVerification = async (entryId: string) => {
    setSelectedEntryId(entryId);
    setShowVerificationModal(true);
  };

  const handleVerificationSubmit = async (organizationAddress: string, details: string) => {
    if (!resume || selectedEntryId === null) return;

    try {
      setVerificationLoading(true);
      setVerifyingEntry(selectedEntryId);
      setVerificationError(null);
      const transactionHash = await requestVerification(id, selectedEntryId, organizationAddress, details);

      if (transactionHash) {
        // Only update the relevant verification status in state
        const status = await getVerificationStatus(id, selectedEntryId.toString());
        setVerificationStatuses(prev => ({
          ...prev,
          [selectedEntryId]: status
        }));
        // Close the modal after status update
        setShowVerificationModal(false);
      } else {
        setVerificationError('Failed to request verification');
      }
    } catch (err) {
      setVerificationError(parseError(err));
    } finally {
      setVerificationLoading(false);
      setVerifyingEntry(null);
    }
  };

  // Add a handler to close the modal and reset error
  const handleCloseVerificationModal = () => {
    setShowVerificationModal(false);
    setVerificationError(null);
  };

  const getVerificationButton = (entryId: string) => {
    const status = verificationStatuses[entryId];

    if (status?.status === 'approved') {
      return <VerifiedBadge />;
    }

    if (status?.status === 'pending') {
      return (
        <div className="flex items-center text-yellow-400">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Pending
        </div>
      );
    }

    if (status?.status === 'rejected') {
      return (
        <div className="flex items-center text-red-400">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Rejected
        </div>
      );
    }

    return (
      <button
        onClick={() => handleRequestVerification(entryId)}
        disabled={verifyingEntry === entryId}
        className={`px-3 py-1 rounded text-sm ${verifyingEntry === entryId
            ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
      >
        {verifyingEntry === entryId ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Requesting...
          </span>
        ) : (
          'Request Verification'
        )}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 text-center">
          <div className="flex justify-center my-8">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>
          <p className="text-gray-300">Loading resume...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-900/50 border border-red-700 p-4 rounded-md text-red-200">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 text-center">
          <p className="text-gray-300">Resume not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <div>
          <h2 className="text-xl font-bold text-white">{resume.name}</h2>
          <p className="text-gray-400 mt-1">{userAddress}</p>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
            <Link
              href={`/dashboard/resume/edit/${id}`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
            >
              Edit Resume
            </Link>
          </div>
        </div>

        <div className="p-6">
          {/* Profile Information Summary */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white pb-2 border-b border-gray-700 mb-4">
              Profile Information
            </h3>

            <div className="space-y-3">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/4">
                  <p className="text-gray-300 font-medium">Full Name</p>
                </div>
                <div className="md:w-3/4">
                  <p className="text-white">{resume.profile.name || 'Not provided'}</p>
                </div>
              </div>

              {resume.profile.headline && (
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/4">
                    <p className="text-gray-300 font-medium">Professional Headline</p>
                  </div>
                  <div className="md:w-3/4">
                    <p className="text-white">{resume.profile.headline}</p>
                  </div>
                </div>
              )}

              {resume.profile.location && (
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/4">
                    <p className="text-gray-300 font-medium">Location</p>
                  </div>
                  <div className="md:w-3/4">
                    <p className="text-white">{resume.profile.location}</p>
                  </div>
                </div>
              )}

              {resume.profile.contactEmail && (
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/4">
                    <p className="text-gray-300 font-medium">Contact Email</p>
                  </div>
                  <div className="md:w-3/4">
                    <p className="text-white">{resume.profile.contactEmail}</p>
                  </div>
                </div>
              )}

              {/* Social Links */}
              {(resume.profile.socialLinks?.linkedin || resume.profile.socialLinks?.github || resume.profile.socialLinks?.twitter || resume.profile.socialLinks?.website) && (
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/4">
                    <p className="text-gray-300 font-medium">Social Links</p>
                  </div>
                  <div className="md:w-3/4">
                    <div className="flex flex-wrap gap-2">
                      {resume.profile.socialLinks?.linkedin && (
                        <a href={resume.profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                          LinkedIn
                        </a>
                      )}
                      {resume.profile.socialLinks?.github && (
                        <a href={resume.profile.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                          GitHub
                        </a>
                      )}
                      {resume.profile.socialLinks?.twitter && (
                        <a href={resume.profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                          Twitter
                        </a>
                      )}
                      {resume.profile.socialLinks?.website && (
                        <a href={resume.profile.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                          Website
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Skills */}
              {resume.profile.skills && resume.profile.skills.length > 0 && (
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/4">
                    <p className="text-gray-300 font-medium">Skills</p>
                  </div>
                  <div className="md:w-3/4">
                    <div className="flex flex-wrap gap-2">
                      {resume.profile.skills.map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-700 rounded-full text-sm text-white">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Languages */}
              {resume.profile.languages && resume.profile.languages.length > 0 && (
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/4">
                    <p className="text-gray-300 font-medium">Languages</p>
                  </div>
                  <div className="md:w-3/4">
                    <div className="flex flex-wrap gap-2">
                      {resume.profile.languages.map((language, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-700 rounded-full text-sm text-white">
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {resume.profile.bio && (
                <div className="flex flex-col md:flex-row mt-4">
                  <div className="md:w-1/4">
                    <p className="text-gray-300 font-medium">Professional Bio</p>
                  </div>
                  <div className="md:w-3/4">
                    <p className="text-white whitespace-pre-line">{resume.profile.bio}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Resume Entries */}
          {resume.entries && resume.entries.length > 0 ? (
            resume.entries.map((entry, index) => (
              <div key={index} className="mb-8 py-6 last:mb-0 border-b border-gray-700 last:border-b-0">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    {getEntryTypeIcon(entry.type)}
                    <h3 className="text-lg font-semibold text-white">{entry.title}</h3>
                    <span className="ml-2 px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300 font-medium">
                      {getEntryTypeName(entry.type)}
                    </span>
                  </div>
                  {getVerificationButton(entry.id)}
                </div>

                {verificationError && verifyingEntry === entry.id && (
                  <div className="mb-4 p-2 bg-red-900/30 border border-red-900/50 rounded text-red-300 text-sm">
                    {verificationError}
                  </div>
                )}

                {verificationStatuses[entry.id]?.details && (
                  <div className="mb-4 p-2 bg-gray-700/30 border border-gray-600 rounded text-gray-300 text-sm">
                    {verificationStatuses[entry.id].details}
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/4">
                      <p className="text-gray-300 font-medium">Organization</p>
                    </div>
                    <div className="md:w-3/4">
                      <p className="text-white">{entry.organization || entry.company}</p>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/4">
                      <p className="text-gray-300 font-medium">Duration</p>
                    </div>
                    <div className="md:w-3/4">
                      <p className="text-white">
                        {new Date(entry.startDate).toLocaleDateString()} - {entry.endDate ? new Date(entry.endDate).toLocaleDateString() : 'Present'}
                      </p>
                    </div>
                  </div>

                  {entry.description && (
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/4">
                        <p className="text-gray-300 font-medium">Description</p>
                      </div>
                      <div className="md:w-3/4">
                        <p className="text-white whitespace-pre-line">{entry.description}</p>
                      </div>
                    </div>
                  )}

                  {/* Additional Info */}
                  {getEntryAdditionalInfo(entry) && (
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/4">
                        <p className="text-gray-300 font-medium">Details</p>
                      </div>
                      <div className="md:w-3/4">
                        {getEntryAdditionalInfo(entry)}
                      </div>
                    </div>
                  )}

                  {/* Attachments */}
                  {entry.attachments && entry.attachments.length > 0 && (
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/4">
                        <p className="text-gray-300 font-medium">Attachments</p>
                      </div>
                      <div className="md:w-3/4">
                        <div className="flex flex-wrap gap-2">
                          {entry.attachments.map((attachment, attIndex) => (
                            <button
                              key={attIndex}
                              onClick={() => setSelectedAttachment(attachment)}
                              className="inline-flex items-center px-2 py-1 text-xs bg-gray-700 text-gray-200 rounded hover:bg-gray-600"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                />
                              </svg>
                              Attachment {attIndex + 1}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center py-8">No entries found</p>
          )}
        </div>
      </div>

      {/* Add the modal component */}
      <AttachmentModal
        isOpen={!!selectedAttachment}
        onClose={() => setSelectedAttachment(null)}
        attachment={selectedAttachment || ''}
      />

      {/* Verification Request Modal */}
      <VerificationRequestModal
        isOpen={showVerificationModal}
        onClose={handleCloseVerificationModal}
        onSubmit={handleVerificationSubmit}
        organizations={organizations}
        isLoading={verificationLoading}
        error={verificationError}
      />
    </div>
  );
} 