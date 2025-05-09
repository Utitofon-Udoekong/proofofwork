'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWeb3 } from '../providers/Web3Provider';
import { useUser } from '@civic/auth-web3/react';
import { userHasWallet } from '@civic/auth-web3';
import { useAccount } from 'wagmi';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { address: wagmiAddress } = useWeb3();
  const { user, authStatus } = useUser();
  const userContext = useUser();
  const address = userHasWallet(userContext) ? userContext.ethereum.address : wagmiAddress;
  const pathname = usePathname();
  const { isConnected: wagmiConnected } = useAccount();
  const isConnected = authStatus === 'authenticated' && wagmiConnected;
  
  // Hide navbar on dashboard pages to prevent clash with dashboard layout
  if (pathname.startsWith('/dashboard')) {
    return null;
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-indigo-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center">
                <span className="text-white font-bold text-xl">ProofOfWork</span>
              </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {isConnected ? (
                <div className="flex items-center">
                  <Link
                    href="/dashboard"
                    className="px-3 py-2 mr-3 rounded-md text-sm font-medium text-indigo-100 hover:bg-indigo-500"
                  >
                    Dashboard
                  </Link>
                  <span className="bg-indigo-800 text-indigo-100 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connecting...'}
                  </span>
                </div>
              ) : (
                <span className="text-indigo-100 text-sm">Not connected</span>
              )}
            </div>
          </div>
          
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={toggleMenu}
              type="button"
              className="bg-indigo-700 inline-flex items-center justify-center p-2 rounded-md text-indigo-200 hover:text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-800 focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div
        className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden`}
        id="mobile-menu"
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {isConnected && (
            <>
              <Link
                href="/dashboard"
                className="block px-3 py-2 rounded-md text-base font-medium text-indigo-100 hover:bg-indigo-500"
              >
                Dashboard
              </Link>
              <div className="px-3 py-2 text-sm text-indigo-100 font-medium">
                Connected: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connecting...'}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
} 