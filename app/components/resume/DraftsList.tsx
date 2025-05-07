'use client';

import React, { useState } from 'react';
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

  // Handler for creating a new draft
  const handleCreateDraft = () => {
    const newDraftId = createDraft();
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

  if (drafts.length === 0) {
    return (
      <div className={`p-4 rounded-lg bg-gray-50 ${className}`}>
        <p className="text-gray-500 mb-4">You don't have any resume drafts yet.</p>
        <button
          onClick={handleCreateDraft}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Create New Draft
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Your Resume Drafts</h3>
        <button
          onClick={handleCreateDraft}
          className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          New Draft
        </button>
      </div>
      
      <ul className="divide-y divide-gray-200 bg-white rounded-lg shadow overflow-hidden">
        {drafts.map((draft) => (
          <li key={draft.id} className="hover:bg-gray-50">
            <div className="p-4 flex justify-between items-center">
              <button
                onClick={() => onSelectDraft(draft.id)}
                className="flex-1 flex items-start text-left"
              >
                <div>
                  <h4 className="font-medium text-gray-900">{draft.name}</h4>
                  <div className="flex mt-1 text-sm text-gray-500">
                    <span>
                      Last updated {formatDistanceToNow(new Date(draft.lastUpdated))} ago
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
                    ? 'bg-red-100 text-red-600'
                    : 'text-gray-400 hover:text-gray-500'
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
        ))}
      </ul>
    </div>
  );
} 