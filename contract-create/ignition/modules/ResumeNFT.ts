import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import * as fs from 'fs';
import * as path from 'path';

// Helper function to read existing registry address
function getVerificationRegistryAddress(): string | undefined {
  try {
    // Try to read from environment variable first
    if (process.env.VERIFICATION_REGISTRY_ADDRESS) {
      return process.env.VERIFICATION_REGISTRY_ADDRESS;
    }
    
    // Then try to read from deployments file
    const addressesPath = path.resolve(__dirname, '../../deployments/contract-addresses.json');
    if (fs.existsSync(addressesPath)) {
      const data = fs.readFileSync(addressesPath, 'utf8');
      const addresses = JSON.parse(data);
      return addresses.verificationRegistry;
    }
  } catch (error) {
    console.warn('Error reading VerificationRegistry address:', error);
  }
  
  // Default fallback address - this should be updated before deployment
  // This is just a placeholder and should NOT be used in production
  return "0x48CD707FD21788d747f1181dccA7B819AFBEfEa0";
}

const ResumeNFTModule = buildModule("ResumeNFTModule", (m) => {
  // Get VerificationRegistry address from deployment or environment
  const registryAddress = getVerificationRegistryAddress();
  console.log(`Using VerificationRegistry at: ${registryAddress}`);
  
  // Attach to the VerificationRegistry contract
  const verificationRegistry = m.contractAt("VerificationRegistry", registryAddress as string);

  // Get the deployer's address to use as the initial owner
  const owner = m.getAccount(0);
  // Deploy ResumeNFT with:
  // 1. The VerificationRegistry contract address
  // 2. The initial owner address (owner)
  const resumeNFT = m.contract("ResumeNFT", [
    verificationRegistry,
    owner
  ]);

  // Return both contracts for use in scripts or other modules
  return { resumeNFT, verificationRegistry };
});

export default ResumeNFTModule;
