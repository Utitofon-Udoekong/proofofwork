"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ResumeEntry, EntryType } from "@/app/lib/types";
import { ethers } from "ethers";
import { ResumeNFT__factory } from "@/app/lib/contracts/contract-types";
import { contractAddresses } from "@/app/lib/contracts/addresses";

// Helper function to convert uint8 from contract to EntryType string
const uint8ToEntryType = (typeValue: number): EntryType => {
  const typeMap: Record<number, EntryType> = {
    0: 'work',
    1: 'education',
    2: 'certification',
    3: 'project',
    4: 'skill',
    5: 'award'
  };
  return typeMap[typeValue] || 'work';
};

// Note: For the public resume page, we're not using the Web3Provider since this page
// needs to work for public (non-authenticated) users who need to view resumes of 
// specific addresses. Instead, we'll use a direct contract connection.

export default function PublicResumePage({ params }: { params: { address: string } }) {
  const { address } = params;
  
  const [resumeEntries, setResumeEntries] = useState<ResumeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState({
    name: "John Doe",
    bio: "Blockchain developer with experience in smart contract development and decentralized applications",
    skills: ["Solidity", "React", "TypeScript", "Ethereum", "Web3.js"],
  });

  useEffect(() => {
    const fetchPublicResume = async () => {
      try {
        setLoading(true);
        
        // Get the blockchain provider - using public provider for the public resume
        const provider = new ethers.JsonRpcProvider(
          process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8545"
        );
        
        const resumeNFTAddress = contractAddresses.resumeNFT || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
        const contractFactory = ResumeNFT__factory.connect(resumeNFTAddress, provider);
        
        // Get user's token IDs
        try {
          const tokenIds = await contractFactory.getEntriesByOwner(address);
          
          if (tokenIds && tokenIds.length > 0) {
            const firstTokenId = tokenIds[0];
            
            // Get resume entries
            const contractEntries = await contractFactory.getResumeEntries(firstTokenId);
            
            // Convert contract entries to our ResumeEntry format
            const entries: ResumeEntry[] = contractEntries.map((entry, index) => {
              // Convert the numeric entryType to string EntryType
              const type = uint8ToEntryType(Number(entry.entryType));
              
              // Parse the metadata JSON to extract additional fields
              let additionalFields = {};
              try {
                if (entry.metadata) {
                  additionalFields = JSON.parse(entry.metadata);
                }
              } catch (e) {
                console.error("Failed to parse metadata JSON:", e);
              }
              
              return {
                id: index,
                type,
                title: entry.title,
                company: entry.organization,
                description: entry.description,
                startDate: new Date(Number(entry.startDate) * 1000).toISOString().split('T')[0],
                endDate: Number(entry.endDate) > 0 
                  ? new Date(Number(entry.endDate) * 1000).toISOString().split('T')[0]
                  : 'Present',
                verified: entry.verified,
                organization: entry.organization,
                ...additionalFields
              };
            });
            
            setResumeEntries(entries);
            
            // In a real implementation, profile data would also be fetched from IPFS or a backend
            // Mock profile data used here
            setProfileData({
              name: "John Doe",
              bio: "Blockchain developer with experience in smart contract development and decentralized applications",
              skills: ["Solidity", "React", "TypeScript", "Ethereum", "Web3.js"],
            });
          } else {
            setError("No resume found for this address.");
          }
        } catch (error) {
          console.error("Error fetching user's tokens:", error);
          setError("Failed to load resume. This resume may not exist or the address is incorrect.");
        }
      } catch (error) {
        console.error("Error fetching public resume:", error);
        setError("Failed to load resume. This resume may not be public or the address is incorrect.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchPublicResume();
  }, [address]);

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    if (dateString === "Present") return "Present";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: 'numeric', month: 'short' });
  };

  // Helper function to get badge for verified entries
  const VerifiedBadge = ({ verified }: { verified: boolean }) => (
    verified ? (
      <span className="inline-flex items-center rounded px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
        <svg className="mr-1 h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        Verified
      </span>
    ) : (
      <span className="inline-flex items-center rounded px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800">
        Not Verified
      </span>
    )
  );

  // Helper function to get icon for entry type
  const getEntryTypeIcon = (type: EntryType) => {
    switch (type) {
      case 'work':
        return (
          <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'education':
        return (
          <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
          </svg>
        );
      case 'certification':
        return (
          <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
          </svg>
        );
      case 'project':
        return (
          <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'skill':
        return (
          <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
        );
      case 'award':
        return (
          <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
          </svg>
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
          </>
        );
      case 'project':
        return (
          <>
            {entry.projectUrl && (
              <a href={entry.projectUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm inline-flex items-center">
                View Project
                <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
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

  // Group entries by type for better organization
  const entriesByType = resumeEntries.reduce((acc, entry) => {
    if (!acc[entry.type]) {
      acc[entry.type] = [];
    }
    acc[entry.type].push(entry);
    return acc;
  }, {} as Record<string, ResumeEntry[]>);

  // Define the order we want to display entry types
  const entryTypeOrder: EntryType[] = ['work', 'education', 'certification', 'project', 'skill', 'award'];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading resume...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-3xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <div className="mt-8 text-center">
          <Link href="/" className="text-blue-600 hover:underline">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header with profile info */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start">
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4 md:mb-0 md:mr-6">
              {profileData.name.charAt(0)}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold">{profileData.name}</h1>
              <p className="text-gray-600 mt-2">{profileData.bio}</p>
              
              <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                {profileData.skills.map((skill, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold">Blockchain Verified</p>
                  <p className="text-xs text-gray-500">On-chain resume with verified credentials</p>
                </div>
              </div>
              
              <div className="flex items-center text-gray-500 text-sm">
                <span>Wallet Address: </span>
                <span className="ml-2 font-mono">{address.slice(0, 6)}...{address.slice(-4)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Resume Content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {entryTypeOrder.map(type => {
            const entries = entriesByType[type];
            if (!entries || entries.length === 0) return null;
            
            return (
              <div key={type} className="mb-10 last:mb-0">
                <div className="flex items-center mb-6">
                  {getEntryTypeIcon(type)}
                  <h2 className="text-2xl font-bold ml-2">{getEntryTypeName(type)}</h2>
                </div>
                
                <div className="space-y-8">
                  {entries.map((entry, index) => (
                    <div key={index} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-semibold">{entry.title}</h3>
                          <p className="text-lg text-gray-700">{entry.company}</p>
                          {getEntryAdditionalInfo(entry)}
                        </div>
                        <div className="text-right">
                          <p className="text-gray-600">
                            {formatDate(entry.startDate)} - {formatDate(entry.endDate)}
                          </p>
                          <div className="mt-2">
                            <VerifiedBadge verified={entry.verified} />
                          </div>
                        </div>
                      </div>
                      
                      <p className="mt-3 text-gray-600">
                        {entry.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          
          {/* If no entries */}
          {Object.keys(entriesByType).length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-600">No resume entries found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 