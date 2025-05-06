"use client";

import { useState, useEffect } from "react";
import { UserButton } from "@civic/auth-web3/react";
import { useWeb3 } from "@/app/providers/Web3Provider";

export default function ProfilePage() {
  // Use our combined Web3Provider
  const { 
    userAuthenticated, 
    walletConnected, 
    address, 
    balance, 
    connectWallet, 
    createWallet,
    getResumeEntries
  } = useWeb3();
  
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [profileVisible, setProfileVisible] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Resume stats
  const [stats, setStats] = useState({
    totalEntries: 0,
    verifiedEntries: 0, 
    pendingVerifications: 0,
    profileViews: 0
  });

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      if (userAuthenticated) {
        // In a real implementation, fetch this from a backend or IPFS
        // For now, use mock data
        setName("John Doe");
        setEmail("john.doe@example.com");
        setBio("Blockchain developer with 5+ years of experience in smart contract development and decentralized applications.");
        setSkills("Solidity, React, TypeScript, Ethereum, Web3.js");
        
        // Load stats from blockchain
        if (walletConnected) {
          try {
            const entries = await getResumeEntries();
            
            // Update stats based on entries
            setStats({
              totalEntries: entries.length,
              verifiedEntries: entries.filter(entry => entry.verified).length,
              pendingVerifications: entries.filter(entry => !entry.verified).length,
              profileViews: 27 // Mock data
            });
          } catch (error) {
            console.error("Error loading resume stats:", error);
          }
        }
      }
    };
    
    loadUserData();
  }, [userAuthenticated, walletConnected, getResumeEntries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      // Simulate API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, this would send data to backend/ipfs
      console.log("Profile saved:", {
        name,
        email,
        bio,
        skills,
        profileVisible,
        walletAddress: address
      });
      
      setSaveSuccess(true);
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
      
      {/* Show login button if user is not authenticated */}
      {!userAuthenticated ? (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <h2 className="text-2xl font-bold mb-4">Sign In</h2>
          <p className="text-gray-600 mb-6">
            Please sign in to view and manage your profile.
          </p>
          <UserButton />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Wallet Info */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <h2 className="text-xl font-semibold mb-4">Wallet Information</h2>
              
              {walletConnected ? (
                <>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">Connected Address</p>
                    <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all">
                      {address}
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">Balance</p>
                    <p className="text-sm font-medium">
                      {balance || "Loading..."}
                    </p>
                  </div>
                  
                  <div className="flex items-center mb-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <p className="text-sm text-gray-700">Connected with Civic Auth</p>
                  </div>
                  
                  <div className="text-sm text-green-600 font-medium">Wallet connected ✓</div>
                </>
              ) : (
                <div>
                  <p className="text-sm text-gray-700 mb-4">
                    You don't have a wallet yet. Create one to start using the platform.
                  </p>
                  <button
                    onClick={() => createWallet()}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create Wallet
                  </button>
                </div>
              )}
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Resume Stats</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Entries</span>
                  <span className="font-medium">{stats.totalEntries}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Verified Entries</span>
                  <span className="font-medium">{stats.verifiedEntries}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending Verifications</span>
                  <span className="font-medium">{stats.pendingVerifications}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Profile Views</span>
                  <span className="font-medium">{stats.profileViews}</span>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-md font-medium mb-3">Public Resume Link</h3>
                <div className="flex items-center">
                  <input
                    type="text"
                    readOnly
                    value={address ? `proof-of-work.xyz/resume/${address.slice(0, 10)}...` : "Connect wallet first"}
                    className="flex-1 text-sm bg-gray-100 p-2 rounded-l"
                  />
                  <button
                    onClick={() => {
                      if (address) {
                        navigator.clipboard.writeText(`https://proof-of-work.xyz/resume/${address}`);
                        alert("Link copied to clipboard!");
                      }
                    }}
                    disabled={!address}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-r disabled:bg-gray-400"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                      <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-6">Profile Details</h2>
              
              {saveSuccess && (
                <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                  <span className="block sm:inline">Profile saved successfully!</span>
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                    Professional Bio
                  </label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Write a brief professional bio"
                  ></textarea>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-1">
                    Skills (comma separated)
                  </label>
                  <input
                    type="text"
                    id="skills"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. Solidity, React, JavaScript"
                  />
                </div>
                
                <div className="mb-6">
                  <div className="flex items-center">
                    <input
                      id="profileVisible"
                      type="checkbox"
                      checked={profileVisible}
                      onChange={(e) => setProfileVisible(e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="profileVisible" className="ml-2 block text-sm text-gray-700">
                      Make my profile publicly visible
                    </label>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    When enabled, your profile will be visible to anyone with your public link.
                  </p>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving || !walletConnected}
                    className={`px-4 py-2 rounded-md text-white font-medium ${
                      isSaving || !walletConnected ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {isSaving ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 