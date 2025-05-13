"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ResumeMetadata, EntryType, ResumeEntry } from "@/app/lib/types";
import { useWeb3 } from "@/app/providers/Web3Provider";

export default function EditResumePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { getResumeById, saveResume, isLoading: web3Loading } = useWeb3();
  const [resumeMetadata, setResumeMetadata] = useState<ResumeMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'edit' | 'preview'>('edit');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load resume data
  useEffect(() => {
    const fetchResume = async () => {
      try {
        setLoading(true);
        const result = await getResumeById(id);
        if (!result) {
          setError("Resume not found");
          return;
        }
        setResumeMetadata(result);
      } catch (error) {
        console.error("Error fetching resume:", error);
        setError("Failed to load resume. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchResume();
    }
  }, [id, getResumeById]);

  // Handle saving the resume
  const handleSaveResume = async () => {
    if (!resumeMetadata) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const transactionHash = await saveResume(id, resumeMetadata);
      if (transactionHash) {
        router.push(`/dashboard/resume/${id}`);
      } else {
        setError("Failed to save resume. Please try again.");
      }
    } catch (error) {
      console.error("Error saving resume:", error);
      setError("Failed to save resume. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle preview
  const handlePreview = () => {
    setCurrentStep('preview');
  };

  // Handle back to edit
  const handleBackToEdit = () => {
    setCurrentStep('edit');
  };

  // Handle cancel
  const handleCancel = () => {
    router.push(`/dashboard/resume/${id}`);
  };

  if (loading || web3Loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading resume...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 hover:underline"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!resumeMetadata) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-gray-600">No resume found for this address.</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-4 text-blue-600 hover:underline"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Edit step
  if (currentStep === 'edit') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Edit Resume</h1>
              <p className="text-gray-600 mt-2">Make changes to your resume</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handlePreview}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Preview
              </button>
            </div>
          </div>

          {/* Profile Information */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={resumeMetadata.profile.name}
                  onChange={(e) => setResumeMetadata(prev => ({
                    ...prev!,
                    profile: { ...prev!.profile, name: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  value={resumeMetadata.profile.bio}
                  onChange={(e) => setResumeMetadata(prev => ({
                    ...prev!,
                    profile: { ...prev!.profile, bio: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills
                </label>
                <input
                  type="text"
                  value={resumeMetadata.profile.skills?.join(', ') || ''}
                  onChange={(e) => setResumeMetadata(prev => ({
                    ...prev!,
                    profile: { ...prev!.profile, skills: e.target.value.split(',').map(s => s.trim()) }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter skills separated by commas"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={resumeMetadata.profile.email}
                  onChange={(e) => setResumeMetadata(prev => ({
                    ...prev!,
                    profile: { ...prev!.profile, email: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={resumeMetadata.profile.phone}
                  onChange={(e) => setResumeMetadata(prev => ({
                    ...prev!,
                    profile: { ...prev!.profile, phone: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={resumeMetadata.profile.location}
                  onChange={(e) => setResumeMetadata(prev => ({
                    ...prev!,
                    profile: { ...prev!.profile, location: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={resumeMetadata.profile.website}
                  onChange={(e) => setResumeMetadata(prev => ({
                    ...prev!,
                    profile: { ...prev!.profile, website: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Social Links
                </label>
                <div className="space-y-2">
                  {Object.entries(resumeMetadata.profile.socialLinks || {}).map(([platform, url]) => (
                    <div key={platform} className="flex gap-2">
                      <input
                        type="text"
                        value={platform}
                        onChange={(e) => {
                          const newSocialLinks = { ...(resumeMetadata.profile.socialLinks || {}) };
                          delete newSocialLinks[platform];
                          newSocialLinks[e.target.value] = url;
                          setResumeMetadata(prev => ({
                            ...prev!,
                            profile: { ...prev!.profile, socialLinks: newSocialLinks }
                          }));
                        }}
                        className="w-1/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Platform"
                      />
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => {
                          const newSocialLinks = { ...(resumeMetadata.profile.socialLinks || {}) };
                          newSocialLinks[platform] = e.target.value;
                          setResumeMetadata(prev => ({
                            ...prev!,
                            profile: { ...prev!.profile, socialLinks: newSocialLinks }
                          }));
                        }}
                        className="w-2/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="URL"
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newSocialLinks = { ...(resumeMetadata.profile.socialLinks || {}), '': '' };
                      setResumeMetadata(prev => ({
                        ...prev!,
                        profile: { ...prev!.profile, socialLinks: newSocialLinks }
                      }));
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    + Add Social Link
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Resume Entries */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-xl font-semibold mb-6">Resume Entries</h2>
            <div className="space-y-6">
              {resumeMetadata.entries.map((entry, index) => (
                <div key={index} className="border-b border-gray-200 pb-6 last:border-0">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Entry Type
                      </label>
                      <select
                        value={entry.type}
                        onChange={(e) => {
                          const newEntries = [...resumeMetadata.entries];
                          newEntries[index] = { ...entry, type: e.target.value as EntryType };
                          setResumeMetadata(prev => ({ ...prev!, entries: newEntries }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="work">Work Experience</option>
                        <option value="education">Education</option>
                        <option value="project">Project</option>
                        <option value="certification">Certification</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={entry.title}
                        onChange={(e) => {
                          const newEntries = [...resumeMetadata.entries];
                          newEntries[index] = { ...entry, title: e.target.value };
                          setResumeMetadata(prev => ({ ...prev!, entries: newEntries }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company/Organization
                      </label>
                      <input
                        type="text"
                        value={entry.company}
                        onChange={(e) => {
                          const newEntries = [...resumeMetadata.entries];
                          newEntries[index] = { ...entry, company: e.target.value };
                          setResumeMetadata(prev => ({ ...prev!, entries: newEntries }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={entry.description}
                        onChange={(e) => {
                          const newEntries = [...resumeMetadata.entries];
                          newEntries[index] = { ...entry, description: e.target.value };
                          setResumeMetadata(prev => ({ ...prev!, entries: newEntries }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={entry.startDate}
                          onChange={(e) => {
                            const newEntries = [...resumeMetadata.entries];
                            newEntries[index] = { ...entry, startDate: e.target.value };
                            setResumeMetadata(prev => ({ ...prev!, entries: newEntries }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={entry.endDate}
                          onChange={(e) => {
                            const newEntries = [...resumeMetadata.entries];
                            newEntries[index] = { ...entry, endDate: e.target.value };
                            setResumeMetadata(prev => ({ ...prev!, entries: newEntries }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Attachments
                      </label>
                      <div className="space-y-2">
                        {entry.attachments?.map((attachment, attachmentIndex) => (
                          <div key={attachmentIndex} className="flex gap-2">
                            <input
                              type="text"
                              value={attachment}
                              onChange={(e) => {
                                const newEntries = [...resumeMetadata.entries];
                                const newAttachments = [...(entry.attachments || [])];
                                newAttachments[attachmentIndex] = e.target.value;
                                newEntries[index] = { ...entry, attachments: newAttachments };
                                setResumeMetadata(prev => ({ ...prev!, entries: newEntries }));
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="IPFS URI"
                            />
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const newEntries = [...resumeMetadata.entries];
                            const newAttachments = [...(entry.attachments || []), ''];
                            newEntries[index] = { ...entry, attachments: newAttachments };
                            setResumeMetadata(prev => ({ ...prev!, entries: newEntries }));
                          }}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          + Add Attachment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Preview step
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Preview Resume</h1>
            <p className="text-gray-600 mt-2">Review your changes before saving</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={handleBackToEdit}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Back to Edit
            </button>
            <button
              onClick={handleSaveResume}
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Resume Preview */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Profile Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">{resumeMetadata.profile.name}</h2>
            <p className="text-gray-600 mb-4">{resumeMetadata.profile.bio}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {resumeMetadata.profile.skills?.map((skill, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded"
                >
                  {skill}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              {resumeMetadata.profile.email && (
                <div>
                  <span className="font-medium">Email:</span> {resumeMetadata.profile.email}
                </div>
              )}
              {resumeMetadata.profile.phone && (
                <div>
                  <span className="font-medium">Phone:</span> {resumeMetadata.profile.phone}
                </div>
              )}
              {resumeMetadata.profile.location && (
                <div>
                  <span className="font-medium">Location:</span> {resumeMetadata.profile.location}
                </div>
              )}
              {resumeMetadata.profile.website && (
                <div>
                  <span className="font-medium">Website:</span>{' '}
                  <a href={resumeMetadata.profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {resumeMetadata.profile.website}
                  </a>
                </div>
              )}
            </div>
            {Object.entries(resumeMetadata.profile.socialLinks || {}).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(resumeMetadata.profile.socialLinks || {}).map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {platform}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Entries Section */}
          <div className="space-y-6">
            {resumeMetadata.entries.map((entry, index) => (
              <div key={index} className="border-b border-gray-200 pb-6 last:border-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-blue-600">{entry.type}</span>
                </div>
                <h3 className="text-xl font-semibold">{entry.title}</h3>
                <p className="text-lg text-gray-700">{entry.company}</p>
                <p className="text-gray-600">
                  {new Date(entry.startDate).toLocaleDateString()} - {entry.endDate === 'Present' ? 'Present' : new Date(entry.endDate).toLocaleDateString()}
                </p>
                <p className="mt-2 text-gray-600">{entry.description}</p>
                {entry.attachments && entry.attachments.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments:</h4>
                    <div className="flex flex-wrap gap-2">
                      {entry.attachments.map((attachment, attachmentIndex) => (
                        <a
                          key={attachmentIndex}
                          href={attachment}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Attachment {attachmentIndex + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 