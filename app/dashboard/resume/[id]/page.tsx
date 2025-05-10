'use client';

import { useSearchParams } from 'next/navigation';
import { useWeb3 } from '@/app/providers/Web3Provider';
import { use, useEffect, useState } from 'react';
import { ResumeMetadata } from '@/app/lib/types';
import { ipfsService } from '@/app/lib/services/ipfs';
import Link from 'next/link';

// Modal component for attachments
function AttachmentModal({ isOpen, onClose, attachment }: { isOpen: boolean; onClose: () => void; attachment: string }) {
  if (!isOpen) return null;

  const gatewayUrl = ipfsService.getHttpUrl(attachment);
  const [contentType, setContentType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkContentType = async () => {
      try {
        const response = await fetch(gatewayUrl, { method: 'HEAD' });
        const contentType = response.headers.get('content-type');
        setContentType(contentType);
      } catch (err) {
        console.error('Error checking content type:', err);
        setError('Failed to load content');
      }
    };

    if (gatewayUrl) {
      checkContentType();
    }
  }, [gatewayUrl]);

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
            <img
              src={gatewayUrl}
              alt="Attachment Preview"
              className="max-w-full h-auto"
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
  organizations: Array<{ address: string; name: string }>;
  isLoading: boolean;
}

function VerificationRequestModal({ isOpen, onClose, onSubmit, organizations, isLoading }: VerificationRequestModalProps) {
  const [selectedOrg, setSelectedOrg] = useState('');
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
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Select Organization</label>
            <select
              value={selectedOrg}
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
              className={`px-4 py-2 rounded ${
                !selectedOrg || isLoading
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

export default function ResumeViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getResumeById, address: userAddress, requestVerification, getVerificationStatus, getOrganizations } = useWeb3();
  const [resume, setResume] = useState<ResumeMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<string | null>(null);
  const [verifyingEntry, setVerifyingEntry] = useState<number | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationStatuses, setVerificationStatuses] = useState<Record<number, VerificationStatus>>({});
  const [organizations, setOrganizations] = useState<Array<{ address: string; name: string }>>([]);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [result, orgs] = await Promise.all([
          getResumeById(id),
          getOrganizations()
        ]);
        
        if (!result) {
          setError("Resume not found");
          return;
        }
        
        setResume(result);
        setOrganizations(orgs);

        // Fetch verification status for each entry
        const statuses: Record<number, VerificationStatus> = {};
        for (let i = 0; i < result.entries.length; i++) {
          const status = await getVerificationStatus(id, i.toString());
          statuses[i] = status;
        }
        setVerificationStatuses(statuses);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load resume');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, getResumeById, getVerificationStatus, getOrganizations]);

  const handleRequestVerification = async (entryId: number) => {
    setSelectedEntryId(entryId);
    setShowVerificationModal(true);
  };

  const handleVerificationSubmit = async (organizationAddress: string, details: string) => {
    if (!resume || selectedEntryId === null) return;
    
    try {
      setVerifyingEntry(selectedEntryId);
      setVerificationError(null);
      await requestVerification(selectedEntryId, organizationAddress, details);
      
      // Update verification status after request
      const status = await getVerificationStatus(id, selectedEntryId.toString());
      setVerificationStatuses(prev => ({
        ...prev,
        [selectedEntryId]: status
      }));
      
      setShowVerificationModal(false);
    } catch (err) {
      setVerificationError(err instanceof Error ? err.message : 'Failed to request verification');
    } finally {
      setVerifyingEntry(null);
    }
  };

  const getVerificationButton = (entryId: number) => {
    const status = verificationStatuses[entryId];
    
    if (status?.status === 'approved') {
      return (
        <div className="flex items-center text-green-400">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          Verified
        </div>
      );
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
        className={`px-3 py-1 rounded text-sm ${
          verifyingEntry === entryId
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
            {resume.transactionHash && (
              <a
                href={`https://sepolia.etherscan.io/tx/${resume.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View on Etherscan
              </a>
            )}
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
              <div key={index} className="mb-8 last:mb-0 p-6 border-b border-gray-700 last:border-b-0">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-white">{entry.title}</h3>
                  {getVerificationButton(index)}
                </div>

                {verificationError && verifyingEntry === index && (
                  <div className="mb-4 p-2 bg-red-900/30 border border-red-900/50 rounded text-red-300 text-sm">
                    {verificationError}
                  </div>
                )}

                {verificationStatuses[index]?.details && (
                  <div className="mb-4 p-2 bg-gray-700/30 border border-gray-600 rounded text-gray-300 text-sm">
                    {verificationStatuses[index].details}
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
        onClose={() => setShowVerificationModal(false)}
        onSubmit={handleVerificationSubmit}
        organizations={organizations}
        isLoading={verifyingEntry !== null}
      />
    </div>
  );
} 