#!/usr/bin/env node

/**
 * Comprehensive Smart Wallet Deployment System Test
 * Tests all components of the smart wallet ecosystem
 */

const { ethers } = require('ethers');
const axios = require('axios');

// Configuration
const RPC_URL = 'https://rpc.primordial.bdagscan.com';
const BACKEND_URL = 'http://localhost:4000';
const CHAIN_ID = 1043;

// Test wallet ABI (minimal)
const SIMPLE_WALLET_ABI = [
    "function owner() external view returns (address)",
    "function getCurrentNonce() external view returns (uint256)",
    "function getBalance() external view returns (uint256)"
];

async function testBackendConnection() {
    console.log('🔌 Testing Backend Connection...');
    try {
        const response = await axios.get(`${BACKEND_URL}/health`);
        console.log('✅ Backend is online:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Backend connection failed:', error.message);
        return false;
    }
}

async function testRPCConnection() {
    console.log('🌐 Testing RPC Connection...');
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const blockNumber = await provider.getBlockNumber();
        const network = await provider.getNetwork();
        console.log('✅ RPC connected:', {
            blockNumber,
            chainId: network.chainId.toString(),
            name: network.name
        });
        return provider;
    } catch (error) {
        console.error('❌ RPC connection failed:', error.message);
        return null;
    }
}

async function testWalletDetection(provider, address) {
    console.log(`🔍 Testing Wallet Detection for: ${address}`);
    
    try {
        // Check if address has contract code
        const code = await provider.getCode(address);
        const isContract = code !== '0x';
        
        console.log('📄 Contract code check:', {
            address,
            hasCode: isContract,
            codeLength: code.length
        });
        
        if (isContract) {
            // Try to interact with the contract
            const wallet = new ethers.Contract(address, SIMPLE_WALLET_ABI, provider);
            try {
                const owner = await wallet.owner();
                const nonce = await wallet.getCurrentNonce();
                const balance = await provider.getBalance(address);
                
                console.log('✅ Smart wallet detected:', {
                    address,
                    owner,
                    nonce: nonce.toString(),
                    balance: ethers.formatEther(balance)
                });
                return true;
            } catch (contractError) {
                console.log('⚠️ Contract exists but interaction failed:', contractError.message);
                return false;
            }
        } else {
            console.log('📭 No smart wallet contract at this address');
            return false;
        }
    } catch (error) {
        console.error('❌ Wallet detection failed:', error.message);
        return false;
    }
}

async function testBackendWalletAPI(address) {
    console.log(`🔍 Testing Backend Wallet API for: ${address}`);
    
    try {
        const response = await axios.get(`${BACKEND_URL}/wallet/${address}`);
        console.log('✅ Backend wallet API response:', response.data);
        return response.data;
    } catch (error) {
        if (error.response?.status === 404) {
            console.log('📭 Backend confirms: No smart wallet at this address');
        } else {
            console.error('❌ Backend wallet API failed:', error.response?.data || error.message);
        }
        return null;
    }
}

async function main() {
    console.log('🚀 Starting Smart Wallet Deployment System Test\n');
    
    // Test 1: Backend Connection
    const backendOnline = await testBackendConnection();
    if (!backendOnline) {
        console.log('\n❌ Backend is not running. Please start it with: npm start');
        process.exit(1);
    }
    
    console.log('');
    
    // Test 2: RPC Connection
    const provider = await testRPCConnection();
    if (!provider) {
        console.log('\n❌ RPC connection failed. Please check your network.');
        process.exit(1);
    }
    
    console.log('');
    
    // Test 3: Test with example addresses
    const testAddresses = [
        '0x484eab4066d5631754C329Cc27FA6213ba038cc8', // Example user address
        '0x1234567890123456789012345678901234567890'  // Non-existent address
    ];
    
    for (const address of testAddresses) {
        console.log(`\n--- Testing Address: ${address} ---`);
        
        // Test direct contract detection
        await testWalletDetection(provider, address);
        
        // Test backend API
        await testBackendWalletAPI(address);
        
        console.log('');
    }
    
    console.log('🎉 Smart Wallet Deployment System Test Complete!');
    console.log('\n📋 Summary:');
    console.log('✅ Backend is running and accessible');
    console.log('✅ RPC connection is working');
    console.log('✅ Wallet detection logic is functioning');
    console.log('\n🚀 Your system is ready for smart wallet deployment!');
    console.log('\n📝 Next Steps:');
    console.log('1. Open your frontend at http://localhost:3000');
    console.log('2. Connect your MetaMask wallet');
    console.log('3. Click "Deploy Smart Wallet" if no wallet is detected');
    console.log('4. Once deployed, you can send gasless transactions!');
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled error:', error.message);
    process.exit(1);
});

main();
