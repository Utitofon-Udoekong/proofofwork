"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ResumeEntry, EntryType } from "@/app/lib/types";
import { Web3Service } from "@/app/lib/web3Service";

export default function DashboardPage() {
  const [resumeEntries, setResumeEntries] = useState<ResumeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [web3Service, setWeb3Service] = useState<Web3Service | null>(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [filteredType, setFilteredType] = useState<EntryType | 'all'>('all');

  useEffect(() => {
    const initializeWeb3 = async () => {
      const service = new Web3Service();
      const { isConnected } = await service.initialize();
      
      setWeb3Service(service);
      setIsWalletConnected(isConnected);
      
      if (isConnected) {
        await fetchResumeEntries(service);
      } else {
        setLoading(false);
      }
    };
    
    initializeWeb3();
  }, []);

  const fetchResumeEntries = async (service: Web3Service) => {
    try {
      setLoading(true);
      const entries = await service.getResumeEntries();
      setResumeEntries(entries);
    } catch (error) {
      console.error("Error fetching resume entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    if (web3Service) {
      try {
        const { isConnected } = await web3Service.connectWallet();
        setIsWalletConnected(isConnected);
        
        if (isConnected) {
          await fetchResumeEntries(web3Service);
        }
      } catch (error) {
        console.error("Failed to connect wallet:", error);
        alert("Failed to connect wallet. Please make sure you have MetaMask installed.");
        setLoading(false);
      }
    }
  };

  const handleRequestVerification = async (entryId: number | string) => {
    if (!web3Service) return;
    
    try {
      await web3Service.requestVerification(Number(entryId));
      alert("Verification requested successfully!");
      
      // Refresh entries
      await fetchResumeEntries(web3Service);
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

  // Helper function to get icon for entry type
  const getEntryTypeIcon = (type: EntryType) => {
    switch (type) {
      case 'work':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
            <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
          </svg>
        );
      case 'education':
        return (
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
          </svg>
        );
      case 'certification':
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
          </svg>
        );
      case 'project':
        return (
          <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'skill':
        return (
          <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
        );
      case 'award':
        return (
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
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
            {entry.role && <p className="text-gray-600">{entry.role}</p>}
            {entry.location && <p className="text-sm text-gray-500">Location: {entry.location}</p>}
          </>
        );
      case 'education':
        return (
          <>
            {entry.degree && <p className="text-gray-600">{entry.degree} in {entry.fieldOfStudy}</p>}
            {entry.grade && <p className="text-sm text-gray-500">Grade: {entry.grade}</p>}
          </>
        );
      case 'certification':
        return (
          <>
            {entry.issuedBy && <p className="text-gray-600">Issued by: {entry.issuedBy}</p>}
            {entry.credentialID && <p className="text-sm text-gray-500">ID: {entry.credentialID}</p>}
            {entry.expirationDate && <p className="text-sm text-gray-500">Expires: {entry.expirationDate}</p>}
          </>
        );
      case 'project':
        return (
          <>
            {entry.projectUrl && (
              <a href={entry.projectUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
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
                entry.proficiencyLevel === 'beginner' ? 'bg-blue-100 text-blue-800' :
                entry.proficiencyLevel === 'intermediate' ? 'bg-green-100 text-green-800' :
                entry.proficiencyLevel === 'advanced' ? 'bg-purple-100 text-purple-800' :
                'bg-red-100 text-red-800'
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading your resume...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Resume</h1>
        {isWalletConnected && (
          <Link 
            href="/dashboard/create-entry" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Add New Entry
          </Link>
        )}
      </div>

      {!isWalletConnected ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm border">
          <h2 className="text-xl font-medium mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">Connect your wallet to view and manage your on-chain resume.</p>
          <button 
            onClick={handleConnectWallet}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Connect Wallet
          </button>
        </div>
      ) : resumeEntries.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-medium mb-4">No resume entries yet</h2>
          <p className="text-gray-600 mb-6">Start building your on-chain resume by adding your first entry.</p>
          <Link 
            href="/dashboard/create-entry" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Create Your First Entry
          </Link>
        </div>
      ) : (
        <div>
          {/* Entry type filter */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilteredType('all')}
                className={`px-3 py-1 text-sm rounded-full ${
                  filteredType === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {(['work', 'education', 'certification', 'project', 'skill', 'award'] as EntryType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setFilteredType(type)}
                  className={`px-3 py-1 text-sm rounded-full flex items-center gap-1 ${
                    filteredType === type 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {getEntryTypeIcon(type)}
                  {getEntryTypeName(type)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Entry list */}
          <div className="grid gap-4">
            {filteredEntries.map((entry) => (
              <div key={entry.id} className="border rounded-lg p-4 shadow-sm bg-white">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getEntryTypeIcon(entry.type)}
                      <span className="text-xs font-medium text-gray-500 uppercase">{getEntryTypeName(entry.type)}</span>
                    </div>
                    <h3 className="text-xl font-bold">{entry.title}</h3>
                    <p className="text-gray-600">{entry.company}</p>
                    <p className="text-sm text-gray-500">
                      {entry.startDate} - {entry.endDate}
                    </p>
                    
                    {/* Additional info specific to entry type */}
                    <div className="mt-2">
                      {getEntryAdditionalInfo(entry)}
                    </div>
                    
                    {entry.description && (
                      <p className="mt-2 text-gray-700">{entry.description}</p>
                    )}
                  </div>
                  <div className="flex items-center">
                    {entry.verified ? (
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                        Verified
                      </span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path>
                        </svg>
                        Pending Verification
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Link 
                    href={`/dashboard/edit-entry/${entry.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </Link>
                  {!entry.verified && (
                    <button 
                      onClick={() => handleRequestVerification(entry.id)}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      Request Verification
                    </button>
                  )}
                  <button 
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                    onClick={() => handleDeleteEntry(entry.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 