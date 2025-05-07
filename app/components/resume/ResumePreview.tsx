'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '@/app/providers/Web3Provider';
import { ResumeEntry } from '@/app/lib/types';

export default function ResumePreview() {
  const { tokenId, getResumeEntries, resumeNames } = useWeb3();
  const [entries, setEntries] = useState<ResumeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchEntries = async () => {
      if (tokenId) {
        setLoading(true);
        try {
          const result = await getResumeEntries();
          setEntries(result);
        } catch (error) {
          console.error("Error fetching resume entries:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setEntries([]);
        setLoading(false);
      }
    };
    
    fetchEntries();
  }, [tokenId, getResumeEntries]);
  
  // Get the name of the currently selected resume
  const getResumeName = (): string => {
    if (!tokenId) return 'No Resume Selected';
    const idStr = tokenId.toString();
    return resumeNames[idStr]?.name || `Resume #${idStr}`;
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
  
  if (!tokenId) {
    return null;
  }
  
  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-4 mb-6 border border-gray-700">
      <h2 className="text-lg font-semibold mb-3 text-white">{getResumeName()}</h2>
      
      {entries.length === 0 ? (
        <p className="text-sm text-gray-400">No entries in this resume yet</p>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">{entries.length} entries total • {entries.filter(e => e.verified).length} verified</p>
          
          <div className="max-h-60 overflow-y-auto space-y-2">
            {entries.map((entry, index) => (
              <div key={index} className="text-sm border-l-2 pl-3 py-1 border-gray-600">
                <div className="flex items-center gap-1">
                  <span>{getEntryTypeIcon(entry.type)}</span>
                  <span className="font-medium text-white">{entry.title}</span>
                  {entry.verified && <span className="ml-1 text-xs bg-green-900/60 text-green-300 px-1 py-0.5 rounded-full border border-green-700">✓</span>}
                </div>
                <div className="text-gray-300">{entry.company}</div>
                <div className="text-xs text-gray-400">{entry.startDate} - {entry.endDate}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 