const hre = require("hardhat");
const { ethers } = hre;
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: "../.env" });

async function deployAndConfigure() {
    console.log("🚀 Deploying and Configuring Smart Wallet...");
    
    try {
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
        
        // Update frontend App.js with the new address
        const appJsPath = path.join(__dirname, '../../frontend/src/App.js');
        if (fs.existsSync(appJsPath)) {
            let appContent = fs.readFileSync(appJsPath, 'utf8');
            
            // Replace the placeholder address
            appContent = appContent.replace(
                /const smartWalletAddress = '0x0+'/g,
                `const smartWalletAddress = '${address}'`
            );
            
            fs.writeFileSync(appJsPath, appContent);
            console.log("✅ Updated frontend App.js with new wallet address");
        }
        
        // Update test-transaction.js
        const testTxPath = path.join(__dirname, '../../test-transaction.js');
        if (fs.existsSync(testTxPath)) {
            let testContent = fs.readFileSync(testTxPath, 'utf8');
            
            // Replace the test wallet address
            testContent = testContent.replace(
                /const walletAddress = '0x[a-fA-F0-9]{40}'/g,
                `const walletAddress = '${address}'`
            );
            
            fs.writeFileSync(testTxPath, testContent);
            console.log("✅ Updated test-transaction.js with new wallet address");
        }
        
        // Create deployment info file
        const deploymentInfo = {
            address: address,
            owner: await wallet.owner(),
            deployedAt: new Date().toISOString(),
            deployer: deployer.address,
            network: hre.network.name,
            txHash: wallet.deploymentTransaction()?.hash
        };
        
        const infoPath = path.join(__dirname, '../deployed-wallet.json');
        fs.writeFileSync(infoPath, JSON.stringify(deploymentInfo, null, 2));
        console.log("✅ Deployment info saved to deployed-wallet.json");
        
        console.log("\n🎉 Deployment Complete!");
        console.log("📋 Wallet Information:");
        console.log(`  Address: ${address}`);
        console.log(`  Owner: ${deploymentInfo.owner}`);
        console.log(`  Network: ${hre.network.name}`);
        
        console.log("\n🔄 Next Steps:");
        console.log("1. Restart your frontend application");
        console.log("2. The wallet address has been automatically updated");
        console.log("3. You can now send transactions!");
        
    } catch (error) {
        console.error("❌ Deployment failed:", error.message);
        
        if (error.code === 'INSUFFICIENT_FUNDS') {
            console.log("💡 Solution: Fund the deployer wallet with some ETH");
        } else if (error.code === 'NETWORK_ERROR') {
            console.log("💡 Solution: Check your RPC_URL in .env file");
        }
    }
}

deployAndConfigure();
