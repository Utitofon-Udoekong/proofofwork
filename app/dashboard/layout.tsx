"use client";

import { useUser } from "@civic/auth-web3/react";
import Link from "next/link";
import { usePathname, useRouter, redirect } from "next/navigation";
import { useWeb3 } from "@/app/providers/Web3Provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { logout, walletConnected, userAuthenticated, address } = useWeb3();
  const { user } = useUser();

  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      redirect('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-300">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-none border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-xl font-bold text-white">
                  ProofOfWork
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <span className="bg-indigo-800 text-indigo-100 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content with Sidebar */}
      <div className="flex pt-16">
        {/* Sidebar */}
        <div className="fixed top-16 left-0 z-30 w-64 bg-none border-r border-gray-700 min-h-[calc(100vh-4rem)] h-[calc(100vh-4rem)] flex flex-col justify-between">
          <div className="p-4 h-full overflow-y-auto pb-20">
            {/* Resume Section with Sub-links */}
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Resume
              </div>
              <nav className="space-y-1 ml-2">
                <Link
                  href="/dashboard"
                  className={`$${pathname === "/dashboard"
                      ? "bg-gray-700 text-white font-bold border-l-4 border-blue-500"
                      : "text-gray-400 hover:bg-gray-700 hover:text-white border-l-4 border-transparent"
                    } group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
                >
                  My Resumes
                </Link>
                <Link
                  href="/dashboard/resume/create"
                  className={`$${pathname === "/dashboard/resume/create"
                      ? "bg-gray-700 text-white font-bold border-l-4 border-blue-500"
                      : "text-gray-400 hover:bg-gray-700 hover:text-white border-l-4 border-transparent"
                    } group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
                >
                  Create Resume
                </Link>
                <Link
                  href="/dashboard/verification-requests"
                  className={`$${pathname === "/dashboard/verification-requests"
                      ? "bg-gray-700 text-white font-bold border-l-4 border-blue-500"
                      : "text-gray-400 hover:bg-gray-700 hover:text-white border-l-4 border-transparent"
                    } group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
                >
                  Verification Requests
                </Link>
              </nav>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-700 my-6" />

            {/* Organizations Section with Sub-links */}
            <div className="mt-8">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Organizations
              </div>
              <nav className="space-y-1 ml-2">
                <Link
                  href="/dashboard/organizations"
                  className={`$${pathname === "/dashboard/organizations"
                      ? "bg-gray-700 text-white font-bold border-l-4 border-blue-500"
                      : "text-gray-400 hover:bg-gray-700 hover:text-white border-l-4 border-transparent"
                    } group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
                >
                  Organizations
                </Link>
              </nav>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-700 my-6" />

            {/* Profile */}
            <nav className="space-y-1 mt-2">
              <Link
                href="/dashboard/profile"
                className={`$${pathname === "/dashboard/profile"
                    ? "bg-gray-700 text-white font-bold border-l-4 border-blue-500"
                    : "text-gray-400 hover:bg-gray-700 hover:text-white border-l-4 border-transparent"
                  } group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
              >
                Profile
              </Link>

            </nav>
          </div>
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={handleLogout}
              disabled={!walletConnected || !userAuthenticated}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-64 py-6 px-4 sm:px-6 lg:px-8 h-[calc(100vh-4rem)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
} 