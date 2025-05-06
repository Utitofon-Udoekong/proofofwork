import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import VerificationRegistryModule from "./VerificationRegistry";

const ResumeNFTModule = buildModule("ResumeNFTModule", (m) => {
  // Import the VerificationRegistry module
  const verificationRegistry = m.contractAt("VerificationRegistry", "0x48CD707FD21788d747f1181dccA7B819AFBEfEa0");

  // Get the deployer's address to use as the initial owner
  const deployer = m.getAccount(0);
  
  // Deploy ResumeNFT with:
  // 1. The VerificationRegistry contract address
  // 2. The initial owner address (deployer)
  const resumeNFT = m.contract("ResumeNFT", [
    verificationRegistry,
    deployer
  ]);

  // Log deployment for verification
  console.log("Deploying ResumeNFT...");

  // Return both contracts for use in scripts or other modules
  return { resumeNFT, verificationRegistry };
});

export default ResumeNFTModule;
