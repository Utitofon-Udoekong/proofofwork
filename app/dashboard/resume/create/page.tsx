'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useResumeDraftStore, DraftAttachment, DraftResumeEntry } from '@/app/lib/stores/resumeDraftStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWeb3 } from '@/app/providers/Web3Provider';
import { EntryType, EntryTypeEnum, ProfileMetadata } from '@/app/lib/types';
import FileUploader from '@/app/components/ui/FileUploader';
import { useFormAutoSave } from '@/app/hooks/useAutoSave';
import { IPFSService } from '@/app/lib/services/ipfs';
import Link from 'next/link';

// Get IPFS service singleton
const ipfsService = IPFSService.getInstance();

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

// This is the new component containing the original logic
function CreateResumeFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlDraftId = searchParams.get('draftId');
  const { address, createNewResume } = useWeb3();

  // Access store with a stable reference
  const store = useResumeDraftStore();

  // Extract only what we need from the store
  const [storeActions] = useState({
    createDraft: store.createDraft,
    addEntry: store.addEntry,
    updateEntry: store.updateEntry
  });

  const { createDraft, addEntry, updateEntry } = storeActions;

  // State for the resume form
  const [resumeName, setResumeName] = useState('My Professional Resume');
  const [currentStep, setCurrentStep] = useState<'edit' | 'preview' | 'saving' | 'success'>('edit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isDraftMode, setIsDraftMode] = useState<boolean>(false);
  const [resumeVersion, setResumeVersion] = useState('1.0');

  // New profile state
  const [profileData, setProfileData] = useState<Partial<ProfileMetadata>>({
    name: '',
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

  // Entry form state - use DraftResumeEntry instead of ResumeDraftEntryType
  const [entryForms, setEntryForms] = useState<DraftResumeEntry[]>([{
    id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    type: entryTypeToString(EntryTypeEnum.WORK),
    title: '',
    company: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    organization: '',
    verified: false,
    attachments: []
  }]);
  const [activeFormIndex, setActiveFormIndex] = useState<number>(0);
  const [isSavingEntry, setIsSavingEntry] = useState(false);
  const [isDirtyEntry, setIsDirtyEntry] = useState(false);
  const [lastSavedEntry, setLastSavedEntry] = useState<Date | null>(null);
  const [attachments, setAttachments] = useState<DraftAttachment[]>([]);
  const [activeEntryIndex, setActiveEntryIndex] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  // Add new state variables at the top with other state declarations
  const [isUploadingAttachments, setIsUploadingAttachments] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
        id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type: entryTypeToString(EntryTypeEnum.WORK),
        title: '',
        company: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        organization: '',
        verified: false,
        attachments: []
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
        id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type: entryTypeToString(EntryTypeEnum.WORK),
        title: '',
        company: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        organization: '',
        verified: false,
        attachments: []
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

  // Load draft from URL parameter if provided
  useEffect(() => {
    if (urlDraftId) {
      // Check if this draft exists
      const drafts = useResumeDraftStore.getState().drafts;
      const draft = drafts[urlDraftId];

      if (draft) {
                setDraftId(urlDraftId);
        setIsDraftMode(true);

        // Load draft data
        if (draft.name) {
          setResumeName(draft.name);
                  }

        // Update profile data if available
        if (draft.profile) {
          
          // Create a new object with all the profile fields
          const profileUpdate = {
            name: draft.profile.name || '',
            headline: draft.profile.headline || '',
            bio: draft.profile.bio || '',
            location: draft.profile.location || '',
            contactEmail: draft.profile.contactEmail || '',
            socialLinks: draft.profile.socialLinks ? { ...draft.profile.socialLinks } : {
              linkedin: '',
              github: '',
              twitter: '',
              website: ''
            },
            skills: draft.profile.skills ? [...draft.profile.skills] : [],
            languages: draft.profile.languages ? [...draft.profile.languages] : []
          };

                    setProfileData(profileUpdate);
        }

        // If the draft has entries, load them for editing
        const draftEntries = Array.isArray(draft.entries) ? draft.entries : [];
        if (draftEntries.length > 0) {
                    // Deep copy the entries to avoid reference issues
          const entriesCopy: DraftResumeEntry[] = draftEntries.map(entry => ({ ...entry, attachments: Array.isArray(entry.attachments) ? entry.attachments : [] }));
          setEntryForms(entriesCopy);
          setActiveFormIndex(0);
        }
      }
    }
  }, [urlDraftId]);

  // Set up auto-save for entry
  type EntryFormType = DraftResumeEntry;
  const { markAsSaved } = useFormAutoSave(
    currentEntry as EntryFormType,
    (data: EntryFormType) => {
      if (!draftId) return;
      setIsSavingEntry(true);
      try {
        if (isEditMode && activeEntryIndex !== null) {
          updateEntry(draftId, activeEntryIndex, data);
        } else if (isDraftMode) {
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

    const draftEntries = Array.isArray(draft.entries) ? draft.entries : [];
    if (index >= draftEntries.length) return;

    setActiveEntryIndex(index);
    setIsEditMode(true);

    // Update the active form with the entry data
    setEntryForms(prev => {
      const newForms = [...prev];
      newForms[activeFormIndex] = draftEntries[index] as DraftResumeEntry;
      return newForms;
    });
  };

  // Handle creating a draft from current form data
  const handleCreateDraft = () => {
    // Validate that the user has filled in at least some information
    const hasEnteredData =
      resumeName !== 'My Professional Resume' || // Custom resume name
      profileData.name || // Custom profile name
      profileData.headline || // Any headline
      profileData.location || // Any location
      profileData.bio || // Any bio
      profileData.contactEmail || // Any email
      entryForms.some(form => form.title || form.company || form.description); // Any entry data

    if (!hasEnteredData) {
      setError('Please fill in some information before saving a draft.');
      return;
    }

    // Clear any existing errors
    setError(null);

    // Use complete profile data (in the new format, profile directly contains all fields)
    const completeProfileData: ProfileMetadata = {
      name: profileData.name || '',
      headline: profileData.headline || '',
      bio: profileData.bio || '',
      location: profileData.location || '',
      contactEmail: profileData.contactEmail || '',
      socialLinks: profileData.socialLinks || {
        linkedin: '',
        github: '',
        twitter: '',
        website: ''
      },
      skills: profileData.skills || [],
      languages: profileData.languages || [],
      lastUpdated: new Date().toISOString()
    };

    
    // Create a new draft or update existing one
    if (!draftId) {
      const newDraftId = createDraft(undefined, resumeName);
      setDraftId(newDraftId);
      setIsDraftMode(true);

      // Update the draft with current data in the new format
      const draftUpdate = {
        name: resumeName,
        profile: completeProfileData,
        entries: entryForms.map(form => ({ ...form, attachments: Array.isArray(form.attachments) ? form.attachments : [] })),
        version: "1.0",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      
      useResumeDraftStore.getState().updateDraft(newDraftId, draftUpdate);
      setSuccessMessage('Draft created successfully!');
    } else {
      // Update existing draft
      const draftUpdate = {
        name: resumeName,
        profile: completeProfileData,
        entries: entryForms.map(form => ({ ...form, attachments: Array.isArray(form.attachments) ? form.attachments : [] })),
        updatedAt: new Date().toISOString()
      };

      
      useResumeDraftStore.getState().updateDraft(draftId, draftUpdate);
      setSuccessMessage('Draft updated successfully!');
    }
  };

  // Handle submitting entry to draft
  const handleSubmitEntryToDraft = (e: React.FormEvent) => {
    e.preventDefault();

    // If we\'re not in draft mode, create a draft first
    if (!isDraftMode) {
      handleCreateDraft();
      return;
    }

    if (!draftId) return;

    // Validate all forms
    let hasErrors = false;

    // Validate each form
    for (let i = 0; i < entryForms.length; i++) {
      const form = entryForms[i];

      if (!form.title.trim()) {
        setError(`Entry ${i + 1}: Title is required`);
        hasErrors = true;
        break;
      }

      if (!form.company.trim()) {
        setError(`Entry ${i + 1}: Company/Institution is required`);
        hasErrors = true;
        break;
      }

      if (!form.startDate) {
        setError(`Entry ${i + 1}: Start Date is required`);
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

        // Reset forms only in edit mode
        setEntryForms([{
          id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: entryTypeToString(EntryTypeEnum.WORK),
          title: '',
          company: '',
          description: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          organization: '',
          verified: false,
          attachments: []
        }]);
        setActiveFormIndex(0);
        setAttachments([]);
      } else {
        // Add all entries to the draft
        const updatedEntries = [...entryForms];

        for (let i = 0; i < updatedEntries.length; i++) {
          if (!updatedEntries[i].id) {
            updatedEntries[i] = {
              ...updatedEntries[i],
              id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
            };
          }
        }

        // Prepare complete profile data
        const completeProfileData = {
          name: profileData.name || '',
          headline: profileData.headline || '',
          bio: profileData.bio || '',
          location: profileData.location || '',
          contactEmail: profileData.contactEmail || '',
          socialLinks: profileData.socialLinks || {
            linkedin: '',
            github: '',
            twitter: '',
            website: ''
          },
          skills: profileData.skills || [],
          languages: profileData.languages || [],
          lastUpdated: new Date().toISOString()
        };

        // Update the entire draft with all current form data
        const draftUpdate = {
          name: resumeName,
          profileData: completeProfileData,
          entries: updatedEntries.map(form => ({ ...form, attachments: Array.isArray(form.attachments) ? form.attachments : [] })),
          lastUpdated: new Date().toISOString()
        };

                useResumeDraftStore.getState().updateDraft(draftId, draftUpdate);

        // Show success message
        setLastSavedEntry(new Date());
        setIsDirtyEntry(false);
        markAsSaved();

        // Set success message
        setSuccessMessage("Entries added successfully!");

        // Don\'t reset forms when adding new entries - keep current form data
      }
    } finally {
      setIsSavingEntry(false);
    }
  };

  // Handle saving and returning to dashboard
  const handleSaveAndExit = () => {
    // Create/update the draft
    handleCreateDraft();

    // Redirect to dashboard
    setTimeout(() => {
      router.push('/dashboard');
    }, 500); // Small delay to ensure draft is saved
  };

 

  // Handle file uploads
  const handleFileUploaded = (file: File, dataUrl: string) => {
    try {
      if (!file || !file.name || !file.type) {
        throw new Error('Invalid file data');
      }

      const newAttachment: DraftAttachment = {
        name: file.name,
        type: file.type,
        data: dataUrl // Store as data URL or httpUrl for preview; will be replaced at mint
      };

      setAttachments(prev => [...prev, newAttachment]);
      setEntryForms(prev => {
        const newForms = [...prev];
        const currentForm = newForms[activeFormIndex];
        newForms[activeFormIndex] = {
          ...currentForm,
          attachments: [...(currentForm.attachments || []), newAttachment]
        };
        return newForms;
      });
      setIsDirtyEntry(true);
    } catch (error) {
      console.error('Error handling file upload:', error);
      setError(error instanceof Error ? error.message : 'Failed to process file upload');
    }
  };

  // Handle file upload errors
  const handleFileError = (error: Error) => {
    setError(error.message);
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
    const drafts = useResumeDraftStore.getState().drafts;
    const draft = drafts[draftId];

    if (!draft) {
      setError('Draft not found. Please try again.');
      return;
    }

    // Ensure entries is always an array
    const entries = Array.isArray(draft.entries) ? draft.entries : [];

    if (entries.length === 0) {
      setError('Please add at least one entry to your resume.');
      return;
    }

    // Check for valid entries
    const validEntries = entries.filter(entry =>
      entry.title.trim() !== '' &&
      (entry.company.trim() !== '' || (entry.organization || '').trim() !== '')
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

  // Save resume without minting NFT or mint as NFT
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
      const drafts = useResumeDraftStore.getState().drafts;
      const draft = drafts[draftId];
      if (!draft) {
        setError('Draft not found. Please try again.');
        setIsSubmitting(false);
        return;
      }
      // Ensure entries is always an array
      const entries = Array.isArray(draft.entries) ? draft.entries : [];
      if (entries.length === 0) {
        setError('Please add at least one entry to your resume.');
        setIsSubmitting(false);
        return;
      }
      // Filter valid entries
      const validEntries = entries.filter(entry =>
        entry.title.trim() !== '' &&
        (entry.company.trim() !== '' || (entry.organization || '').trim() !== '')
      );
      if (validEntries.length === 0) {
        setError('Please add at least one valid entry to your resume.');
        setIsSubmitting(false);
        return;
      }
      if (shouldMint) {
        try {
          setCurrentStep('saving');
          handleCreateDraft();
          
          // Start attachment upload process
          setIsUploadingAttachments(true);
          setUploadProgress(0);
          
          // Use processAttachmentsForMint to upload attachments and get mint-ready metadata
          const resumeMetadata = await useResumeDraftStore.getState().processAttachmentsForMint(draftId);
                    if (!resumeMetadata) {
            throw new Error('Failed to process attachments for minting');
          }

          // Upload the metadata to IPFS
          setUploadProgress(50);
          const ipfsUri = await ipfsService.uploadResumeMetadata(resumeMetadata);
                    
          // Start minting process
          setIsUploadingAttachments(false);
          setIsMinting(true);
          setUploadProgress(75);
          
                    const txHash = await createNewResume(resumeName, ipfsUri);
          if (txHash) {
            setTransactionHash(txHash);
            useResumeDraftStore.getState().deleteDraft(draftId);
            setSuccessMessage('Resume created and published on blockchain!');
            setUploadProgress(100);
          }
           
          router.push('/dashboard');
        } catch (mintError) {
          console.error("Error minting resume:", mintError);
          setCurrentStep('edit');
          setIsUploadingAttachments(false);
          setIsMinting(false);
          setUploadProgress(0);
          if (mintError instanceof Error) {
            if (mintError.message.includes('user rejected') ||
              mintError.message.includes('User denied') ||
              mintError.message.includes('transaction was rejected')) {
              setError('Transaction was cancelled. Your resume is saved as a draft but not minted.');
            } else {
              setError(`Error minting your resume: ${mintError.message}. Your resume is saved as a draft.`);
            }
          } else {
            setError('An unexpected error occurred while minting your resume. Your resume is saved as a draft.');
          }
          return;
        }
      }
      setSuccessMessage('Resume saved as draft successfully!');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error) {
      console.error("Error saving resume:", error);
      setError('An error occurred while saving your resume. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsUploadingAttachments(false);
      setIsMinting(false);
      setUploadProgress(0);
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
  if (currentStep === 'edit') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Create Your Resume</h1>
            <p className="text-gray-300 text-sm">
              Add your profile information and work experience to build your professional resume.
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleCreateDraft}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              {draftId ? 'Update Draft' : 'Save as Draft'}
            </button>
            <button
              onClick={handleSaveAndExit}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Save & Exit
            </button>
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
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Resume Version
                </label>
                <input
                  type="text"
                  value={resumeVersion}
                  onChange={(e) => setResumeVersion(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1.0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Profile Information</h2>

            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={profileData.name || ''}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

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

            <div className="mb-4">
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

            {/* Social Links */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Social Links <span className="text-gray-500">(optional)</span>
              </label>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">LinkedIn</label>
                  <input
                    type="url"
                    value={profileData.socialLinks?.linkedin || ''}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                    }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">GitHub</label>
                  <input
                    type="url"
                    value={profileData.socialLinks?.github || ''}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, github: e.target.value }
                    }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://github.com/yourusername"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Twitter</label>
                  <input
                    type="url"
                    value={profileData.socialLinks?.twitter || ''}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                    }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://twitter.com/yourhandle"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Personal Website</label>
                  <input
                    type="url"
                    value={profileData.socialLinks?.website || ''}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, website: e.target.value }
                    }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Skills <span className="text-gray-500">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {profileData.skills?.map((skill, index) => (
                  <div key={index} className="flex items-center bg-gray-700 rounded-full px-3 py-1">
                    <span className="text-sm text-white">{skill}</span>
                    <button
                      type="button"
                      onClick={() => setProfileData(prev => ({
                        ...prev,
                        skills: prev.skills?.filter((_, i) => i !== index) || []
                      }))}
                      className="ml-2 text-gray-400 hover:text-red-400"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newSkill.trim()) {
                        setProfileData(prev => ({
                          ...prev,
                          skills: [...(prev.skills || []), newSkill.trim()]
                        }));
                        setNewSkill('');
                      }
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a skill and press Enter"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newSkill.trim()) {
                      setProfileData(prev => ({
                        ...prev,
                        skills: [...(prev.skills || []), newSkill.trim()]
                      }));
                      setNewSkill('');
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Languages */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Languages <span className="text-gray-500">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {profileData.languages?.map((language, index) => (
                  <div key={index} className="flex items-center bg-gray-700 rounded-full px-3 py-1">
                    <span className="text-sm text-white">{language}</span>
                    <button
                      type="button"
                      onClick={() => setProfileData(prev => ({
                        ...prev,
                        languages: prev.languages?.filter((_, i) => i !== index) || []
                      }))}
                      className="ml-2 text-gray-400 hover:text-red-400"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newLanguage.trim()) {
                        setProfileData(prev => ({
                          ...prev,
                          languages: [...(prev.languages || []), newLanguage.trim()]
                        }));
                        setNewLanguage('');
                      }
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a language and press Enter"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newLanguage.trim()) {
                      setProfileData(prev => ({
                        ...prev,
                        languages: [...(prev.languages || []), newLanguage.trim()]
                      }));
                      setNewLanguage('');
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Resume Entries</h2>
            <p className="text-gray-400 mb-4">Add work experience, education, certifications, and other relevant items to your resume.</p>

            {/* Current Entries List */}
            {draft && Array.isArray(draft.entries) && draft.entries.length > 0 && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-white mb-3">Your Saved Entries</h3>
                <div className="bg-gray-700 rounded-md p-4 space-y-2">
                  {draft.entries.map((entry, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-800 rounded-md">
                      <div>
                        <h4 className="text-white font-medium">{entry.title || "Untitled"}</h4>
                        <p className="text-gray-400 text-sm">
                          {entry.company || (entry.organization || "")} • {entry.type}
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
                    className={`py-2 px-4 mr-2 text-sm font-medium rounded-t-md ${activeFormIndex === index
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
                      onError={handleFileError}
                      accept=".pdf,.jpg,.jpeg,.png"
                      buttonText="Upload Certificate"
                      maxSizeMB={5}
                    />
                    <p className="mt-1 text-sm text-gray-400">
                      Supported formats: PDF, JPG, PNG (max 5MB)
                    </p>

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
                                href={attachment.data}
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
                                setAttachments(prev => prev.filter((_: unknown, i: number) => i !== index));
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
                <p className="text-gray-400 text-sm mb-3">Once you&apos;ve added all your entries, preview your resume before saving.</p>
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

    // Filter valid entries for preview - with safety checks
    const entries: DraftResumeEntry[] = Array.isArray(draft?.entries) ? draft.entries : [];
    const validEntries = entries.filter((entry: DraftResumeEntry) =>
      entry.title.trim() !== '' &&
      (entry.company.trim() !== '' || (entry.organization || '').trim() !== '')
    );

    // Group entries by type
    const entriesByType = validEntries.reduce((acc: Record<string, DraftResumeEntry[]>, entry: DraftResumeEntry) => {
      if (!acc[entry.type]) {
        acc[entry.type] = [];
      }
      acc[entry.type].push(entry);
      return acc;
    }, {} as Record<string, DraftResumeEntry[]>);

    // Format date helper 
    const formatDate = (dateString: string) => {
      if (!dateString) return "Present";
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { year: 'numeric', month: 'short' });
    };

    // Helper to get display name for entry type
    const getEntryTypeDisplayName = (typeKey: string): string => {
      const entryType = stringToEntryType(typeKey);
      switch (entryType) {
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
            <h2 className="text-xl font-semibold text-white">{resumeName}</h2>
            <p className="text-gray-400 mt-1">{address}</p>
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
                    <p className="text-white">{profileData.name || 'Not provided'}</p>
                  </div>
                </div>

                {profileData.headline && (
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/4">
                      <p className="text-gray-300 font-medium">Professional Headline</p>
                    </div>
                    <div className="md:w-3/4">
                      <p className="text-white">{profileData.headline}</p>
                    </div>
                  </div>
                )}

                {profileData.location && (
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/4">
                      <p className="text-gray-300 font-medium">Location</p>
                    </div>
                    <div className="md:w-3/4">
                      <p className="text-white">{profileData.location}</p>
                    </div>
                  </div>
                )}

                {profileData.contactEmail && (
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/4">
                      <p className="text-gray-300 font-medium">Contact Email</p>
                    </div>
                    <div className="md:w-3/4">
                      <p className="text-white">{profileData.contactEmail}</p>
                    </div>
                  </div>
                )}

                {/* Social Links */}
                {(profileData.socialLinks?.linkedin || profileData.socialLinks?.github || profileData.socialLinks?.twitter || profileData.socialLinks?.website) && (
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/4">
                      <p className="text-gray-300 font-medium">Social Links</p>
                    </div>
                    <div className="md:w-3/4">
                      <div className="flex flex-wrap gap-2">
                        {profileData.socialLinks?.linkedin && (
                          <a href={profileData.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                            LinkedIn
                          </a>
                        )}
                        {profileData.socialLinks?.github && (
                          <a href={profileData.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                            GitHub
                          </a>
                        )}
                        {profileData.socialLinks?.twitter && (
                          <a href={profileData.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                            Twitter
                          </a>
                        )}
                        {profileData.socialLinks?.website && (
                          <a href={profileData.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                            Website
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Skills */}
                {profileData.skills && profileData.skills.length > 0 && (
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/4">
                      <p className="text-gray-300 font-medium">Skills</p>
                    </div>
                    <div className="md:w-3/4">
                      <div className="flex flex-wrap gap-2">
                        {profileData.skills.map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-700 rounded-full text-sm text-white">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Languages */}
                {profileData.languages && profileData.languages.length > 0 && (
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/4">
                      <p className="text-gray-300 font-medium">Languages</p>
                    </div>
                    <div className="md:w-3/4">
                      <div className="flex flex-wrap gap-2">
                        {profileData.languages.map((language, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-700 rounded-full text-sm text-white">
                            {language}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}


                {profileData.bio && (
                  <div className="flex flex-col md:flex-row mt-4">
                    <div className="md:w-1/4">
                      <p className="text-gray-300 font-medium">Professional Bio</p>
                    </div>
                    <div className="md:w-3/4">
                      <p className="text-white whitespace-pre-line">{profileData.bio}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {Object.keys(entriesByType).length > 0 ? (
              Object.entries(entriesByType).map(([type, entries]) => (
                <div key={type} className="mb-8 last:mb-0">
                  <h3 className="text-lg font-semibold text-white pb-2 border-b border-gray-700 mb-4">
                    {getEntryTypeDisplayName(type)}
                  </h3>

                  <div className="space-y-6">
                    {entries.map((entry: DraftResumeEntry, index: number) => (
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

                          {/* Attachments section */}
                          {entry.attachments && entry.attachments.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {entry.attachments.map((attachment, attIndex) => (
                                <a
                                  key={attIndex}
                                  href={attachment.data}
                                  target="_blank"
                                  rel="noopener noreferrer"
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
                                  {attachment.name || `Attachment ${attIndex + 1}`}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-8">You have not requested verification for any of your resume entries yet.</p>
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
          <h2 className="text-2xl font-bold text-white mb-6">Saving Your Resume</h2>
          
          {isUploadingAttachments && (
            <div className="mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-400"></div>
              </div>
              <p className="text-gray-300 mb-2">Uploading attachments to IPFS...</p>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {isMinting && (
            <div className="mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-400"></div>
              </div>
              <p className="text-gray-300 mb-2">Minting your resume NFT...</p>
              <p className="text-sm text-gray-400">This may take a few moments. Please do not close this window.</p>
            </div>
          )}

          {error && (
            <div className="bg-red-900/50 border border-red-700 p-4 rounded-md mb-6 text-red-200">
              <p>{error}</p>
            </div>
          )}

          <div className="flex justify-center space-x-4">
            <button
              onClick={() => {
                setCurrentStep('edit');
                setIsUploadingAttachments(false);
                setIsMinting(false);
                setUploadProgress(0);
              }}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'success') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
          <div className="mb-6">
            <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">{successMessage}</h2>
          {transactionHash && (
            <div className="mb-6">
              <p className="text-gray-300 mb-2">Transaction Hash:</p>
              <a
                href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 break-all"
              >
                {transactionHash}
              </a>
            </div>
          )}
          <div className="flex justify-center gap-4">
            <Link
              href="/dashboard"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}

// The default export is now a wrapper that uses Suspense
export default function CreateResumePage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto p-6 text-white text-center">Loading page...</div>}>
      <CreateResumeFormContent />
    </Suspense>
  );
} 