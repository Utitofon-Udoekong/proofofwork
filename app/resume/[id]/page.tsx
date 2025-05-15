"use client";

import { useState, useEffect, use } from "react";
import { useWeb3 } from '@/app/providers/Web3Provider';
import { ResumeMetadata } from '@/app/lib/types';
import { ipfsService } from '@/app/lib/services/ipfs';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';

// Modal component for attachments
function AttachmentModal({ isOpen, onClose, attachment }: { isOpen: boolean; onClose: () => void; attachment: string }) {
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
              width={800}
              height={600}
              style={{ objectFit: 'contain' }}
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

export default function PublicResumePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getResumeById } = useWeb3();
  const [resume, setResume] = useState<ResumeMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<string | null>(null);

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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load resume');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, getResumeById]);

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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">{resume.name}</h2>
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
          </div>
          
          {/* Resume Entries */}
          {resume.entries && resume.entries.length > 0 ? (
            resume.entries.map((entry, index) => (
              <div key={index} className="mb-8 p-6 last:mb-0 border-b border-gray-700 last:border-b-0">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    {getEntryTypeIcon(entry.type)}
                    <h3 className="text-lg font-semibold text-white">{entry.title}</h3>
                    <span className="ml-2 px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300 font-medium">
                      {getEntryTypeName(entry.type)}
                    </span>
                  </div>
                  {entry.verified && (
                    <div className="flex items-center text-green-400">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Verified
                    </div>
                  )}
                </div>

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

        {/* Add the modal component */}
        <AttachmentModal
          isOpen={!!selectedAttachment}
          onClose={() => setSelectedAttachment(null)}
          attachment={selectedAttachment || ''}
        />
      </div>
    </div>
  );
} 