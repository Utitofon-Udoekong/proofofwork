'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useFormAutoSave } from '@/app/lib/hooks/useAutoSave';
import { useResumeDraftStore, ResumeDraftEntryType, ResumeDraftsState } from '@/app/lib/stores/resumeDraftStore';
import { EntryType, EntryTypeEnum } from '@/app/lib/types';
import { useWeb3 } from '@/app/providers/Web3Provider';
import FileUploader from '../ui/FileUploader';

interface ResumeEntryFormProps {
  draftId: string;
  entryIndex?: number; // If provided, edit existing entry, otherwise create new
  onComplete?: (saved: boolean) => void;
  className?: string;
}

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

// Initial form state
const createEmptyEntry = (): ResumeDraftEntryType => ({
  type: entryTypeToString(EntryTypeEnum.EDUCATION),
  title: '',
  company: '',
  description: '',
  startDate: '',
  endDate: '',
  organization: '',
});

export default function ResumeEntryForm({
  draftId,
  entryIndex,
  onComplete,
  className = '',
}: ResumeEntryFormProps) {
  const isEditMode = entryIndex !== undefined;

  // Get direct access to store actions without subscriptions
  const addEntry = useResumeDraftStore(state => state.addEntry);
  const updateEntry = useResumeDraftStore(state => state.updateEntry);
  const setActiveEntry = useResumeDraftStore(state => state.setActiveEntry);
  
  // Get the draft with useMemo to avoid re-renders
  const draft = useMemo(() => {
    const drafts = useResumeDraftStore.getState().drafts;
    return drafts[draftId];
  }, [draftId]);
  
  // Subscribe to draft changes only
  useEffect(() => {
    const updateDraft = () => {
      const drafts = useResumeDraftStore.getState().drafts;
      const currentDraft = drafts[draftId];
      if (JSON.stringify(currentDraft) !== JSON.stringify(draft)) {
        // Force re-render only if draft changed
        forceUpdate({});
      }
    };
    
    const unsubscribe = useResumeDraftStore.subscribe(updateDraft);
    return unsubscribe;
  }, [draftId, draft]);
  
  // Force update helper
  const [, forceUpdate] = useState({});

  // Web3 context for submitting to the blockchain
  const { addResumeEntry, isLoading: isBlockchainSubmitting } = useWeb3();

  // Form state
  const [formData, setFormData] = useState<ResumeDraftEntryType>(createEmptyEntry());
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [attachments, setAttachments] = useState<{ ipfsUri: string; httpUrl: string; name: string; type: string }[]>([]);

  // Create memoized callbacks to prevent dependency changes
  const memoizedSetActiveEntry = useCallback((draftId: string, index: number | null) => {
    setActiveEntry(draftId, index);
  }, [setActiveEntry]);

  // Initialize form data from draft if editing - with stable dependencies
  useEffect(() => {
    if (!draft) return;

    if (isEditMode && entryIndex !== undefined && draft.entries[entryIndex]) {
      setFormData(draft.entries[entryIndex]);
      memoizedSetActiveEntry(draftId, entryIndex);
    } else {
      setFormData(createEmptyEntry());
      memoizedSetActiveEntry(draftId, null);
    }
  }, [draftId, entryIndex, draft, isEditMode, memoizedSetActiveEntry]);

  // Auto-save functionality
  const { markAsSaved } = useFormAutoSave(
    formData,
    (data) => {
      setIsSaving(true);
      
      try {
        if (isEditMode) {
          updateEntry(draftId, entryIndex, data);
        } else {
          addEntry(draftId, data);
        }
        
        setLastSaved(new Date());
        setIsDirty(false);
      } finally {
        setIsSaving(false);
      }
    },
    { delay: 2000 }
  );

  // Form change handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };

  // Handle draft submission
  const handleSubmitToDraft = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (isEditMode) {
        updateEntry(draftId, entryIndex, formData);
      } else {
        addEntry(draftId, formData);
      }
      
      setLastSaved(new Date());
      setIsDirty(false);
      markAsSaved();
      
      if (onComplete) {
        onComplete(true);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Handle blockchain submission
  const handleSubmitToBlockchain = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Make sure draft is saved first
      await handleSubmitToDraft(e);
      
      // Submit to blockchain
      await addResumeEntry({
        ...formData,
        // Ensure dates are in the correct format
        startDate: formData.startDate || new Date().toISOString().split('T')[0],
        endDate: formData.endDate || ''
      });
      
      if (onComplete) {
        onComplete(true);
      }
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
    
    // Add file reference to form data
    setFormData(prev => ({
      ...prev,
      attachments: [...(prev.attachments || []), ipfsUri]
    }));
    
    setIsDirty(true);
  };

  return (
    <form className={`space-y-6 ${className}`}>
      <div className="space-y-4">
        {/* Entry Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
            Entry Type
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder={
              stringToEntryType(formData.type) === EntryTypeEnum.EDUCATION
                ? "Degree or Certificate"
                : stringToEntryType(formData.type) === EntryTypeEnum.WORK
                ? "Job Title"
                : stringToEntryType(formData.type) === EntryTypeEnum.CERTIFICATION
                ? "Certification Name"
                : stringToEntryType(formData.type) === EntryTypeEnum.SKILL
                ? "Skill Name"
                : "Project Title"
            }
          />
        </div>

        {/* Company / Institution */}
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700">
            {stringToEntryType(formData.type) === EntryTypeEnum.EDUCATION
              ? "Institution"
              : stringToEntryType(formData.type) === EntryTypeEnum.WORK
              ? "Company"
              : stringToEntryType(formData.type) === EntryTypeEnum.CERTIFICATION
              ? "Issuing Organization"
              : stringToEntryType(formData.type) === EntryTypeEnum.PROJECT
              ? "Organization"
              : "Company"}
          </label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Leave empty for current positions"
            />
          </div>
        </div>

        {/* Verification Organization */}
        <div>
          <label htmlFor="organization" className="block text-sm font-medium text-gray-700">
            Verification Organization (Optional)
          </label>
          <input
            type="text"
            id="organization"
            name="organization"
            value={formData.organization}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Organization that can verify this entry"
          />
        </div>

        {/* File Attachments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attachments
          </label>
          <FileUploader
            onFileUploaded={handleFileUploaded}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            buttonText="Upload Document"
          />
          
          {attachments.length > 0 && (
            <ul className="mt-2 divide-y divide-gray-200">
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
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {attachment.name}
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachments(prev => prev.filter((attachment: { ipfsUri: string; httpUrl: string; name: string; type: string }, i: number) => i !== index));
                      setFormData(prev => ({
                        ...prev,
                        attachments: (prev.attachments || []).filter((attachment: string, i: number) => i !== index)
                      }));
                      setIsDirty(true);
                    }}
                    className="text-red-500 hover:text-red-700"
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

      {/* Save status */}
      <div className="flex items-center text-sm text-gray-500 justify-between">
        <div>
          {isSaving ? (
            <span>Saving...</span>
          ) : isDirty ? (
            <span>Unsaved changes</span>
          ) : lastSaved ? (
            <span>
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          ) : null}
        </div>
        
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={handleSubmitToDraft}
            disabled={isSaving || isBlockchainSubmitting}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            Save Draft
          </button>
          
          <button
            type="button"
            onClick={handleSubmitToBlockchain}
            disabled={isSaving || isBlockchainSubmitting}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {isBlockchainSubmitting ? 'Submitting...' : 'Submit to Blockchain'}
          </button>
        </div>
      </div>
    </form>
  );
} 