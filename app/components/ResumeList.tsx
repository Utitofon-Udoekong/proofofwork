'use client';

import Link from 'next/link';
import { ResumeMetadata } from '@/app/lib/types';

interface ResumeListProps {
  resumes: ResumeMetadata[];
  isLoading?: boolean;
  error?: string | null;
}

export default function ResumeList({ resumes, isLoading, error }: ResumeListProps) {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-400"></div>
        <p className="mt-4 text-gray-300">Loading resumes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-900/50 rounded-lg p-4 text-red-300">
        Error: {error}
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-300">
        No resumes found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {resumes.map((resume) => (
        <Link
          key={resume.tokenId}
          href={`/dashboard/resume/${resume.tokenId}`}
          className="p-6 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-750 transition-colors"
        >
          <h3 className="text-lg font-semibold text-white">{resume.name}</h3>
          <p className="text-gray-300 mt-2">{resume.profile.bio}</p>
          {resume.profile.skills && resume.profile.skills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {resume.profile.skills.map((skill: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-700 text-gray-200 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </Link>
      ))}
    </div>
  );
} 