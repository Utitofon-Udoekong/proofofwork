'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { userHasWallet } from "@civic/auth-web3";
import { embeddedWallet } from "@civic/auth-web3/wagmi";
import { CivicAuthProvider, useUser } from "@civic/auth-web3/react";
import { useAutoConnect } from "@civic/auth-web3/wagmi";

// Create a client
const queryClient = new QueryClient();

// Configure Wagmi
const wagmiConfig = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  connectors: [
    embeddedWallet(),
  ],
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <CivicAuthProvider clientId={process.env.NEXT_PUBLIC_CIVIC_CLIENT_ID!}>
          <AutoConnectWrapper>
            {children}
          </AutoConnectWrapper>
        </CivicAuthProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}

// Wrapper component to handle auto-connection
function AutoConnectWrapper({ children }: { children: React.ReactNode }) {
  const userContext = useUser();
  
  // Auto-connect the wallet if user has one
  useAutoConnect();

  // Create wallet if user doesn't have one
  React.useEffect(() => {
    if (userContext.user && !userHasWallet(userContext)) {
      userContext.createWallet();
    }
  }, [userContext]);

  return <>{children}</>;
}
