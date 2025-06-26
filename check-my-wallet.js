#!/usr/bin/env node

/**
 * Quick Wallet Check for Your Address
 * This will tell you if you already have a smart wallet deployed
 */

const { ethers } = require('ethers');

const RPC_URL = 'https://rpc.primordial.bdagscan.com';
const YOUR_ADDRESS = '0x484eab4066d5631754C329Cc27FA6213ba038cc8'; // Your MetaMask address

const SIMPLE_WALLET_ABI = [
    "function owner() external view returns (address)",
    "function getCurrentNonce() external view returns (uint256)",
    "function getBalance() external view returns (uint256)"
];

async function checkWalletStatus() {
    console.log('🔍 Checking Smart Wallet Status...');
    console.log('📍 Your Address:', YOUR_ADDRESS);
    console.log('');

    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        
        // Check if your address has a smart wallet contract
        const code = await provider.getCode(YOUR_ADDRESS);
        const hasContract = code !== '0x';
        
        console.log('📄 Contract Check:', hasContract ? '✅ SMART WALLET FOUND!' : '❌ No smart wallet contract');
        
        if (hasContract) {
            console.log('📏 Code Length:', code.length, 'bytes');
            
            // Try to interact with it
            try {
                const wallet = new ethers.Contract(YOUR_ADDRESS, SIMPLE_WALLET_ABI, provider);
                const owner = await wallet.owner();
                const nonce = await wallet.getCurrentNonce();
                const balance = await provider.getBalance(YOUR_ADDRESS);
                
                console.log('');
                console.log('🎉 SMART WALLET DETAILS:');
                console.log('  📍 Address:', YOUR_ADDRESS);
                console.log('  👤 Owner:', owner);
                console.log('  🔢 Nonce:', nonce.toString());
                console.log('  💰 Balance:', ethers.formatEther(balance), 'ETH');
                console.log('');
                console.log('✅ Your smart wallet is READY TO USE!');
                console.log('🚀 Start the frontend and begin sending transactions!');
                
            } catch (error) {
                console.log('⚠️ Contract exists but may not be a smart wallet:', error.message);
                console.log('🔄 You may need to deploy a new smart wallet');
            }
        } else {
            console.log('');
            console.log('🚀 DEPLOYMENT NEEDED:');
            console.log('  • No smart wallet found at your address');
            console.log('  • You need to deploy a new smart wallet');
            console.log('  • Use the AccurateWalletDeployer in the frontend');
            console.log('');
            console.log('📋 Next Steps:');
            console.log('  1. Run: start-wallet-system.bat');
            console.log('  2. Open http://localhost:3000');
            console.log('  3. Connect your wallet');
            console.log('  4. Click "Deploy Smart Wallet"');
        }
        
    } catch (error) {
        console.error('❌ Error checking wallet:', error.message);
    }
}

checkWalletStatus();
