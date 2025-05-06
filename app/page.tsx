'use client';

import { CivicAuthButton } from '@/app/components/auth/CivicAuthButton';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <div className="max-w-3xl w-full text-center space-y-8">
        <h1 className="text-4xl font-bold text-gray-900">
          ProofOfWork - On-Chain Resume Builder
        </h1>
        
        <p className="text-xl text-gray-600">
          Build and verify your professional history on the blockchain
        </p>

        <div className="mt-8 space-y-4">
          <p className="text-gray-700">
            Sign in to create your verifiable on-chain resume
          </p>
          <div className="flex justify-center">
            <CivicAuthButton />
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Create Resume</h3>
            <p className="text-gray-600">Build your professional profile with verifiable entries</p>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Verify Credentials</h3>
            <p className="text-gray-600">Get your achievements verified by organizations</p>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Share Securely</h3>
            <p className="text-gray-600">Share your verified resume with potential employers</p>
          </div>
        </div>
      </div>
    </div>
  );
}
