const hre = require("hardhat");
const { ethers } = hre;
require('dotenv').config({ path: "../.env" });

async function main() {
    console.log("🚀 Deploying Simple Wallet...");
    
    // Get deployer
    const [deployer] = await ethers.getSigners();
    console.log("👤 Deployer:", deployer.address);
    
    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Balance:", ethers.formatEther(balance), "ETH");
    
    if (balance === 0n) {
        console.error("❌ Deployer has no funds!");
        return;
    }
    
    // Deploy SimpleWallet
    const SimpleWallet = await ethers.getContractFactory("SimpleWallet");
    console.log("📦 Deploying contract...");
    
    const wallet = await SimpleWallet.deploy();
    await wallet.waitForDeployment();
    
    const address = await wallet.getAddress();
    console.log("✅ SimpleWallet deployed to:", address);
    console.log("👤 Owner:", await wallet.owner());
    console.log("🔢 Initial nonce:", await wallet.getCurrentNonce());
    
    console.log("\n📝 Update your .env files:");
    console.log(`WALLET_CONTRACT_ADDRESS=${address}`);
    console.log(`REACT_APP_WALLET_CONTRACT_ADDRESS=${address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    });
