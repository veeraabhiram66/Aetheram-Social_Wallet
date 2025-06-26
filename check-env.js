const { ethers } = require('ethers');
require('dotenv').config();

async function checkEnvironment() {
    console.log('🔍 BlockDAG Environment Check\n');
    
    // Check environment variables
    const requiredEnvVars = [
        'RPC_URL',
        'RELAYER_PRIVATE_KEY',
        'BACKEND_PORT',
        'NETWORK_NAME'
    ];
    
    console.log('📋 Environment Variables:');
    for (const envVar of requiredEnvVars) {
        const value = process.env[envVar];
        if (value) {
            if (envVar === 'RELAYER_PRIVATE_KEY') {
                console.log(`  ✅ ${envVar}: ${'*'.repeat(10)}...${value.slice(-4)}`);
            } else {
                console.log(`  ✅ ${envVar}: ${value}`);
            }
        } else {
            console.log(`  ❌ ${envVar}: Missing`);
        }
    }
    
    console.log('\n🌐 Network Connection:');
    
    try {
        // Test RPC connection
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const network = await provider.getNetwork();
        const blockNumber = await provider.getBlockNumber();
        
        console.log(`  ✅ Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
        console.log(`  ✅ Latest block: ${blockNumber}`);
        
        // Test relayer wallet
        if (process.env.RELAYER_PRIVATE_KEY) {
            const relayerWallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
            const balance = await provider.getBalance(relayerWallet.address);
            
            console.log(`  ✅ Relayer address: ${relayerWallet.address}`);
            console.log(`  ✅ Relayer balance: ${ethers.formatEther(balance)} ETH`);
            
            if (balance === 0n) {
                console.log(`  ⚠️  Warning: Relayer has no balance for gas fees`);
            }
        }
        
    } catch (error) {
        console.log(`  ❌ Network error: ${error.message}`);
    }
    
    console.log('\n🔧 Transaction Test:');
    
    try {
        // Test gas estimation
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const feeData = await provider.getFeeData();
        
        console.log(`  ✅ Gas Price: ${ethers.formatUnits(feeData.gasPrice || 0n, 'gwei')} gwei`);
        
        if (feeData.maxFeePerGas) {
            console.log(`  ✅ Max Fee Per Gas: ${ethers.formatUnits(feeData.maxFeePerGas, 'gwei')} gwei`);
            console.log(`  ✅ Max Priority Fee: ${ethers.formatUnits(feeData.maxPriorityFeePerGas || 0n, 'gwei')} gwei`);
            console.log(`  ✅ EIP-1559 supported`);
        } else {
            console.log(`  ⚠️  EIP-1559 not supported, using legacy gas pricing`);
        }
        
    } catch (error) {
        console.log(`  ❌ Gas estimation error: ${error.message}`);
    }
    
    console.log('\n🎯 Recommendations:');
    
    if (!process.env.RPC_URL) {
        console.log('  - Set RPC_URL in your .env file');
    }
    
    if (!process.env.RELAYER_PRIVATE_KEY) {
        console.log('  - Set RELAYER_PRIVATE_KEY in your .env file');
    }
    
    console.log('  - Make sure your relayer wallet has sufficient balance');
    console.log('  - Use the enhanced-server.js for best transaction handling');
    console.log('  - Check that your smart wallet contract is deployed');
    
    console.log('\n✅ Environment check complete!');
}

checkEnvironment().catch(console.error);
