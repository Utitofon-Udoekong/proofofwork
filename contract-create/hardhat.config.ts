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
      url: 'https://ethereum-sepolia-rpc.publicnode.com',
      accounts: [process.env.PRIVATE_KEY as string],
    },
  },
  defaultNetwork: "sepolia",
};

export default config;




