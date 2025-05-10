'use client';

import { CivicAuthButton } from '@/app/components/auth/CivicAuthButton';
import { useUser } from "@civic/auth-web3/react";
import Link from 'next/link';
import Image from 'next/image';
import { useAccount } from 'wagmi';

export default function Home() {
  const { user, authStatus } = useUser();
  const { isConnected: wagmiConnected } = useAccount();
  const isConnected = authStatus === 'authenticated' && wagmiConnected;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="max-w-5xl w-full text-center space-y-10">
        <div className="space-y-6">
          <h1 className="text-5xl font-bold text-white tracking-tight">
            ProofOfWork - On-Chain Resume Builder
          </h1>

          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Build and verify your professional history on the blockchain with immutable,
            trusted credentials that employers can verify
          </p>
        </div>

        <div className="mt-10 space-y-6">
          {isConnected ? (
            <div className="space-y-6">
              <p className="text-lg text-gray-300 font-medium">
                Welcome back! Access your dashboard to manage your resume.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/dashboard"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Go to Dashboard
                </Link>
                <Link
                  href="/dashboard/resume/create"
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  Create Resume
                </Link>
              </div>
            </div>
          ) : (
            <>
              <p className="text-lg text-gray-300 font-medium">
                Sign in to create your verifiable on-chain resume
              </p>
              <div className="flex justify-center">
                <CivicAuthButton />
              </div>
            </>
          )}
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 bg-gray-800 rounded-xl shadow-md transition-all duration-300 hover:shadow-blue-900/30 hover:shadow-lg border border-gray-700 flex flex-col items-center">
            <div className="rounded-full bg-blue-900/30 p-4 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-bold text-xl mb-3 text-white">Create Resume</h3>
            <p className="text-gray-300 text-center">Build your professional profile with verifiable entries</p>
          </div>

          <div className="p-8 bg-gray-800 rounded-xl shadow-md transition-all duration-300 hover:shadow-green-900/30 hover:shadow-lg border border-gray-700 flex flex-col items-center">
            <div className="rounded-full bg-green-900/30 p-4 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="font-bold text-xl mb-3 text-white">Verify Credentials</h3>
            <p className="text-gray-300 text-center">Get your achievements verified by organizations</p>
          </div>

          <div className="p-8 bg-gray-800 rounded-xl shadow-md transition-all duration-300 hover:shadow-purple-900/30 hover:shadow-lg border border-gray-700 flex flex-col items-center">
            <div className="rounded-full bg-purple-900/30 p-4 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <h3 className="font-bold text-xl mb-3 text-white">Share Securely</h3>
            <p className="text-gray-300 text-center">Share your verified resume with potential employers</p>
          </div>
        </div>

        <div className="mt-16 py-6 border-t border-gray-700 text-gray-400 text-sm">
          <p>Secure, decentralized, and tamper-proof professional credentials on the blockchain</p>
        </div>
      </div>
    </div>
  );
}
