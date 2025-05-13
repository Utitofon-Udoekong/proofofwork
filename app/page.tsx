'use client';

import { CivicAuthButton } from '@/app/components/auth/CivicAuthButton';
import { useUser } from "@civic/auth-web3/react";
import Link from 'next/link';
import { useAccount } from 'wagmi';
import Navbar from './components/Navbar';

export default function Home() {
  const { user, authStatus } = useUser();
  const { isConnected: wagmiConnected, isConnecting, isReconnecting } = useAccount();
  const isConnected = authStatus === 'authenticated' && wagmiConnected && !isConnecting && !isReconnecting;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <Navbar />
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center space-y-8">
            <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              ProofOfWork
            </h1>
            <p className="text-2xl text-gray-300 max-w-3xl mx-auto">
              Build your professional identity on the blockchain. Create verifiable resumes that employers trust.
            </p>
            <div className="flex justify-center">
              <CivicAuthButton />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Why Choose ProofOfWork?</h2>
            <p className="text-xl text-gray-300">The future of professional credentials is here</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-blue-500/50 transition-all duration-300">
              <div className="rounded-full bg-blue-900/30 p-4 w-16 h-16 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Blockchain-Powered Resumes</h3>
              <p className="text-gray-300">Create immutable, tamper-proof professional profiles that showcase your achievements with cryptographic proof.</p>
            </div>

            <div className="p-8 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-green-500/50 transition-all duration-300">
              <div className="rounded-full bg-green-900/30 p-4 w-16 h-16 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Verified Credentials</h3>
              <p className="text-gray-300">Get your achievements verified by trusted organizations and institutions on the blockchain.</p>
            </div>

            <div className="p-8 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-purple-500/50 transition-all duration-300">
              <div className="rounded-full bg-purple-900/30 p-4 w-16 h-16 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Decentralized Control</h3>
              <p className="text-gray-300">Own and control your professional data. Share your verified credentials securely with potential employers.</p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-xl text-gray-300">Three simple steps to create your verifiable resume</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="p-8 bg-gray-800/50 rounded-xl border border-gray-700">
                <div className="text-4xl font-bold text-blue-400 mb-4">01</div>
                <h3 className="text-xl font-bold text-white mb-4">Create Your Profile</h3>
                <p className="text-gray-300">Build your professional profile by adding your work experience, education, and skills.</p>
              </div>
              <div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>

            <div className="relative">
              <div className="p-8 bg-gray-800/50 rounded-xl border border-gray-700">
                <div className="text-4xl font-bold text-green-400 mb-4">02</div>
                <h3 className="text-xl font-bold text-white mb-4">Request Verification</h3>
                <p className="text-gray-300">Request verification from organizations to validate your achievements and credentials.</p>
              </div>
              <div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>

            <div>
              <div className="p-8 bg-gray-800/50 rounded-xl border border-gray-700">
                <div className="text-4xl font-bold text-purple-400 mb-4">03</div>
                <h3 className="text-xl font-bold text-white mb-4">Share Your Resume</h3>
                <p className="text-gray-300">Share your verified resume with potential employers and showcase your achievements.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-8">Ready to Build Your Verifiable Resume?</h2>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Join the future of professional credentials. Create your blockchain-powered resume today.
          </p>
          <div className="flex justify-center">
              <CivicAuthButton />
            </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-400">
            <p>© 2024 ProofOfWork. All rights reserved.</p>
            <p className="mt-2 text-sm">Secure, decentralized, and tamper-proof professional credentials on the blockchain</p>
            <div className="mt-4 flex justify-center items-center gap-2">
              <Link 
                href="/admin" 
                className="text-gray-500 hover:text-gray-400 text-sm flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Admin</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
