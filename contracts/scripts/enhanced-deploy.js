/**
 * Enhanced Smart Wallet Deployment Script
 * Deploys the comprehensive meta-transaction system
 */

const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting Enhanced Smart Wallet deployment...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("🔑 Deploying with account:", deployer.address);
  
  // Check deployer balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Deployer balance:", ethers.formatEther(balance), "BDAG");
  
  if (balance < ethers.parseEther("0.01")) {
    console.warn("⚠️  Warning: Low balance. Make sure you have enough BDAG for deployment.");
  }

  try {
    // Deploy SmartWalletFactory first
    console.log("\n📦 Deploying SmartWalletFactory...");
    const SmartWalletFactory = await ethers.getContractFactory("SmartWalletFactory");
    const factory = await SmartWalletFactory.deploy();
    await factory.waitForDeployment();
    
    const factoryAddress = await factory.getAddress();
    console.log("✅ SmartWalletFactory deployed to:", factoryAddress);

    // Create a smart wallet for the deployer
    console.log("\n🏗️  Creating smart wallet for deployer...");
    const createTx = await factory.createWallet(deployer.address);
    const receipt = await createTx.wait();
    
    // Get the smart wallet address from events
    const event = receipt.logs.find(log => {
      try {
        const parsed = factory.interface.parseLog(log);
        return parsed && parsed.name === 'WalletCreated';
      } catch {
        return false;
      }
    });
    
    let smartWalletAddress;
    if (event) {
      const parsed = factory.interface.parseLog(event);
      smartWalletAddress = parsed.args.wallet;
      console.log("✅ Smart wallet created at:", smartWalletAddress);
    } else {
      // Fallback: calculate the address
      smartWalletAddress = await factory.getWalletAddress(deployer.address);
      console.log("✅ Smart wallet address calculated:", smartWalletAddress);
    }

    // Verify the smart wallet deployment
    console.log("\n🔍 Verifying smart wallet deployment...");
    const SmartWallet = await ethers.getContractFactory("SmartWallet");
    const wallet = SmartWallet.attach(smartWalletAddress);
    
    const owner = await wallet.owner();
    const nonce = await wallet.getCurrentNonce();
    
    console.log("👤 Smart wallet owner:", owner);
    console.log("🔢 Smart wallet nonce:", nonce.toString());
    
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      throw new Error("Smart wallet owner mismatch!");
    }

    // Optionally fund the smart wallet
    console.log("\n💸 Funding smart wallet with 0.1 BDAG...");
    const fundTx = await deployer.sendTransaction({
      to: smartWalletAddress,
      value: ethers.parseEther("0.1")
    });
    await fundTx.wait();
    
    const walletBalance = await deployer.provider.getBalance(smartWalletAddress);
    console.log("💰 Smart wallet balance:", ethers.formatEther(walletBalance), "BDAG");

    // Save deployment info
    const deploymentInfo = {
      network: await deployer.provider.getNetwork(),
      deployer: deployer.address,
      smartWalletFactory: factoryAddress,
      smartWallet: smartWalletAddress,
      deploymentBlock: receipt.blockNumber,
      timestamp: new Date().toISOString()
    };

    console.log("\n📋 Deployment Summary:");
    console.log("==========================================");
    console.log("🌐 Network:", deploymentInfo.network.name, `(Chain ID: ${deploymentInfo.network.chainId})`);
    console.log("🔑 Deployer:", deploymentInfo.deployer);
    console.log("🏭 Factory:", deploymentInfo.smartWalletFactory);
    console.log("🏛️  Smart Wallet:", deploymentInfo.smartWallet);
    console.log("🏗️  Block:", deploymentInfo.deploymentBlock);
    console.log("⏰ Time:", deploymentInfo.timestamp);
    console.log("==========================================");

    console.log("\n🎯 Next Steps:");
    console.log("1. Update your .env file with these addresses:");
    console.log(`   SMART_WALLET_FACTORY_ADDRESS=${factoryAddress}`);
    console.log(`   WALLET_CONTRACT_ADDRESS=${smartWalletAddress}`);
    console.log("\n2. Connect to the smart wallet in your dApp using:", smartWalletAddress);
    console.log("\n3. Use the factory to create more smart wallets for other users");

    return deploymentInfo;

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

// Execute deployment
if (require.main === module) {
  main()
    .then((info) => {
      console.log("\n🎉 Deployment completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Deployment failed:", error);
      process.exit(1);
    });
}

module.exports = main;
