"use client";

import { useUser } from "@civic/auth-web3/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  const mainNavItems = [
    { name: "Resume", href: "/dashboard" },
    { name: "Organizations", href: "/dashboard/organizations" },
    { name: "Profile", href: "/dashboard/profile" },
  ];

  const resumeSubNavItems = [
    { name: "My Resumes", href: "/dashboard" },
    { name: "Create Resume", href: "/dashboard/resume/create" },
    { name: "Verification Requests", href: "/dashboard/verification-requests" },
  ];

  const {user} = useUser();

  // Check if we're in the resume section
  const isResumeSection = pathname.startsWith('/dashboard/resume') || pathname === '/dashboard' || pathname === '/dashboard/verification-requests';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-300">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-xl font-bold text-blue-400">
                  ProofOfWork
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <button
                type="button"
                className="text-gray-400 hover:text-gray-300 p-2 rounded-full"
              >
                <span className="sr-only">View notifications</span>
                <svg
                  className="h-6 w-6"
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
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </button>
              <div className="ml-3 relative">
                <div>
                  <button
                    type="button"
                    className="bg-gray-700 flex text-sm rounded-full focus:outline-none"
                    id="user-menu-button"
                    aria-expanded="false"
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                      {user?.name?.charAt(0)}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content with Sidebar */}
      <div className="flex pt-16">
        {/* Sidebar */}
        <div className="fixed top-16 left-0 z-30 w-64 bg-gray-800 border-r border-gray-700 min-h-[calc(100vh-4rem)] h-[calc(100vh-4rem)]">
          <div className="p-4 h-full overflow-y-auto">
            {/* Resume Section with Sub-links */}
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Resume
              </div>
              <nav className="space-y-1 ml-2">
                <Link
                  href="/dashboard"
                  className={`$${
                    pathname === "/dashboard"
                      ? "bg-gray-700 text-white font-bold border-l-4 border-blue-500"
                      : "text-gray-400 hover:bg-gray-700 hover:text-white border-l-4 border-transparent"
                  } group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
                >
                  My Resumes
                </Link>
                <Link
                  href="/dashboard/resume/create"
                  className={`$${
                    pathname === "/dashboard/resume/create"
                      ? "bg-gray-700 text-white font-bold border-l-4 border-blue-500"
                      : "text-gray-400 hover:bg-gray-700 hover:text-white border-l-4 border-transparent"
                  } group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
                >
                  Create Resume
                </Link>
                <Link
                  href="/dashboard/verification-requests"
                  className={`$${
                    pathname === "/dashboard/verification-requests"
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
                  className={`$${
                    pathname === "/dashboard/organizations"
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
                className={`$${
                  pathname === "/dashboard/profile"
                    ? "bg-gray-700 text-white font-bold border-l-4 border-blue-500"
                    : "text-gray-400 hover:bg-gray-700 hover:text-white border-l-4 border-transparent"
                } group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
              >
                Profile
              </Link>
              <Link
                href="/dashboard/admin"
                className={`$${
                  pathname === "/dashboard/admin"
                    ? "bg-gray-700 text-white font-bold border-l-4 border-blue-500"
                    : "text-gray-400 hover:bg-gray-700 hover:text-white border-l-4 border-transparent"
                } group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
              >
                Admin
              </Link>
            </nav>
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