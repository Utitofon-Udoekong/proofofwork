import hre from "hardhat";

/**
 * Deployment script to deploy all contracts in one go
 */
async function main() {
  console.log("\n=== Starting Deployment of All Contracts ===\n");

  try {
    // Get the deployer address
    const [deployer] = await hre.ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    
    // Deploy VerificationRegistry
    console.log("Deploying VerificationRegistry...");
    const VerificationRegistry = await hre.ethers.getContractFactory("VerificationRegistry");
    const verificationRegistry = await VerificationRegistry.deploy();
    await verificationRegistry.waitForDeployment();
    
    const registryAddress = await verificationRegistry.getAddress();
    console.log(`✅ VerificationRegistry deployed to: ${registryAddress}`);
    
    // Deploy ResumeNFT using the VerificationRegistry address
    console.log("Deploying ResumeNFT...");
    const ResumeNFT = await hre.ethers.getContractFactory("ResumeNFT");
    const resumeNFT = await ResumeNFT.deploy(registryAddress, deployerAddress);
    await resumeNFT.waitForDeployment();
    
    const resumeAddress = await resumeNFT.getAddress();
    console.log(`✅ ResumeNFT deployed to: ${resumeAddress}`);
    // Verify constructor arguments
    console.log("\nVerifying constructor arguments...");
    const usedRegistryAddress = await resumeNFT.verificationRegistry();
    
    if (usedRegistryAddress.toLowerCase() === registryAddress.toLowerCase()) {
      console.log("✅ ResumeNFT is correctly using VerificationRegistry");
    } else {
      console.log("❌ Error: ResumeNFT is using incorrect VerificationRegistry address");
    }

    // Output verification information
    console.log("\n=== Etherscan Verification Info ===");
    console.log("Run these commands to verify your contracts on Etherscan:");
    console.log(`npx hardhat verify --network <network> ${registryAddress}`);
    console.log(`npx hardhat verify --network <network> ${resumeAddress} "${registryAddress}" "${deployerAddress}"`);

    console.log("\n=== Deployment Complete ===\n");

    return { 
      verificationRegistry, 
      resumeNFT, 
      registryAddress, 
      resumeAddress 
    };
  } catch (error) {
    console.error("\n❌ Deployment failed with error:");
    console.error(error);
    throw error;
  }
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


