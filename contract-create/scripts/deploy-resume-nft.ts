import hre from "hardhat";
import * as fs from 'fs';
import * as path from 'path';
import ResumeNFTModule from "../ignition/modules/ResumeNFT";
import { saveContractAddresses } from "./utils/saveAddresses";
import deployVerificationManager from "./deploy-verification-manager";

// Helper function to read existing contract addresses
function readExistingAddresses(): { verificationManager?: string, networkName?: string } {
  try {
    const addressesPath = path.resolve(__dirname, '../deployments/contract-addresses.json');
    if (fs.existsSync(addressesPath)) {
      const data = fs.readFileSync(addressesPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn('No existing addresses found or error reading file:', error);
  }
  return {};
}

async function main() {
  // Get current network information
  const network = await hre.ethers.provider.getNetwork();
  const networkName = network.name === 'unknown' ? 'hardhat' : network.name;
  
  console.log(`\n=== Deploying ResumeNFT on ${networkName} network ===\n`);

  // Check for existing VerificationManager address
  const existingAddresses = readExistingAddresses();
  let managerAddress = existingAddresses.verificationManager;
  let verificationManager;

  // If no registry address is available or we're on a different network, deploy a new one
  if (!managerAddress || existingAddresses.networkName !== networkName) {
    console.log('No existing VerificationManager found for this network, deploying a new one...');
    const deployment = await deployVerificationManager();
    managerAddress = deployment.managerAddress;
    verificationManager = deployment.verificationManager;
  } else {
    console.log(`Using existing VerificationManager at: ${managerAddress}`);
  }

  // Update the ResumeNFT module with the correct registry address
  console.log('Deploying ResumeNFT...');
  const { resumeNFT } = await hre.ignition.deploy(ResumeNFTModule, {
    // This must be an absolute path to your parameters JSON file
    parameters: path.resolve(__dirname, "../ignition/parameters.json"),
  });
  
  // Get the deployed contract address
  const resumeAddress = (resumeNFT as any).address;
  console.log(`ResumeNFT deployed to: ${resumeAddress}`);

  // Save both contract addresses
  saveContractAddresses({
    verificationManager: managerAddress,
    resumeNFT: resumeAddress,
    networkName,
  });

  console.log('\nDeployment completed successfully!');
  return { resumeNFT, verificationManager, resumeAddress, managerAddress };
}

// Execute only if run directly
if (require.main === module) {
  main().catch(console.error);
}

export default main;

// import hre from "hardhat";
// import ResumeNFTModule from "../ignition/modules/ResumeNFT";
// import deployVerificationRegistry from "./deploy-verification-registry";

// /**
//  * Deployment script for ResumeNFT using Hardhat Ignition
//  * @param existingRegistryAddress - Optional address of an existing VerificationRegistry contract
//  */
// async function main(existingRegistryAddress?: string) {
//   console.log("\n=== Starting ResumeNFT Deployment ===\n");

//   try {
//     // Check if ignition is available
//     if (!hre.ignition) {
//       throw new Error("Hardhat Ignition plugin not installed. Please install @nomicfoundation/hardhat-ignition");
//     }
    
//     let registryAddress: string;
//     let verificationRegistry: any;

//     // If no registry address provided, deploy a new VerificationRegistry
//     if (!existingRegistryAddress) {
//       console.log("No VerificationRegistry address provided, deploying a new one...");
//       const registryDeployment = await deployVerificationRegistry();
//       registryAddress = registryDeployment.registryAddress;
//       verificationRegistry = registryDeployment.verificationRegistry;
//     } else {
//       console.log(`Using existing VerificationRegistry at: ${existingRegistryAddress}`);
//       registryAddress = existingRegistryAddress;
      
//       // Create contract instance for the existing registry
//       const VerificationRegistry = await hre.ethers.getContractFactory("VerificationRegistry");
//       verificationRegistry = VerificationRegistry.attach(existingRegistryAddress);
//     }
    
//     // Deploy ResumeNFT directly without a custom module
//     console.log("Deploying ResumeNFT directly...");
    
//     // Get the deployer address
//     const [deployer] = await hre.ethers.getSigners();
//     const deployerAddress = await deployer.getAddress();
    
//     // Deploy the ResumeNFT contract
//     const ResumeNFT = await hre.ethers.getContractFactory("ResumeNFT");
//     const resumeNFT = await ResumeNFT.deploy(registryAddress, deployerAddress);
//     await resumeNFT.waitForDeployment();
    
//     // Get the deployed contract address
//     const resumeAddress = await resumeNFT.getAddress();

//     console.log(`✅ ResumeNFT deployed to: ${resumeAddress}`);
    
//     // Verify constructor arguments
//     console.log("\nVerifying constructor arguments...");
//     const usedRegistryAddress = await resumeNFT.verificationRegistry();
    
//     if (usedRegistryAddress.toLowerCase() === registryAddress.toLowerCase()) {
//       console.log("✅ ResumeNFT is correctly using VerificationRegistry");
//     } else {
//       console.log("❌ Error: ResumeNFT is using incorrect VerificationRegistry address");
//     }

//     // Output verification information
//     console.log("\n=== Etherscan Verification Info ===");
//     console.log("Run this command to verify your contract on Etherscan:");
//     console.log(`npx hardhat verify --network <network> ${resumeAddress} "${registryAddress}" "${deployerAddress}"`);

//     console.log("\n=== ResumeNFT Deployment Complete ===\n");

//     return { resumeNFT, verificationRegistry, resumeAddress, registryAddress };
//   } catch (error) {
//     console.error("\n❌ Deployment failed with error:");
//     console.error(error);
//     throw error;
//   }
// }

// // Execute the deployment if run directly
// if (require.main === module) {
//   // Check if an existing registry address was provided as an environment variable
//   const registryAddress = process.env.REGISTRY_ADDRESS;
  
//   main(registryAddress)
//     .then(() => process.exit(0))
//     .catch((error) => {
//       console.error(error);
//       process.exit(1);
//     });
// }

// export default main; 