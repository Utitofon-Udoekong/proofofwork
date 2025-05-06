import { createCivicAuthPlugin } from "@civic/auth-web3/nextjs"
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  clientId: process.env.CIVIC_CLIENT_ID || ""
};

const withCivicAuth = createCivicAuthPlugin({
  clientId: process.env.clientId || ""
});

export default withCivicAuth(nextConfig)
