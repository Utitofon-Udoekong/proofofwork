import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const ResumeNFTModule = buildModule("ResumeNFTModule", (m) => {
  // Get VerificationManager address from deployment or environment
  const managerAddress = m.getParameter('verificationManagerAddress') as unknown as string;
  console.log(`Using VerificationManager at: ${managerAddress}`);
  
  // Attach to the VerificationManager contract
  const verificationManager = m.contractAt("VerificationManager", managerAddress as string);

  // Get the deployer's address to use as the initial owner
  const owner = m.getAccount(0);
  // Deploy ResumeNFT with:
  // 1. The VerificationManager contract address
  // 2. The initial owner address (owner)
  const resumeNFT = m.contract("ResumeNFT", [
    verificationManager,
    owner
  ]);

  // Return both contracts for use in scripts or other modules
  return { resumeNFT, verificationManager };
});

export default ResumeNFTModule;
