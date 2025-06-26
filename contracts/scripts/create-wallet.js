/**
 * Create Smart Wallet Script
 * Uses the already deployed factory to create a smart wallet
 */

const { ethers } = require("hardhat");

async function main() {
  console.log("🏗️ Creating smart wallet using deployed factory...");
  
  const [deployer] = await ethers.getSigners();
  console.log("🔑 Deployer:", deployer.address);
  
  // Use the deployed factory
  const factoryAddress = "0x026C40Dfc0DB194A5D3Ac41909C736a93a2bffa9";
  console.log("🏭 Using factory at:", factoryAddress);
  
  try {
    // Connect to the deployed factory
    const SmartWalletFactory = await ethers.getContractFactory("SmartWalletFactory");
    const factory = SmartWalletFactory.attach(factoryAddress);
    
    // Check if wallet already exists
    let existingWallet = await factory.getWalletAddress(deployer.address);
    
    if (existingWallet && existingWallet !== "0x0000000000000000000000000000000000000000") {
      console.log("✅ Smart wallet already exists:", existingWallet);
      
      // Verify it works
      const EnhancedSmartWallet = await ethers.getContractFactory("EnhancedSmartWallet");
      const wallet = EnhancedSmartWallet.attach(existingWallet);
      
      const owner = await wallet.owner();
      const nonce = await wallet.getCurrentNonce();
      
      console.log("👤 Owner:", owner);
      console.log("🔢 Nonce:", nonce.toString());
      
      console.log("\n🎯 Your smart wallet is ready!");
      console.log("Address:", existingWallet);
      
      return existingWallet;
    }
    
    // Create new wallet if doesn't exist
    console.log("📝 Creating new smart wallet...");
    const createTx = await factory.createWallet(deployer.address);
    const receipt = await createTx.wait();
    
    const newWallet = await factory.getWalletAddress(deployer.address);
    console.log("✅ Smart wallet created:", newWallet);
    
    return newWallet;
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    
    // Calculate the deterministic address as fallback
    console.log("\n🔮 Calculating smart wallet address...");
    const deployerAddress = deployer.address;
    
    // This is a simplified calculation - the actual address would depend on the factory's implementation
    console.log("🏛️ For deployer:", deployerAddress);
    console.log("🏭 Factory:", factoryAddress);
    
    throw error;
  }
}

main()
  .then((walletAddress) => {
    console.log("\n🎉 Success! Smart wallet:", walletAddress);
    console.log("\n📝 Update your .env files:");
    console.log(`WALLET_CONTRACT_ADDRESS=${walletAddress}`);
    console.log(`REACT_APP_WALLET_CONTRACT_ADDRESS=${walletAddress}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Failed:", error);
    process.exit(1);
  });
