const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment...");
  
  const [deployer] = await ethers.getSigners();
  console.log("🔑 Deployer:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "BDAG");

  // Deploy Factory
  const Factory = await ethers.getContractFactory("SmartWalletFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  
  const factoryAddress = await factory.getAddress();
  console.log("✅ Factory deployed to:", factoryAddress);
  
  // Create wallet
  const createTx = await factory.createWallet(deployer.address);
  const receipt = await createTx.wait();
  
  const walletAddress = await factory.getWalletAddress(deployer.address);
  console.log("✅ Smart Wallet:", walletAddress);
  
  console.log("\n🎯 Update your .env:");
  console.log(`SMART_WALLET_FACTORY_ADDRESS=${factoryAddress}`);
  console.log(`WALLET_CONTRACT_ADDRESS=${walletAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
