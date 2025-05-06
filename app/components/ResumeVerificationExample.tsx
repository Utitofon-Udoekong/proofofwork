"use client";

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
  ResumeNFT, 
  ResumeNFT__factory,
  ContractStructs
} from '../lib/contracts/contract-types';
import { contractAddresses } from '../lib/contracts/addresses';

// Example component showing direct interaction with typed contracts
export default function ResumeVerificationExample() {
  const [resumeNFT, setResumeNFT] = useState<ResumeNFT | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [tokenId, setTokenId] = useState<bigint | null>(null);
  const [entries, setEntries] = useState<ContractStructs.ResumeEntryStructOutput[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        if (typeof window !== 'undefined' && window.ethereum) {
          // Initialize provider and signer
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const userAddress = await signer.getAddress();
          setAccount(userAddress);

          // Initialize the typed contract using the factory
          const resumeNFTAddress = contractAddresses.resumeNFT || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
          const contract = ResumeNFT__factory.connect(resumeNFTAddress, signer);
          setResumeNFT(contract);

          // Get user's token IDs
          const tokenIds = await contract.getEntriesByOwner(userAddress);
          if (tokenIds && tokenIds.length > 0) {
            const firstTokenId = tokenIds[0];
            setTokenId(firstTokenId);

            // Get resume entries using the typed contract
            const resumeEntries = await contract.getResumeEntries(firstTokenId);
            setEntries(resumeEntries);
          }
        }
      } catch (err) {
        console.error("Error initializing:", err);
        setError("Failed to initialize. Please make sure you have a compatible wallet installed.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const handleRequestVerification = async (entryIndex: number) => {
    if (!resumeNFT || !tokenId) return;
    
    try {
      setLoading(true);
      // Use the typed contract method with the correct types
      const tx = await resumeNFT.requestVerification(tokenId, BigInt(entryIndex));
      await tx.wait();
      
      // Refresh entries after requesting verification
      const updatedEntries = await resumeNFT.getResumeEntries(tokenId);
      setEntries(updatedEntries);
      
      alert("Verification request sent successfully!");
    } catch (err) {
      console.error("Error requesting verification:", err);
      setError("Failed to request verification. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!account) {
    return <div className="p-4">Please connect your wallet to continue.</div>;
  }

  if (!tokenId) {
    return <div className="p-4">No resume found for this account.</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Resume Entries</h2>
      <p className="mb-4">Token ID: {tokenId.toString()}</p>
      
      {entries.length === 0 ? (
        <p>No entries found in your resume.</p>
      ) : (
        <div className="space-y-4">
          {entries.map((entry, index) => (
            <div key={index} className="border p-4 rounded">
              <h3 className="text-xl font-semibold">{entry.title}</h3>
              <p><strong>Organization:</strong> {entry.organization}</p>
              <p><strong>Description:</strong> {entry.description}</p>
              <p>
                <strong>Date:</strong> {new Date(Number(entry.startDate) * 1000).toLocaleDateString()} - 
                {Number(entry.endDate) > 0 
                  ? new Date(Number(entry.endDate) * 1000).toLocaleDateString() 
                  : 'Present'}
              </p>
              <p><strong>Verification Status:</strong> {entry.verified ? 'Verified' : 'Not Verified'}</p>
              
              {!entry.verified && (
                <button
                  onClick={() => handleRequestVerification(index)}
                  className="mt-2 bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded"
                >
                  Request Verification
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 