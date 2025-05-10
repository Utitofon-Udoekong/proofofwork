import hre from "hardhat";
import VerificationManagerModule from "../ignition/modules/VerificationManager";
import { saveContractAddresses } from "./utils/saveAddresses";
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  // Get current network information
  const network = await hre.ethers.provider.getNetwork();
  const networkName = network.name === 'unknown' ? 'hardhat' : network.name;
  
  console.log(`\n=== Deploying VerificationManager on ${networkName} network ===\n`);
  
  // Deploy using Hardhat Ignition
  const { verificationManager } = await hre.ignition.deploy(VerificationManagerModule);
  
  // Get the deployed contract address
  const managerAddress = (verificationManager as any).address;
  console.log(`VerificationManager deployed to: ${managerAddress}`);
  
  // Save the contract address to parameters.json
  const parametersPath = path.join(__dirname, '../ignition/parameters.json');
  let parameters = {};
  
  try {
    // Read existing parameters if file exists
    if (fs.existsSync(parametersPath)) {
      parameters = JSON.parse(fs.readFileSync(parametersPath, 'utf8'));
    }
  } catch (error) {
    console.warn('Could not read existing parameters.json, creating new file');
  }

  // Update parameters with new address
  parameters = {
    ...parameters,
    ResumeNFTModule: {
      ...(parameters as any).ResumeNFTModule,
      verificationManagerAddress: managerAddress
    }
  };

  // Write updated parameters back to file
  fs.writeFileSync(parametersPath, JSON.stringify(parameters, null, 4));
  console.log('\nUpdated parameters.json with new VerificationManager address');
  
  // Save the contract address for other purposes
  const addresses = saveContractAddresses({
    verificationManager: managerAddress,
    networkName,
  });
  
  console.log('\nDeployment completed successfully!');
  return { verificationManager, managerAddress: addresses.verificationManager };
}

// Execute only if run directly
if (require.main === module) {
  main().catch(console.error);
}

export default main;
