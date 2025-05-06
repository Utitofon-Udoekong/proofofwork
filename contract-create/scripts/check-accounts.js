const hre = require("hardhat");

async function main() {
  console.log("\n------ NETWORK INFO ------");
  console.log("Network:", hre.network.name);
  console.log("Provider URL:", hre.network.config.url || "Default Hardhat Network");
  
  console.log("\n------ ACCOUNTS ------");
  const accounts = await hre.ethers.getSigners();
  
  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    const address = await account.getAddress();
    const balance = await hre.ethers.provider.getBalance(address);
    const balanceInEth = hre.ethers.formatEther(balance);
    
    console.log(`Account ${i}:`);
    console.log(`  Address: ${address}`);
    console.log(`  Balance: ${balanceInEth} ETH`);
    console.log("--------------------------");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 