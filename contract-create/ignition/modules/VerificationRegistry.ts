import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const VerificationRegistryModule = buildModule("VerificationRegistryModule", (m) => {
  // Deploy VerificationRegistry
  // The Ownable constructor in version 5.x takes the initial owner as parameter
  // Our contract passes msg.sender to it, which will be the deployer address
  const verificationRegistry = m.contract("VerificationRegistry", []);
  
  // Log deployment for verification
  console.log("Deploying VerificationRegistry...");

  return { verificationRegistry };
});

export default VerificationRegistryModule;