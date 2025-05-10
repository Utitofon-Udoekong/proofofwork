import deployResumeNFT from './deploy-resume-nft';
import deployVerificationManager from './deploy-verification-manager';

/**
 * Deployment script to deploy all contracts in one go
 */
async function main() {
  console.log('=== Starting full deployment sequence ===\n');
  
  console.log('Step 1: Deploying VerificationManager...');
  const { managerAddress } = await deployVerificationManager();
  
  console.log('\nStep 2: Deploying ResumeNFT...');
  const { resumeAddress } = await deployResumeNFT();

  
  console.log('\n=== Deployment Summary ===');
  console.log(`VerificationManager: ${managerAddress}`);
  console.log(`ResumeNFT:           ${resumeAddress}`);
  console.log('\nContract addresses have been saved to app/lib/contracts/addresses.ts and are ready for frontend use.');
}

// Execute the deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}


