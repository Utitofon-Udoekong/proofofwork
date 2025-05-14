"use client";

import Link from "next/link";
import { useWeb3 } from "@/app/providers/Web3Provider";
import DraftsList from "@/app/components/resume/DraftsList";
import { useRouter } from "next/navigation";
import { useSortedDrafts } from "@/app/lib/stores/resumeDraftStore";
import ResumeList from '@/app/components/ResumeList';
import { useResumes } from '@/app/hooks/useResumes';
import { parseError } from '@/app/lib/parseError';

export default function DashboardPage() {
  const router = useRouter();
  const drafts = useSortedDrafts();
  const hasDrafts = drafts.length > 0;
  const { 
    walletConnected, 
    isLoading,
  } = useWeb3();

  // Use the new hook for resumes
  const { data: resumes = [], isLoading: loadingResumes, error } = useResumes();

  // Get all entries and filter them

  // Handler for selecting a draft
  const handleSelectDraft = (draftId: string) => {
    router.push(`/dashboard/resume/create?draftId=${draftId}`);
  };

  if (loadingResumes || isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-white">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
        <p className="mt-4 text-gray-300">Loading your resume...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{parseError(error)}</span>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Show a fallback UI when wallet is connected but no token ID is available
  if (walletConnected && resumes.length === 0) {
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
            You&apos;re connected to the blockchain, but you don&apos;t have any resume NFTs yet. 
            Let&apos;s create your first blockchain resume!
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
              If you&apos;re experiencing problems with the blockchain connection, try refreshing the page.
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
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
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

      {/* Resume List */}
      <div className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">Your Resumes</h2>
        <ResumeList 
          resumes={resumes}
          isLoading={loadingResumes || isLoading}
          error={error}
        />
            </div>
    </div>
  );
} 