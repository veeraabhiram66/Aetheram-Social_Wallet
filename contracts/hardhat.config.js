// Entry point for Hardhat config
require("@nomiclabs/hardhat-ethers");
require("@openzeppelin/hardhat-upgrades");
require("@nomicfoundation/hardhat-chai-matchers");
require("dotenv").config({ path: "../.env" });

module.exports = {
  solidity: "0.8.24",
  networks: {
    hardhat: {
      // Local hardhat network for testing
    },    blockdag: {
      url: process.env.RPC_URL,
      accounts: process.env.RELAYER_PRIVATE_KEY ? [process.env.RELAYER_PRIVATE_KEY] : [],
    },
    blockdag_metamask: {
      url: process.env.RPC_URL,
      // No accounts specified - will use MetaMask
    },
    // You can add other testnets here (e.g., goerli, sepolia)
  },
};
