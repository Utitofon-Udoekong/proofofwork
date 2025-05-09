'use client';

import React, { useState, useEffect } from 'react';
import { useSortedDrafts, useResumeDraftStore } from '@/app/lib/stores/resumeDraftStore';
import { formatDistanceToNow } from 'date-fns';

interface DraftsListProps {
  onSelectDraft: (draftId: string) => void;
  className?: string;
}

export default function DraftsList({ onSelectDraft, className = '' }: DraftsListProps) {
  const drafts = useSortedDrafts();
  const { createDraft, deleteDraft } = useResumeDraftStore();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // For debugging - check localStorage directly
  useEffect(() => {
    try {
      const localStorageDrafts = localStorage.getItem('pow-resume-drafts');
      if (localStorageDrafts) {
        const parsed = JSON.parse(localStorageDrafts);
        setDebugInfo(`Found ${Object.keys(parsed.state.drafts || {}).length} drafts in localStorage`);
      } else {
        setDebugInfo('No drafts found in localStorage');
      }
    } catch (err) {
      setDebugInfo(`Error reading localStorage: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, []);

  // Handler for creating a new draft
  const handleCreateDraft = () => {
    const newDraftId = createDraft(undefined, `Draft Resume ${new Date().toLocaleString()}`);
    onSelectDraft(newDraftId);
  };

  // Handler to delete a draft with confirmation
  const handleDeleteDraft = (draftId: string) => {
    if (isConfirmingDelete === draftId) {
      deleteDraft(draftId);
      setIsConfirmingDelete(null);
    } else {
      setIsConfirmingDelete(draftId);
      // Auto-clear confirmation state after 3 seconds
      setTimeout(() => setIsConfirmingDelete(null), 3000);
    }
  };

  // For debugging - force create a test draft
  const handleForceCreateTestDraft = () => {
    createDraft(undefined, `Test Draft ${new Date().toLocaleString()}`);
  };

  // Don't render anything if there are no drafts
  if (drafts.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">Your Resume Drafts</h3>
        <div className="flex gap-2">
          <button
            onClick={handleCreateDraft}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            New Draft
          </button>
          <button
            onClick={handleForceCreateTestDraft}
            className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            Create Test
          </button>
        </div>
      </div>
      
      <p className="text-xs text-gray-400">Debug: {debugInfo}</p>
      
      <ul className="divide-y divide-gray-700 bg-gray-700 rounded-lg overflow-hidden">
        {drafts.map((draft) => {
          // Defensive: check for valid updatedAt (not lastUpdated)
          const updatedAt = draft.updatedAt ? new Date(draft.updatedAt) : null;
          const timeAgo = updatedAt && !isNaN(updatedAt.getTime())
            ? formatDistanceToNow(updatedAt)
            : 'Unknown';
          return (
            <li key={draft.id} className="hover:bg-gray-600">
              <div className="p-4 flex justify-between items-center">
                <button
                  onClick={() => onSelectDraft(draft.id)}
                  className="flex-1 flex items-start text-left"
                >
                  <div>
                    <h4 className="font-medium text-white">
                      {draft.name?.trim() ? draft.name : `Untitled Draft (${draft.id})`}
                    </h4>
                    <div className="flex mt-1 text-sm text-gray-300">
                      <span>
                        Last updated {timeAgo} ago
                      </span>
                      <span className="mx-2">•</span>
                      <span>{draft.entries.length} entries</span>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleDeleteDraft(draft.id)}
                  className={`ml-4 p-1.5 rounded-md ${
                    isConfirmingDelete === draft.id
                      ? 'bg-red-900/50 text-red-300'
                      : 'text-gray-300 hover:text-gray-100'
                  }`}
                >
                  {isConfirmingDelete === draft.id ? (
                    <span className="text-xs font-medium px-1">Confirm</span>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
} 