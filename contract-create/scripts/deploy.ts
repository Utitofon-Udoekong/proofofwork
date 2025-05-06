// import { ethers } from "hardhat";

// async function main() {
//   console.log("\n=== Starting Deployment ===\n");

//   try {
//     // Get deployer account
//     const [deployer] = await ethers.getSigners();
//     console.log(`Deploying contracts with account: ${await deployer.getAddress()}`);
    
//     // Deploy VerificationRegistry first
//     console.log("\nDeploying VerificationRegistry...");
//     const verificationRegistryFactory = await ethers.getContractFactory("VerificationRegistry");
//     const verificationRegistry = await verificationRegistryFactory.deploy();
//     await verificationRegistry.waitForDeployment();
//     const registryAddress = await verificationRegistry.getAddress();
//     console.log(`✅ VerificationRegistry deployed to: ${registryAddress}`);

//     // Deploy ResumeNFT with VerificationRegistry address
//     console.log("\nDeploying ResumeNFT...");
//     const resumeNFTFactory = await ethers.getContractFactory("ResumeNFT");
//     const resumeNFT = await resumeNFTFactory.deploy(
//       registryAddress,                    // VerificationRegistry address
//       await deployer.getAddress()         // Ownable initialOwner
//     );
//     await resumeNFT.waitForDeployment();
//     const resumeNFTAddress = await resumeNFT.getAddress();
//     console.log(`✅ ResumeNFT deployed to: ${resumeNFTAddress}`);

//     // Verify the constructor args were passed correctly
//     console.log("\nVerifying constructor arguments...");
//     const usedRegistryAddress = await resumeNFT.verificationRegistry();
//     if (usedRegistryAddress === registryAddress) {
//       console.log("✅ ResumeNFT is correctly using VerificationRegistry");
//     } else {
//       console.log("❌ Error: ResumeNFT is using incorrect VerificationRegistry address");
//       console.log(`  Expected: ${registryAddress}`);
//       console.log(`  Actual: ${usedRegistryAddress}`);
//     }

//     // Output verification information
//     console.log("\n=== Etherscan Verification Info ===");
//     console.log("Run these commands to verify your contracts on Etherscan:");
//     console.log(`npx hardhat verify --network <network> ${registryAddress}`);
//     console.log(`npx hardhat verify --network <network> ${resumeNFTAddress} "${registryAddress}" "${await deployer.getAddress()}"`);

//     console.log("\n=== Deployment Complete ===\n");

//     // Return the deployed contracts for testing or further operations
//     return { verificationRegistry, resumeNFT };
//   } catch (error) {
//     console.error("\n❌ Deployment failed with error:");
//     console.error(error);
//     throw error;
//   }
// }

// // Execute the deployment
// main()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   }); 