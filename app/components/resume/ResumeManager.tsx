'use client';

import { useState } from 'react';
import { useWeb3 } from '@/app/providers/Web3Provider';

export default function ResumeManager() {
  const { 
    tokenId, 
    tokenIds, 
    resumeNames,
    createNewResume, 
    selectResume,
    updateResumeName,
    isLoading 
  } = useWeb3();
  
  const [isCreating, setIsCreating] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [newResumeName, setNewResumeName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  
  const handleCreateClick = () => {
    setShowNamePrompt(true);
    setNewResumeName('');
  };
  
  const handleCreateResume = async () => {
    try {
      setIsCreating(true);
      const name = newResumeName.trim() || `Resume #${tokenIds.length + 1}`;
      await createNewResume(name);
      setShowNamePrompt(false);
    } catch (error) {
      console.error("Error creating new resume:", error);
    } finally {
      setIsCreating(false);
    }
  };
  
  const startEditing = (id: bigint) => {
    const idStr = id.toString();
    setEditingId(idStr);
    setEditName(resumeNames[idStr]?.name || `Resume #${idStr}`);
  };
  
  const saveResumeName = async (id: bigint) => {
    if (editName.trim()) {
      try {
        await updateResumeName(id, editName.trim());
      } catch (error) {
        console.error("Error updating resume name:", error);
      }
    }
    setEditingId(null);
  };
  
  const getResumeName = (id: bigint): string => {
    const idStr = id.toString();
    return resumeNames[idStr]?.name || `Resume #${idStr}`;
  };
  
  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-4 mb-6 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">My Resumes</h2>
        <button
          onClick={handleCreateClick}
          disabled={isCreating || isLoading}
          className={`px-3 py-1 text-sm rounded-md text-white ${
            isCreating || isLoading
              ? "bg-blue-500"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isCreating ? "Creating..." : "Create New Resume"}
        </button>
      </div>
      
      {showNamePrompt && (
        <div className="mb-4 p-3 border border-gray-600 rounded-md bg-gray-700">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Resume Name
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newResumeName}
              onChange={(e) => setNewResumeName(e.target.value)}
              placeholder="Professional Resume"
              className="flex-1 px-3 py-1 text-sm border border-gray-600 bg-gray-800 text-gray-300 rounded-md"
            />
            <button
              onClick={handleCreateResume}
              disabled={isCreating}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create
            </button>
            <button
              onClick={() => setShowNamePrompt(false)}
              className="px-3 py-1 text-sm bg-gray-600 text-gray-200 rounded-md hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {tokenIds.length === 0 ? (
        <p className="text-gray-400 text-sm">You don't have any resumes yet. Create your first one!</p>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-400 mb-2">Select a resume to view and edit:</p>
          <div className="space-y-2">
            {tokenIds.map((id) => (
              <div 
                key={String(id)}
                className={`p-2 border rounded-md transition-colors ${
                  tokenId === id
                    ? "bg-blue-900/30 border-blue-600"
                    : "border-gray-600 hover:bg-gray-700"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {editingId === id.toString() ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="px-2 py-1 text-sm border border-gray-600 bg-gray-800 text-gray-300 rounded"
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium text-white">
                        {getResumeName(id)}
                      </span>
                    )}
                    
                    {tokenId === id && (
                      <span className="text-xs bg-blue-900/60 text-blue-300 px-1.5 py-0.5 rounded-full border border-blue-700">
                        Active
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {editingId === id.toString() ? (
                      <>
                        <button
                          onClick={() => saveResumeName(id)}
                          className="text-xs px-2 py-1 bg-blue-600 text-white rounded"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs px-2 py-1 bg-gray-600 text-gray-200 rounded"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {tokenId !== id && (
                          <button
                            onClick={() => selectResume(id)}
                            className="text-xs px-2 py-1 bg-blue-600 text-white rounded"
                          >
                            Select
                          </button>
                        )}
                        <button
                          onClick={() => startEditing(id)}
                          className="text-xs px-2 py-1 bg-gray-600 text-gray-200 rounded"
                        >
                          Rename
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  ID: {id.toString()} • Created: {new Date(resumeNames[id.toString()]?.createdAt || Date.now()).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 