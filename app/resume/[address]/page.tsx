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
      <div className="min-h-screen bg-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading resume...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white py-12">
        <div className="container mx-auto px-4 py-16 max-w-3xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
          <div className="mt-8 text-center">
            <Link href="/" className="text-blue-600 hover:underline">
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0">
              <h1 className="text-3xl md:text-4xl font-bold">{profileData.name}</h1>
              <p className="mt-2 max-w-xl">{profileData.bio}</p>
              
              <div className="mt-4 flex flex-wrap gap-2">
                {profileData.skills.map((skill, index) => (
                  <span key={index} className="px-2 py-1 bg-white/20 text-white text-sm rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col items-end">
              <div className="bg-white/20 backdrop-blur-sm px-4 py-3 rounded-lg inline-flex items-center">
                <span className="text-sm font-mono mr-2 truncate max-w-[120px] md:max-w-full">
                  {address.substring(0, 6)}...{address.substring(address.length - 4)}
                </span>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
              
              <div className="mt-4 text-sm">
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full inline-flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                  Blockchain Verified Resume
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Resume Content */}
        {entryTypeOrder.map(type => {
          const entries = entriesByType[type];
          if (!entries || entries.length === 0) return null;
          
          return (
            <div key={type} className="mb-12 last:mb-0">
              <h2 className="text-2xl font-bold text-gray-800 pb-2 border-b border-gray-200 mb-6">
                {type === 'work' ? 'Work Experience' : 
                 type === 'education' ? 'Education' :
                 type === 'certification' ? 'Certifications' :
                 type === 'project' ? 'Projects' :
                 type === 'skill' ? 'Skills' : 
                 type === 'award' ? 'Awards & Honors' : type}
              </h2>
              
              <div className="space-y-8">
                {entries.map((entry, index) => (
                  <div key={index} className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/4">
                      <div className="text-gray-700 font-medium">
                        {formatDate(entry.startDate)} - {formatDate(entry.endDate)}
                      </div>
                      
                      {entry.verified && (
                        <div className="mt-2 inline-flex items-center text-sm text-green-600 font-medium">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Verified
                        </div>
                      )}
                    </div>
                    
                    <div className="md:w-3/4">
                      <h3 className="text-xl font-semibold text-gray-800">{entry.title}</h3>
                      <div className="text-gray-700 font-medium mt-1">{entry.company}</div>
                      
                      {/* Type-specific fields */}
                      {type === 'work' && entry.role && (
                        <div className="text-gray-600 mt-1">{entry.role}</div>
                      )}
                      
                      {type === 'education' && entry.degree && (
                        <div className="text-gray-600 mt-1">
                          {entry.degree} {entry.fieldOfStudy && `in ${entry.fieldOfStudy}`}
                          {entry.grade && ` · GPA: ${entry.grade}`}
                        </div>
                      )}
                      
                      {type === 'certification' && entry.issuedBy && (
                        <div className="text-gray-600 mt-1">
                          Issued by: {entry.issuedBy}
                          {entry.credentialID && ` · ID: ${entry.credentialID}`}
                        </div>
                      )}
                      
                      {type === 'project' && entry.projectUrl && (
                        <div className="mt-1">
                          <a 
                            href={entry.projectUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline inline-flex items-center text-sm"
                          >
                            View Project
                            <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                            </svg>
                          </a>
                        </div>
                      )}
                      
                      <div className="mt-2 text-gray-600">{entry.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        
        {/* If no entries */}
        {Object.keys(entriesByType).length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No resume entries found</p>
          </div>
        )}
        
        <div className="mt-12 pt-6 border-t border-gray-200 text-center">
          <p className="text-gray-500 text-sm">
            This resume is verified on the blockchain using ProofOfWork's soulbound NFT verification system.
          </p>
          <Link 
            href="/"
            className="inline-block mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
          >
            Create Your Own On-Chain Resume
          </Link>
        </div>
      </div>
    </div>
  );
} 