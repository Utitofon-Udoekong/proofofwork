'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useResumeDraftStore, ResumeDraftEntryType } from '@/app/lib/stores/resumeDraftStore';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '@/app/providers/Web3Provider';
import { EntryType, EntryTypeEnum, ProfileMetadata } from '@/app/lib/types';
import FileUploader from '@/app/components/ui/FileUploader';
import { useFormAutoSave } from '@/app/lib/hooks/useAutoSave';

// Define a basic resume entry template
const emptyEntry: ResumeDraftEntryType = {
  type: EntryTypeEnum.WORK.toString() as EntryType,
  title: '',
  company: '',
  description: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  organization: '',
};

// Helper function to convert EntryTypeEnum to string
const entryTypeToString = (type: EntryTypeEnum): EntryType => {
  const mapping: Record<EntryTypeEnum, EntryType> = {
    [EntryTypeEnum.WORK]: 'work',
    [EntryTypeEnum.EDUCATION]: 'education',
    [EntryTypeEnum.CERTIFICATION]: 'certification',
    [EntryTypeEnum.PROJECT]: 'project',
    [EntryTypeEnum.SKILL]: 'skill',
    [EntryTypeEnum.AWARD]: 'award'
  };
  return mapping[type];
};

// Helper function to convert string EntryType to EntryTypeEnum
const stringToEntryType = (type: string): EntryTypeEnum => {
  const mapping: Record<string, EntryTypeEnum> = {
    'work': EntryTypeEnum.WORK,
    'education': EntryTypeEnum.EDUCATION,
    'certification': EntryTypeEnum.CERTIFICATION,
    'project': EntryTypeEnum.PROJECT,
    'skill': EntryTypeEnum.SKILL,
    'award': EntryTypeEnum.AWARD
  };
  return mapping[type] || EntryTypeEnum.WORK;
};

const entryTypeOptions = [
  { value: EntryTypeEnum.WORK, label: 'Work Experience' },
  { value: EntryTypeEnum.EDUCATION, label: 'Education' },
  { value: EntryTypeEnum.CERTIFICATION, label: 'Certification' },
  { value: EntryTypeEnum.PROJECT, label: 'Project' },
  { value: EntryTypeEnum.SKILL, label: 'Skill' },
  { value: EntryTypeEnum.AWARD, label: 'Award' },
];

export default function CreateResumePage() {
  const router = useRouter();
  const { address, createNewResume, addResumeEntry } = useWeb3();
  
  // Access store with a stable reference
  const store = useResumeDraftStore();
  
  // Extract only what we need from the store
  const [storeActions] = useState({
    createDraft: store.createDraft,
    addEntry: store.addEntry,
    updateEntry: store.updateEntry,
    setActiveEntry: store.setActiveEntry
  });
  
  const { createDraft, addEntry, updateEntry, setActiveEntry } = storeActions;
  
  // State for the resume form
  const [resumeName, setResumeName] = useState('My Professional Resume');
  const [currentStep, setCurrentStep] = useState<'edit' | 'preview' | 'saving'>('edit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  
  // New profile state
  const [profileData, setProfileData] = useState<Partial<ProfileMetadata>>({
    name: resumeName,
    headline: '',
    bio: '',
    location: '',
    contactEmail: '',
    skills: [],
    languages: [],
    socialLinks: {
      linkedin: '',
      github: '',
      twitter: '',
      website: ''
    }
  });

  // Entry form state
  const [entryForms, setEntryForms] = useState<ResumeDraftEntryType[]>([{
    type: entryTypeToString(EntryTypeEnum.WORK),
    title: '',
    company: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    organization: '',
  }]);
  const [activeFormIndex, setActiveFormIndex] = useState<number>(0);
  const [isSavingEntry, setIsSavingEntry] = useState(false);
  const [isDirtyEntry, setIsDirtyEntry] = useState(false);
  const [lastSavedEntry, setLastSavedEntry] = useState<Date | null>(null);
  const [attachments, setAttachments] = useState<{ ipfsUri: string; httpUrl: string; name: string; type: string }[]>([]);
  const [activeEntryIndex, setActiveEntryIndex] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Get the current entry being edited
  const currentEntry = entryForms[activeFormIndex];
  
  // Entry change handler
  const handleEntryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, formIndex: number) => {
    const { name, value } = e.target;
    setEntryForms(prev => {
      const newForms = [...prev];
      newForms[formIndex] = { ...newForms[formIndex], [name]: value };
      return newForms;
    });
    setIsDirtyEntry(true);
  };
  
  // Add a new entry form
  const handleAddEntryForm = () => {
    setEntryForms(prev => [
      ...prev, 
      {
        type: entryTypeToString(EntryTypeEnum.WORK),
        title: '',
        company: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        organization: '',
      }
    ]);
    setActiveFormIndex(entryForms.length); // Set active to the new form
  };
  
  // Remove an entry form
  const handleRemoveEntryForm = (index: number) => {
    setEntryForms(prev => {
      const newForms = [...prev];
      newForms.splice(index, 1);
      return newForms.length > 0 ? newForms : [{
        type: entryTypeToString(EntryTypeEnum.WORK),
        title: '',
        company: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        organization: '',
      }];
    });
    
    // Adjust active index if needed
    if (activeFormIndex >= index) {
      setActiveFormIndex(Math.max(0, activeFormIndex - 1));
    }
  };
  
  // Get the draft for entries display
  const draft = useMemo(() => {
    if (!draftId) return null;
    const drafts = useResumeDraftStore.getState().drafts;
    return drafts[draftId] || null;
  }, [draftId]);
  
  // Create a draft on initial load
  useEffect(() => {
    if (!draftId) {
      const newDraftId = createDraft(undefined, resumeName);
      setDraftId(newDraftId);
    }
  }, [createDraft, resumeName, draftId]);
  
  // Sync resume name with profile name
  useEffect(() => {
    setProfileData(prev => ({
      ...prev,
      name: resumeName
    }));
  }, [resumeName]);

  // Set up auto-save for entry
  const { markAsSaved } = useFormAutoSave(
    currentEntry,
    (data) => {
      if (!draftId) return;
      
      setIsSavingEntry(true);
      try {
        if (isEditMode && activeEntryIndex !== null) {
          updateEntry(draftId, activeEntryIndex, data);
        } else {
          addEntry(draftId, data);
        }
        setLastSavedEntry(new Date());
        setIsDirtyEntry(false);
      } finally {
        setIsSavingEntry(false);
      }
    },
    { delay: 2000 }
  );

  // Handle editing an existing entry
  const handleEditEntry = (index: number) => {
    if (!draft) return;
    
    setActiveEntryIndex(index);
    setIsEditMode(true);
    
    // Update the active form with the entry data
    setEntryForms(prev => {
      const newForms = [...prev];
      newForms[activeFormIndex] = draft.entries[index];
      return newForms;
    });
  };
  
  // Handle submitting entry to draft
  const handleSubmitEntryToDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftId) return;
    
    // Validate all forms
    let hasErrors = false;
    
    // Validate each form
    for (let i = 0; i < entryForms.length; i++) {
      const form = entryForms[i];
      
      if (!form.title.trim()) {
        setError(`Entry ${i+1}: Title is required`);
        hasErrors = true;
        break;
      }
      
      if (!form.company.trim()) {
        setError(`Entry ${i+1}: Company/Institution is required`);
        hasErrors = true;
        break;
      }
      
      if (!form.startDate) {
        setError(`Entry ${i+1}: Start Date is required`);
        hasErrors = true;
        break;
      }
    }
    
    if (hasErrors) {
      return;
    }
    
    setError(null);
    setIsSavingEntry(true);
    
    try {
      if (isEditMode && activeEntryIndex !== null) {
        // Update existing entry
        updateEntry(draftId, activeEntryIndex, entryForms[activeFormIndex]);
        
        // Show success message
        setLastSavedEntry(new Date());
        setIsDirtyEntry(false);
        markAsSaved();
        
        // Set success message
        setSuccessMessage("Entry updated successfully!");
        
        // Reset form mode
        setActiveEntryIndex(null);
        setIsEditMode(false);
      } else {
        // Add all entries to the draft
        for (const formEntry of entryForms) {
          const newEntry = {
            ...formEntry,
            id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
          };
          
          addEntry(draftId, newEntry);
        }
        
        // Show success message
        setLastSavedEntry(new Date());
        setIsDirtyEntry(false);
        markAsSaved();
        
        // Set success message
        setSuccessMessage("Entries added successfully!");
        
        // Reset forms
        setEntryForms([{
          type: entryTypeToString(EntryTypeEnum.WORK),
          title: '',
          company: '',
          description: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          organization: '',
        }]);
        setActiveFormIndex(0);
        setAttachments([]);
      }
    } finally {
      setIsSavingEntry(false);
    }
  };
  
  // Handle submitting entry to blockchain
  const handleSubmitEntryToBlockchain = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Make sure draft is saved first
      await handleSubmitEntryToDraft(e);
      
      // Submit to blockchain - just the current entry
      if (entryForms.length > 0) {
        await addResumeEntry({
          ...entryForms[activeFormIndex],
          // Ensure dates are in the correct format
          startDate: entryForms[activeFormIndex].startDate || new Date().toISOString().split('T')[0],
          endDate: entryForms[activeFormIndex].endDate || ''
        });
      }
      
      // Add a fresh form
      setEntryForms([{
        type: entryTypeToString(EntryTypeEnum.WORK),
        title: '',
        company: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        organization: '',
      }]);
      setActiveFormIndex(0);
    } catch (error) {
      console.error("Error submitting to blockchain:", error);
    }
  };
  
  // Handle file uploads
  const handleFileUploaded = (ipfsUri: string, httpUrl: string, file: File) => {
    const newAttachment = {
      ipfsUri,
      httpUrl,
      name: file.name,
      type: file.type
    };
    
    setAttachments(prev => [...prev, newAttachment]);
    
    // Add file reference to form data for the current active form
    setEntryForms(prev => {
      const newForms = [...prev];
      const currentForm = newForms[activeFormIndex];
      newForms[activeFormIndex] = {
        ...currentForm,
        attachments: [...(currentForm.attachments || []), ipfsUri]
      };
      return newForms;
    });
    
    setIsDirtyEntry(true);
  };

  // Check if user is connected to a wallet
  const isConnected = !!address;

  // Preview resume before saving
  const handlePreviewResume = () => {
    if (!draftId) {
      setError('No draft found. Please try again.');
      return;
    }
    
    // Get entries from the draft store
    const draft = useResumeDraftStore.getState().drafts[draftId];
    
    if (!draft || draft.entries.length === 0) {
      setError('Please add at least one entry to your resume.');
      return;
    }
    
    // Check for valid entries
    const validEntries = draft.entries.filter(entry => 
      entry.title.trim() !== '' && 
      (entry.company.trim() !== '' || entry.organization.trim() !== '')
    );
    
    if (validEntries.length === 0) {
      setError('Please add at least one valid entry to your resume.');
      return;
    }
    
    setError(null);
    setCurrentStep('preview');
  };

  // Go back to editing
  const handleBackToEdit = () => {
    setCurrentStep('edit');
  };

  // Handle entry complete - not needed anymore
  const handleEntryComplete = (saved: boolean) => {
    if (saved) {
      // Successfully saved entry
      console.log('Entry saved successfully');
    }
  };

  // Save resume without minting NFT
  const handleSaveResume = async (shouldMint: boolean = false) => {
    if (!isConnected) {
      setError('Please connect your wallet to save your resume.');
      return;
    }
    
    if (!draftId) {
      setError('No draft found. Please try again.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Get the draft data
      const draft = useResumeDraftStore.getState().drafts[draftId];
      
      if (!draft || draft.entries.length === 0) {
        setError('Please add at least one entry to your resume.');
        setIsSubmitting(false);
        return;
      }
      
      // Filter valid entries
      const validEntries = draft.entries.filter(entry => 
        entry.title.trim() !== '' && 
        (entry.company.trim() !== '' || entry.organization.trim() !== '')
      );
      
      if (validEntries.length === 0) {
        setError('Please add at least one valid entry to your resume.');
        setIsSubmitting(false);
        return;
      }
      
      if (shouldMint) {
        // Create NFT on the blockchain if requested
        setCurrentStep('saving');
        
        // Ensure profile data includes the most up-to-date name
        const finalProfileData: ProfileMetadata = {
          ...profileData as ProfileMetadata,
          name: resumeName,
          lastUpdated: new Date().toISOString()
        };
        
        // Create new resume with complete profile data
        await createNewResume(resumeName, finalProfileData);
      }
      
      // Redirect to dashboard after successful save
      router.push('/dashboard');
    } catch (error) {
      console.error("Error saving resume:", error);
      setError('An error occurred while saving your resume. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear success message after a delay
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // If not connected to wallet, show connect prompt
  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Create Your Resume</h1>
          <p className="text-gray-300 mb-6">
            Connect your wallet to start creating your resume.
          </p>
          <p className="text-amber-400 text-sm">
            Your wallet address will only be used for authentication. Your resume will be stored locally first.
          </p>
        </div>
      </div>
    );
  }

  // Edit resume step
  if (currentStep === 'edit' && draftId) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Create Your Resume</h1>
            <p className="text-gray-300 text-sm">
              Add your profile information and work experience to build your professional resume.
            </p>
          </div>
        </div>

        <div className="bg-gray-700 p-3 rounded-md mb-6 text-gray-300 text-sm">
          <p><span className="text-red-400">*</span> indicates required fields</p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 p-4 rounded-md mb-6 text-red-200">
            <p>{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-900/50 border border-green-700 p-4 rounded-md mb-6 text-green-200">
            <p>{successMessage}</p>
          </div>
        )}

        {/* Resume Name/Basic Info */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Resume Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={resumeName}
                  onChange={(e) => setResumeName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="My Professional Resume"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Profile Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Professional Headline <span className="text-gray-500">(optional)</span>
                </label>
                <input
                  type="text"
                  value={profileData.headline || ''}
                  onChange={(e) => setProfileData(prev => ({ ...prev, headline: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Senior Software Engineer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Location <span className="text-gray-500">(optional)</span>
                </label>
                <input
                  type="text"
                  value={profileData.location || ''}
                  onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="San Francisco, CA"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Professional Bio <span className="text-gray-500">(optional)</span>
              </label>
              <textarea
                value={profileData.bio || ''}
                onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="A brief summary of your professional background and expertise..."
              ></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Contact Email <span className="text-gray-500">(optional)</span>
              </label>
              <input
                type="email"
                value={profileData.contactEmail || ''}
                onChange={(e) => setProfileData(prev => ({ ...prev, contactEmail: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your.email@example.com"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Resume Entries</h2>
            <p className="text-gray-400 mb-4">Add work experience, education, certifications, and other relevant items to your resume.</p>
            
            {/* Current Entries List */}
            {draft && draft.entries.length > 0 && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-white mb-3">Your Saved Entries</h3>
                <div className="bg-gray-700 rounded-md p-4 space-y-2">
                  {draft.entries.map((entry, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-800 rounded-md">
                      <div>
                        <h4 className="text-white font-medium">{entry.title || "Untitled"}</h4>
                        <p className="text-gray-400 text-sm">
                          {entry.company || entry.organization || "No company"} • {entry.type}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleEditEntry(index)}
                        className="text-blue-400 text-sm hover:text-blue-300"
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="border-t border-gray-700 pt-4 mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-medium text-white">Add New Entries</h3>
                <button
                  type="button"
                  onClick={handleAddEntryForm}
                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Another Entry
                </button>
              </div>
              
              {/* Entry form tabs */}
              <div className="flex border-b border-gray-700 mb-4">
                {entryForms.map((form, index) => (
                  <button
                    key={index}
                    className={`py-2 px-4 mr-2 text-sm font-medium rounded-t-md ${
                      activeFormIndex === index 
                        ? 'bg-gray-700 text-white border-t border-l border-r border-gray-600' 
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                    onClick={() => setActiveFormIndex(index)}
                  >
                    Entry {index + 1}
                    {entryForms.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (entryForms.length > 1) {
                            handleRemoveEntryForm(index);
                          }
                        }}
                        className="ml-2 text-gray-500 hover:text-red-400"
                      >
                        ×
                      </button>
                    )}
                  </button>
                ))}
              </div>
              
              {/* Current entry form */}
              <form onSubmit={handleSubmitEntryToDraft} className="space-y-6">
                <div className="space-y-4">
                  {/* Entry Type */}
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">
                      Entry Type <span className="text-red-400">*</span>
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={currentEntry.type}
                      onChange={(e) => handleEntryChange(e, activeFormIndex)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value={entryTypeToString(EntryTypeEnum.EDUCATION)}>Education</option>
                      <option value={entryTypeToString(EntryTypeEnum.WORK)}>Work Experience</option>
                      <option value={entryTypeToString(EntryTypeEnum.CERTIFICATION)}>Certification</option>
                      <option value={entryTypeToString(EntryTypeEnum.SKILL)}>Skill</option>
                      <option value={entryTypeToString(EntryTypeEnum.PROJECT)}>Project</option>
                    </select>
                  </div>

                  {/* Title */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
                      Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={currentEntry.title}
                      onChange={(e) => handleEntryChange(e, activeFormIndex)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={
                        stringToEntryType(currentEntry.type) === EntryTypeEnum.EDUCATION
                          ? "Degree or Certificate"
                          : stringToEntryType(currentEntry.type) === EntryTypeEnum.WORK
                          ? "Job Title"
                          : stringToEntryType(currentEntry.type) === EntryTypeEnum.CERTIFICATION
                          ? "Certification Name"
                          : stringToEntryType(currentEntry.type) === EntryTypeEnum.SKILL
                          ? "Skill Name"
                          : "Project Title"
                      }
                      required
                    />
                  </div>

                  {/* Company / Institution */}
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-300 mb-1">
                      {stringToEntryType(currentEntry.type) === EntryTypeEnum.EDUCATION
                        ? "Institution"
                        : stringToEntryType(currentEntry.type) === EntryTypeEnum.WORK
                        ? "Company"
                        : stringToEntryType(currentEntry.type) === EntryTypeEnum.CERTIFICATION
                        ? "Issuing Organization"
                        : stringToEntryType(currentEntry.type) === EntryTypeEnum.PROJECT
                        ? "Organization"
                        : "Company"} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={currentEntry.company}
                      onChange={(e) => handleEntryChange(e, activeFormIndex)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                      Description <span className="text-gray-500">(optional)</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      value={currentEntry.description}
                      onChange={(e) => handleEntryChange(e, activeFormIndex)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-1">
                        Start Date <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        value={currentEntry.startDate}
                        onChange={(e) => handleEntryChange(e, activeFormIndex)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-1">
                        End Date <span className="text-gray-500">(leave empty for current positions)</span>
                      </label>
                      <input
                        type="date"
                        id="endDate"
                        name="endDate"
                        value={currentEntry.endDate}
                        onChange={(e) => handleEntryChange(e, activeFormIndex)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Verification Organization */}
                  <div>
                    <label htmlFor="organization" className="block text-sm font-medium text-gray-300 mb-1">
                      Verification Organization <span className="text-gray-500">(optional)</span>
                    </label>
                    <input
                      type="text"
                      id="organization"
                      name="organization"
                      value={currentEntry.organization}
                      onChange={(e) => handleEntryChange(e, activeFormIndex)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Organization that can verify this entry"
                    />
                  </div>

                  {/* File Attachments */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Attachments
                    </label>
                    <FileUploader
                      onFileUploaded={handleFileUploaded}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      buttonText="Upload Document"
                    />
                    
                    {attachments.length > 0 && (
                      <ul className="mt-2 divide-y divide-gray-600">
                        {attachments.map((attachment, index) => (
                          <li key={index} className="py-2 flex justify-between items-center">
                            <div className="flex items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-gray-400 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              <a
                                href={attachment.httpUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-400 hover:underline"
                              >
                                {attachment.name}
                              </a>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setAttachments(prev => prev.filter((_: any, i: number) => i !== index));
                                setEntryForms(prev => {
                                  const newForms = [...prev];
                                  newForms[activeFormIndex] = {
                                    ...newForms[activeFormIndex],
                                    attachments: (newForms[activeFormIndex].attachments || []).filter((_: unknown, i: number) => i !== index)
                                  };
                                  return newForms;
                                });
                                setIsDirtyEntry(true);
                              }}
                              className="text-red-500 hover:text-red-400"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Save status and buttons */}
                <div className="flex items-center text-sm text-gray-400 justify-between pt-2 border-t border-gray-700 mt-6">
                  <div>
                    {isSavingEntry ? (
                      <span>Saving...</span>
                    ) : isDirtyEntry ? (
                      <span>Unsaved changes</span>
                    ) : lastSavedEntry ? (
                      <span>
                        Last saved: {lastSavedEntry.toLocaleTimeString()}
                      </span>
                    ) : null}
                  </div>
                  
                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={isSavingEntry}
                      className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {isEditMode ? 'Save Changes' : 'Save All Entries'}
                    </button>
                  </div>
                </div>
              </form>
              
              <div className="border-t border-gray-700 pt-4 mt-6">
                <h3 className="text-md font-medium text-white mb-2">Ready to Continue?</h3>
                <p className="text-gray-400 text-sm mb-3">Once you've added all your entries, preview your resume before saving.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePreviewResume}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Preview Resume
          </button>
        </div>
      </div>
    );
  }

  // Preview step
  if (currentStep === 'preview' && draftId) {
    // Get the current draft from the store
    const drafts = useResumeDraftStore.getState().drafts;
    const draft = drafts[draftId];
    
    // Filter valid entries for preview
    const validEntries = draft ? draft.entries.filter((entry: ResumeDraftEntryType) => 
      entry.title.trim() !== '' && 
      (entry.company.trim() !== '' || entry.organization.trim() !== '')
    ) : [];

    // Group entries by type
    const entriesByType = validEntries.reduce((acc: Record<string, ResumeDraftEntryType[]>, entry: ResumeDraftEntryType) => {
      if (!acc[entry.type]) {
        acc[entry.type] = [];
      }
      acc[entry.type].push(entry);
      return acc;
    }, {} as Record<string, ResumeDraftEntryType[]>);

    // Format date helper 
    const formatDate = (dateString: string) => {
      if (!dateString) return "Present";
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { year: 'numeric', month: 'short' });
    };

    // Helper to get display name for entry type
    const getEntryTypeDisplayName = (typeKey: string): string => {
      const entryType = stringToEntryType(typeKey);
      switch(entryType) {
        case EntryTypeEnum.WORK: return 'Work Experience';
        case EntryTypeEnum.EDUCATION: return 'Education';
        case EntryTypeEnum.CERTIFICATION: return 'Certifications';
        case EntryTypeEnum.PROJECT: return 'Projects';
        case EntryTypeEnum.SKILL: return 'Skills';
        case EntryTypeEnum.AWARD: return 'Awards & Honors';
        default: return typeKey;
      }
    };

    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Preview Your Resume</h1>
            <p className="text-gray-300 text-sm">
              Review your resume before saving. You can make changes if needed.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 p-4 rounded-md mb-6 text-red-200">
            <p>{error}</p>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">{resumeName}</h2>
            <p className="text-gray-400 mt-1">{address}</p>
          </div>

          <div className="p-6">
            {Object.keys(entriesByType).length > 0 ? (
              Object.entries(entriesByType).map(([type, entries]) => (
                <div key={type} className="mb-8 last:mb-0">
                  <h3 className="text-lg font-semibold text-white pb-2 border-b border-gray-700 mb-4">
                    {getEntryTypeDisplayName(type)}
                  </h3>
                  
                  <div className="space-y-6">
                    {entries.map((entry: ResumeDraftEntryType, index: number) => (
                      <div key={index} className="flex flex-col md:flex-row gap-4">
                        <div className="md:w-1/4">
                          <p className="text-gray-300 font-medium">
                            {formatDate(entry.startDate)} - {formatDate(entry.endDate)}
                          </p>
                        </div>
                        
                        <div className="md:w-3/4">
                          <h4 className="text-lg font-medium text-white">{entry.title}</h4>
                          <p className="text-gray-300">{entry.organization || entry.company}</p>
                          <p className="mt-2 text-gray-400 whitespace-pre-line">{entry.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-8">No valid entries to display. Please add some entries.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={handleBackToEdit}
            className="px-4 py-2 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Edit
          </button>
          <button
            type="button"
            onClick={() => handleSaveResume(false)}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => handleSaveResume(true)}
            disabled={isSubmitting}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            Mint as NFT
          </button>
        </div>
      </div>
    );
  }

  // Saving/minting step
  if (currentStep === 'saving') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Creating Your Resume NFT</h1>
          
          <div className="flex justify-center my-8">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>
          
          <p className="text-gray-300 mb-2">
            Please wait while we create your on-chain resume NFT.
          </p>
          <p className="text-gray-400 text-sm">
            This may take a minute. Please approve the transaction in your wallet when prompted.
          </p>
        </div>
      </div>
    );
  }

  // Fallback
  return null;
} 