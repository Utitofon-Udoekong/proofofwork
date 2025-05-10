import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const VerificationManagerModule = buildModule("VerificationManagerModule", (m) => {
  const verificationManager = m.contract("VerificationManager", []);

  console.log("Deploying VerificationManager...");

  return { verificationManager };
});

export default VerificationManagerModule; 