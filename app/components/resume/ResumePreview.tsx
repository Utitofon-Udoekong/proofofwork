'use client';

import { useState, useEffect } from 'react';
import { useResumeDraftStore, DraftResumeEntry } from '@/app/lib/stores/resumeDraftStore';

export default function ResumePreview() {
  const { drafts, currentDraftId } = useResumeDraftStore();
  const [entries, setEntries] = useState<DraftResumeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (currentDraftId && drafts[currentDraftId]) {
      setEntries(drafts[currentDraftId].entries || []);
      setLoading(false);
    } else {
      setEntries([]);
      setLoading(false);
    }
  }, [currentDraftId, drafts]);
  
  // Get the name of the currently selected draft
  const getDraftName = (): string => {
    if (!currentDraftId) return 'No Draft Selected';
    return drafts[currentDraftId]?.profile?.name || `Draft #${currentDraftId.slice(0, 6)}`;
  };
  
  const getEntryTypeIcon = (type: string) => {
    switch (type) {
      case 'work': return '💼';
      case 'education': return '🎓';
      case 'certification': return '📜';
      case 'project': return '📂';
      case 'skill': return '🛠️';
      case 'award': return '🏆';
      default: return '📝';
    }
  };
  
  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-md p-4 animate-pulse border border-gray-700">
        <div className="h-5 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-3 bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-700 rounded"></div>
          <div className="h-3 bg-gray-700 rounded w-5/6"></div>
        </div>
      </div>
    );
  }
  
  if (!currentDraftId) {
    return null;
  }
  
  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-4 mb-6 border border-gray-700">
      <h2 className="text-lg font-semibold mb-3 text-white">{getDraftName()}</h2>
      
      {entries.length === 0 ? (
        <p className="text-sm text-gray-400">No entries in this draft yet</p>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">{entries.length} entries total</p>
          
          <div className="max-h-60 overflow-y-auto space-y-2">
            {entries.map((entry, index) => (
              <div key={index} className="text-sm border-l-2 pl-3 py-1 border-gray-600">
                <div className="flex items-center gap-1">
                  <span>{getEntryTypeIcon(entry.type)}</span>
                  <span className="font-medium text-white">{entry.title}</span>
                </div>
                <div className="text-gray-300">{entry.company}</div>
                <div className="text-xs text-gray-400">{entry.startDate} - {entry.endDate}</div>
                
                {/* Attachments section */}
                {entry.attachments && entry.attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 