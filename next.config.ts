import { createCivicAuthPlugin } from "@civic/auth-web3/nextjs"
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    contractOwnerAddress: process.env.CONTRACT_OWNER_ADDRESS,
  }
};

const withCivicAuth = createCivicAuthPlugin({
  clientId: "25bca813-5e88-4086-bd3e-ad116da08d90"
});

export default withCivicAuth(nextConfig)
