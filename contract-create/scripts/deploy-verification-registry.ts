import hre from "hardhat";
import VerificationRegistryModule from "../ignition/modules/VerificationRegistry";

async function main() {
  const {verificationRegistry} = await hre.ignition.deploy(VerificationRegistryModule);
  console.log(`VerificationRegistry deployed to: ${(verificationRegistry as any).address}`);
}

main().catch(console.error);

// import hre from "hardhat";
// import VerificationRegistryModule from "../ignition/modules/VerificationRegistry";

// /**
//  * Deployment script for VerificationRegistry using Hardhat Ignition
//  */
// async function main() {
//   console.log("\n=== Starting VerificationRegistry Deployment ===\n");

//   try {
//     // Check if ignition is available
//     if (!hre.ignition) {
//       throw new Error("Hardhat Ignition plugin not installed. Please install @nomicfoundation/hardhat-ignition");
//     }
    
//     // Deploy using Ignition
//     console.log("Deploying VerificationRegistry using Hardhat Ignition...");
//     const result = await hre.ignition.deploy(VerificationRegistryModule);

//     // Get the contract factory for verification and to attach to the deployment address
//     const VerificationRegistry = await hre.ethers.getContractFactory("VerificationRegistry");
    
//     // Get deployment artifacts - using any to avoid TypeScript issues
//     const deploymentResult = result as any;
    
//     // When using hre.ignition.deploy(VerificationRegistryModule)
//     // The contract instance should be accessible at result.verificationRegistry
//     // We'll use the address from that contract directly
//     const registryAddress = deploymentResult.verificationRegistry?.address;
    
//     if (!registryAddress) {
//       throw new Error("Failed to get VerificationRegistry address from deployment");
//     }
    
//     // Create an instance we can interact with
//     const verificationRegistry = VerificationRegistry.attach(registryAddress);
    
//     console.log(`✅ VerificationRegistry deployed to: ${registryAddress}`);
    
//     // Output verification information
//     console.log("\n=== Etherscan Verification Info ===");
//     console.log("Run this command to verify your contract on Etherscan:");
//     console.log(`npx hardhat verify --network <network> ${registryAddress}`);

//     console.log("\n=== VerificationRegistry Deployment Complete ===\n");

//     return { verificationRegistry, registryAddress };
//   } catch (error) {
//     console.error("\n❌ Deployment failed with error:");
//     console.error(error);
//     throw error;
//   }
// }

// // Execute the deployment
// if (require.main === module) {
//   main()
//     .then(() => process.exit(0))
//     .catch((error) => {
//       console.error(error);
//       process.exit(1);
//     });
// }

// export default main; 