import * as fs from 'fs';
import * as path from 'path';

/**
 * Clean script to remove old contract addresses and deployment logs
 * This is useful for clearing out test deployments and starting fresh
 */
async function main() {
  console.log('=== Cleaning old deployment files ===\n');
  
  const rootDir = path.resolve(__dirname, '..');
  const appDir = path.resolve(rootDir, '../app');
  
  // Paths to clean
  const pathsToClean = [
    // Contract deployment data
    path.join(rootDir, 'deployments'),
    
    // Hardhat artifacts and cache
    path.join(rootDir, 'artifacts'),
    path.join(rootDir, 'cache'),
    path.join(rootDir, '.openzeppelin'),
    
    // Hardhat Ignition deployment files
    path.join(rootDir, 'ignition/deployments'),
    
    // Generated contract addresses in the app
    path.join(appDir, 'lib/contracts'),
  ];
  
  // Clean each path
  for (const cleanPath of pathsToClean) {
    try {
      if (fs.existsSync(cleanPath)) {
        console.log(`Cleaning: ${cleanPath}`);
        
        // Check if it's a directory
        const stats = fs.statSync(cleanPath);
        
        if (stats.isDirectory()) {
          // Special case for contracts directory - don't delete the directory itself
          if (cleanPath.includes('lib/contracts')) {
            // Only remove files within the directory, preserving contract-types.ts
            const files = fs.readdirSync(cleanPath);
            for (const file of files) {
              // Skip contract-types.ts
              if (file === 'contract-types.ts') {
                console.log(`  Preserving: ${file}`);
                continue;
              }
              const filePath = path.join(cleanPath, file);
              fs.unlinkSync(filePath);
              console.log(`  Deleted file: ${file}`);
            }
          } else {
            // Remove the entire directory
            fs.rmSync(cleanPath, { recursive: true, force: true });
          }
        } else {
          // It's a file, just delete it
          fs.unlinkSync(cleanPath);
        }
        
        console.log(`  ✅ Cleaned`);
      } else {
        console.log(`Skipping (not found): ${cleanPath}`);
      }
    } catch (error) {
      console.error(`  ❌ Error cleaning ${cleanPath}:`, error);
    }
  }
  
  // Create empty directories for paths that should exist
  const dirsToEnsure = [
    path.join(appDir, 'lib/contracts'),
    path.join(rootDir, 'deployments'),
  ];
  
  for (const dir of dirsToEnsure) {
    if (!fs.existsSync(dir)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  
  // Create a placeholder addresses file to prevent import errors
  const addressesPath = path.join(appDir, 'lib/contracts/addresses.ts');
  const placeholderContent = `// Placeholder file - will be replaced on deployment
import { ContractAddresses } from '../types';

export const contractAddresses: ContractAddresses = {
  networkName: "none",
  deploymentTimestamp: new Date().toISOString()
};

export default contractAddresses;
`;

  fs.writeFileSync(addressesPath, placeholderContent);
  console.log(`Created placeholder addresses file at: ${addressesPath}`);
  
  console.log('\n=== Cleaning complete ===');
  console.log('You can now run a fresh deployment with:');
  console.log('npm run deploy');
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