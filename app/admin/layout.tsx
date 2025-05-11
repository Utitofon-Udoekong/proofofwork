"use client";
import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { metaMask } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { AdminProvider } from "./AdminProvider";

const queryClient = new QueryClient();

export const adminWagmiConfig = createConfig({
  chains: [sepolia],
  transports: { [sepolia.id]: http() },
  connectors: [metaMask()],
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={adminWagmiConfig}>
        <AdminProvider>
          <div className="min-h-screen bg-gray-900 text-gray-200">
            <div className="bg-blue-950 border-b border-blue-800 p-4 flex items-center justify-between">
              <h1 className="text-xl font-bold text-blue-400">Admin Panel</h1>
              {/* The admin connect button will go in the page itself */}
            </div>
            <main className="max-w-5xl mx-auto p-6">{children}</main>
          </div>
        </AdminProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
} 