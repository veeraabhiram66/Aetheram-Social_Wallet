const { ethers } = require('ethers');
require('dotenv').config();

async function testTransactionFlow() {
    console.log('🧪 Testing Transaction Flow...\n');
    
    try {
        // Initialize provider and relayer
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const relayerWallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
        
        console.log('🔑 Relayer Address:', relayerWallet.address);
        
        // Check relayer balance
        const balance = await provider.getBalance(relayerWallet.address);
        console.log('💰 Relayer Balance:', ethers.formatEther(balance), 'ETH');
        
        if (balance === 0n) {
            console.log('❌ Relayer has no balance! Please fund the relayer wallet.');
            return;
        }
        
        // Test gas estimation
        const feeData = await provider.getFeeData();
        console.log('⛽ Gas Data:');
        console.log('  Gas Price:', ethers.formatUnits(feeData.gasPrice || 0n, 'gwei'), 'gwei');
        
        if (feeData.maxFeePerGas) {
            console.log('  Max Fee Per Gas:', ethers.formatUnits(feeData.maxFeePerGas, 'gwei'), 'gwei');
            console.log('  Max Priority Fee:', ethers.formatUnits(feeData.maxPriorityFeePerGas || 0n, 'gwei'), 'gwei');
            console.log('  ✅ EIP-1559 supported');
        } else {
            console.log('  ⚠️  Using legacy gas pricing');
        }
        
        // Test smart wallet interaction
        const walletAddress = '0xb835529AE2c7eA969bcf6b21209921CfbC96A8c4'; // Newly deployed wallet
        const walletABI = [
            "function getCurrentNonce() external view returns (uint256)",
            "function owner() external view returns (address)"
        ];
        
        try {
            const wallet = new ethers.Contract(walletAddress, walletABI, provider);
            const nonce = await wallet.getCurrentNonce();
            const owner = await wallet.owner();
            
            console.log('🏦 Smart Wallet Info:');
            console.log('  Address:', walletAddress);
            console.log('  Owner:', owner);
            console.log('  Current Nonce:', nonce.toString());
            console.log('  ✅ Smart wallet is accessible');
            
        } catch (error) {
            console.log('❌ Smart wallet error:', error.message);
            console.log('  - Check if the contract is deployed');
            console.log('  - Verify the contract address');
        }
        
        console.log('\n✅ Transaction flow test complete!');
        console.log('\n🚀 Ready to start the application:');
        console.log('  1. Run: node src/enhanced-server.js (in backend folder)');
        console.log('  2. Run: npm start (in frontend folder)');
        
    } catch (error) {
        console.log('❌ Test failed:', error.message);
    }
}

testTransactionFlow();
