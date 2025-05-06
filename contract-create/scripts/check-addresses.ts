import * as fs from 'fs';
import * as path from 'path';

/**
 * Script to check and display the currently deployed contract addresses
 */
async function main() {
  console.log('=== Checking Deployed Contract Addresses ===\n');
  
  const rootDir = path.resolve(__dirname, '..');
  const addressesPath = path.join(rootDir, 'deployments/contract-addresses.json');
  
  if (!fs.existsSync(addressesPath)) {
    console.log('\x1b[33mNo deployed contracts found.\x1b[0m');
    console.log('Run deployment with: npm run deploy');
    return;
  }
  
  try {
    const data = fs.readFileSync(addressesPath, 'utf8');
    const addresses = JSON.parse(data);
    
    console.log('\x1b[1mDeployed Contracts:\x1b[0m');
    console.log('\x1b[36mNetwork:              \x1b[0m', '\x1b[32m' + (addresses.networkName || 'Unknown') + '\x1b[0m');
    console.log('\x1b[36mVerificationRegistry: \x1b[0m', '\x1b[32m' + (addresses.verificationRegistry || 'Not deployed') + '\x1b[0m');
    console.log('\x1b[36mResumeNFT:           \x1b[0m', '\x1b[32m' + (addresses.resumeNFT || 'Not deployed') + '\x1b[0m');
    console.log('\x1b[36mDeployed at:         \x1b[0m', '\x1b[32m' + (addresses.deploymentTimestamp || 'Unknown') + '\x1b[0m');
    
    // Check if the frontend addresses file exists
    const frontendPath = path.join(rootDir, '../app/lib/contracts/addresses.ts');
    if (fs.existsSync(frontendPath)) {
      console.log('\n\x1b[1mFrontend Integration:\x1b[0m');
      console.log('\x1b[32m✓\x1b[0m', 'Addresses exported to frontend at:', '\x1b[36m' + frontendPath + '\x1b[0m');
    } else {
      console.log('\n\x1b[1mFrontend Integration:\x1b[0m');
      console.log('\x1b[31m✗\x1b[0m', 'Frontend addresses file not found at:', '\x1b[36m' + frontendPath + '\x1b[0m');
    }
  } catch (error) {
    console.error('\x1b[31mError reading addresses file:\x1b[0m', error);
  }
}

// Execute if run directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
} 