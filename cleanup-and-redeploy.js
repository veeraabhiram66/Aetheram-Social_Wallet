const hre = require("hardhat");
const { ethers } = hre;
require('dotenv').config();

async function main() {
    console.log('🧹 Starting Fresh Deployment Cleanup...');
    
    const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
    if (!PRIVATE_KEY) {
        throw new Error('DEPLOYER_PRIVATE_KEY environment variable not set!');
    }
    
    const provider = ethers.provider;
    const deployer = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('👤 Deployer Address:', deployer.address);
    
    // Check balance
    const balance = await provider.getBalance(deployer.address);
    console.log('💰 Deployer Balance:', ethers.formatEther(balance), 'ETH');
    
    if (balance === 0n) {
        console.error('❌ Deployer has no funds! Please fund the account first.');
        return;
    }
    
    // Check nonce status
    const latestNonce = await provider.getTransactionCount(deployer.address, 'latest');
    const pendingNonce = await provider.getTransactionCount(deployer.address, 'pending');
    
    console.log('📊 Nonce Status:');
    console.log('  Latest Nonce:', latestNonce);
    console.log('  Pending Nonce:', pendingNonce);
    
    if (pendingNonce > latestNonce) {
        console.log(`⚠️  ${pendingNonce - latestNonce} transactions stuck in mempool!`);
        console.log('💡 Options:');
        console.log('  1. Wait for mempool to clear naturally');
        console.log('  2. Use higher gas price to replace stuck transactions');
        console.log('  3. Contact network operator if transactions are very old');
        
        // Try to clear with very high gas price
        const feeData = await provider.getFeeData();
        const veryHighGasPrice = feeData.gasPrice * 20n; // 20x current price
        
        console.log(`🚀 Attempting to clear with very high gas price: ${ethers.formatUnits(veryHighGasPrice, 'gwei')} gwei`);
        
        for (let i = latestNonce; i < Math.min(latestNonce + 5, pendingNonce); i++) {
            try {
                const clearTx = {
                    to: deployer.address,
                    value: 0,
                    gasLimit: 21000,
                    gasPrice: veryHighGasPrice,
                    nonce: i
                };
                
                const tx = await deployer.sendTransaction(clearTx);
                console.log(`📤 Clearing nonce ${i}: ${tx.hash}`);
                
                // Don't wait for confirmation, just send
            } catch (err) {
                console.log(`⚠️  Could not clear nonce ${i}: ${err.message}`);
            }
        }
        
        console.log('⏳ Transactions sent. Wait a few minutes and run this script again.');
        return;
    }
    
    console.log('✅ No stuck transactions. Ready for fresh deployment!');
    console.log('\n🎯 Next Steps:');
    console.log('1. Run: npx hardhat run contracts/scripts/deploy.js --network blockdag');
    console.log('2. Update contract addresses in .env file');
    console.log('3. Test the transaction flow');
}

main().catch((error) => {
    console.error('❌ Error:', error);
    process.exitCode = 1;
});
