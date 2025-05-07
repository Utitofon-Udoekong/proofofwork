"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ResumeEntry, EntryType } from "@/app/lib/types";
import { useWeb3 } from "@/app/providers/Web3Provider";
import ResumeManager from "@/app/components/resume/ResumeManager";
import ResumePreview from "@/app/components/resume/ResumePreview";
import DraftsList from "@/app/components/resume/DraftsList";
import { useRouter } from "next/navigation";
import { useSortedDrafts } from "@/app/lib/stores/resumeDraftStore";

export default function DashboardPage() {
  const router = useRouter();
  const [resumeEntries, setResumeEntries] = useState<ResumeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredType, setFilteredType] = useState<EntryType | 'all'>('all');
  const drafts = useSortedDrafts();
  const hasDrafts = drafts.length > 0;
  const { 
    walletConnected, 
    connectWallet, 
    getResumeEntries, 
    requestVerification,
    isLoading,
    tokenId
  } = useWeb3();

  useEffect(() => {
    const fetchEntries = async () => {
      if (walletConnected) {
        try {
          setLoading(true);
          const entries = await getResumeEntries();
          setResumeEntries(entries);
        } catch (error) {
          console.error("Error fetching resume entries:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    
    fetchEntries();
  }, [walletConnected, getResumeEntries]);

  const handleRequestVerification = async (entryId: number | string) => {
    try {
      await requestVerification(Number(entryId));
      alert("Verification requested successfully!");
      
      // Refresh entries
      const entries = await getResumeEntries();
      setResumeEntries(entries);
    } catch (error) {
      console.error("Error requesting verification:", error);
      alert("Failed to request verification. Please try again.");
    }
  };

  const handleDeleteEntry = (entryId: number | string) => {
    // For now, we'll just remove it from the UI
    // In a full implementation, this would call a contract method
    if (confirm("Are you sure you want to delete this entry?")) {
      setResumeEntries(resumeEntries.filter(e => e.id !== entryId));
    }
  };

  // Handler for selecting a draft
  const handleSelectDraft = (draftId: string) => {
    router.push(`/dashboard/resume/create?draftId=${draftId}`);
  };

  // Helper function to get icon for entry type
  const getEntryTypeIcon = (type: EntryType) => {
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
  const getEntryAdditionalInfo = (entry: ResumeEntry) => {
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
  const getEntryTypeName = (type: EntryType) => {
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

  const filteredEntries = filteredType === 'all' 
    ? resumeEntries 
    : resumeEntries.filter(entry => entry.type === filteredType);

  if (loading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-white">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
        <p className="mt-4 text-gray-300">Loading your resume...</p>
      </div>
    );
  }

  // Show a fallback UI when wallet is connected but no token ID is available
  if (walletConnected && !tokenId) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Your Resume</h1>
          <Link 
            href="/dashboard/resume/create" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Create Resume
          </Link>
        </div>

        {/* Resume Drafts - Only show if there are drafts */}
        {hasDrafts && (
          <div className="bg-gray-800 rounded-lg shadow-md p-4 mb-6 border border-gray-700">
            <DraftsList onSelectDraft={handleSelectDraft} className="text-white" />
          </div>
        )}

        <div className="bg-gray-800 p-8 rounded-lg shadow-md border border-gray-700">
          <h1 className="text-2xl font-bold mb-4 text-white">Create Your First Resume</h1>
          <p className="text-gray-300 mb-6">
            You're connected to the blockchain, but you don't have any resume NFTs yet. 
            Let's create your first blockchain resume!
          </p>
          
          <Link 
            href="/dashboard/resume/create" 
            className="bg-blue-600 hover:bg-blue-700 text-white block text-center w-full py-3 rounded-lg font-medium"
          >
            Create Resume
          </Link>
          
          <div className="mt-8 p-4 bg-blue-900/30 rounded-lg text-sm text-blue-300 border border-blue-900/50">
            <p className="font-medium">Having connection issues?</p>
            <p className="mt-1">
              If you're experiencing problems with the blockchain connection, try refreshing the page.
              If problems persist, check that your network is correctly set to Sepolia testnet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Your Resume</h1>
        <Link 
          href="/dashboard/resume/create" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Create Resume
        </Link>
      </div>

      {/* Resume Drafts - Only show if there are drafts */}
      {hasDrafts && (
        <div className="bg-gray-800 rounded-lg shadow-md p-4 mb-6 border border-gray-700">
          <DraftsList onSelectDraft={handleSelectDraft} className="text-white" />
        </div>
      )}

      {!walletConnected ? (
        <div className="text-center py-16 bg-gray-800 rounded-lg shadow-md border border-gray-700">
          <h2 className="text-xl font-medium mb-4 text-white">Connect Your Wallet</h2>
          <p className="text-gray-300 mb-6">Connect your wallet to view and manage your on-chain resume.</p>
          <button 
            onClick={connectWallet}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-2">
              {/* Resume Manager Component */}
              <ResumeManager />
            </div>
            <div>
              {/* Resume Preview Component */}
              <ResumePreview />
            </div>
          </div>

          {!tokenId ? (
            <div className="text-center py-16 bg-gray-800 rounded-lg border border-gray-700">
              <h2 className="text-xl font-medium mb-4 text-white">No resume selected</h2>
              <p className="text-gray-300 mb-6">
                Create a new resume or select an existing one to get started.
              </p>
            </div>
          ) : resumeEntries.length === 0 ? (
            <div className="text-center py-16 bg-gray-800 rounded-lg border border-gray-700">
              <h2 className="text-xl font-medium mb-4 text-white">No resume entries yet</h2>
              <p className="text-gray-300 mb-6">Start building your on-chain resume by adding your first entry.</p>
              <Link 
                href="/dashboard/resume/create" 
                className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Your First Entry
              </Link>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Your Entries</h2>
                <div className="flex items-center space-x-2">
                  <label htmlFor="filterType" className="text-sm text-gray-300">Filter:</label>
                  <select
                    id="filterType"
                    value={filteredType}
                    onChange={(e) => setFilteredType(e.target.value as EntryType | 'all')}
                    className="bg-gray-700 border border-gray-600 text-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="all">All Entries</option>
                    <option value="work">Work</option>
                    <option value="education">Education</option>
                    <option value="certification">Certification</option>
                    <option value="project">Project</option>
                    <option value="skill">Skill</option>
                    <option value="award">Award</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
                      <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-3/4 mb-4"></div>
                      <div className="flex space-x-2">
                        <div className="h-8 bg-gray-700 rounded w-20"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredEntries.map((entry, index) => (
                    <div key={index} className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 relative">
                      {entry.verified && (
                        <div className="absolute top-2 right-2 bg-green-900/60 text-green-300 text-xs px-2 py-1 rounded-full border border-green-700">
                          Verified ✓
                        </div>
                      )}
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-white">{entry.title}</h3>
                        <p className="text-gray-300">{entry.company}</p>
                        <p className="text-sm text-gray-400">{entry.startDate} - {entry.endDate}</p>
                      </div>
                      <p className="text-sm mb-4 text-gray-300">{entry.description}</p>
                      
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="bg-blue-900/40 text-blue-300 px-2 py-1 rounded border border-blue-800/50">
                          {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                        </span>
                        {!entry.verified && !entry.verificationRequested && (
                          <button
                            onClick={() => handleRequestVerification(index)}
                            className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                          >
                            Request Verification
                          </button>
                        )}
                        {!entry.verified && entry.verificationRequested && (
                          <span className="bg-yellow-900/40 text-yellow-300 px-2 py-1 rounded border border-yellow-800/50">
                            Verification Requested
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
} 