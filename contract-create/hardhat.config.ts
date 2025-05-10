import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import '@typechain/hardhat'
import '@nomicfoundation/hardhat-ethers'
import '@nomicfoundation/hardhat-chai-matchers'
import "@nomicfoundation/hardhat-ignition";
import { configDotenv } from "dotenv";
configDotenv();

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      gas: 12000000,
      blockGasLimit: 12000000,
    },
    sepolia: {
      // url: 'https://sepolia.etherscan.io',
      url: 'https://eth-sepolia.g.alchemy.com/v2/XtyTZkjH5q4OZ2AjHCoN5MJ0g5u5E3MV',
      accounts: [process.env.OWNER_PRIVATE_KEY as string, process.env.USER_PRIVATE_KEY as string, 
        process.env.ORG_PRIVATE_KEY as string, process.env.OTHERORG_PRIVATE_KEY as string],
    },
  },
  defaultNetwork: "sepolia",
};

export default config;




