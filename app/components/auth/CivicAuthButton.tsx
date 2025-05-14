'use client';

import { userHasWallet } from "@civic/auth-web3";
import { useUser } from "@civic/auth-web3/react";
import { useAccount, useConnect } from "wagmi";
import Link from "next/link";
import { useEffect } from "react";

export function CivicAuthButton() {
  const { user, isLoading, error, signIn, walletCreationInProgress } = useUser();
  const { isConnected, isConnecting } = useAccount();
  const { connectors, connect } = useConnect();
  const userContext = useUser();
  const hasWallet = userHasWallet(userContext);

  const connectWallet = () => connect({
    // connect to the "civic" connector
    connector: connectors[0],
  });

  const handleClick = async () => {
    if (isLoading || walletCreationInProgress || isConnecting) return;
    handleSignIn()
  };

  const handleLogin = async () => {
    if (userContext.user && !userHasWallet(userContext)) {
      userContext.createWallet().then(connectWallet)
    } else if (userContext.user && userHasWallet(userContext)) {
      connectWallet()
    }
  }

  const handleSignIn = async () => {
    await signIn("iframe").then(() => {
      handleLogin()
    })
  }

  useEffect(() => {
    handleLogin()
  }, [user])

  const getButtonText = () => {
    if (isLoading || walletCreationInProgress || isConnecting) {
      return 'Loading...';
    } else {
      return 'Sign In';
    }
  }


  // Otherwise, show the single action button
  return (
    <>
      {
        user && hasWallet && isConnected ?
          (<div className="flex flex-col md:flex-row max-w-md gap-2 w-full mt-4">
            <Link
              href="/dashboard/organizations"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 text-center w-full"
            >
              View Organization
            </Link>
            <Link
              href="/dashboard/resume/create"
              className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 text-center w-full"
            >
              Create Resume
            </Link>
          </div>) :
          (
            <div className="gap-2 max-w-xs mx-auto">
              <button
                onClick={handleClick}
                disabled={isLoading || walletCreationInProgress || isConnecting}
                className={`inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold text-white transition-colors duration-200
          ${isLoading || walletCreationInProgress || isConnecting ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
          w-full text-base shadow-md`}
                aria-busy={isLoading || walletCreationInProgress || isConnecting}
                aria-live="polite"
              >
                {(isLoading || walletCreationInProgress || isConnecting) && (
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {getButtonText()}
              </button>
              {error && (
                <div className="text-red-400 text-sm mt-1 text-center max-w-xs">{typeof error === 'string' ? error : error.message}</div>
              )}
            </div>
          )
      }
    </>
  );
} 