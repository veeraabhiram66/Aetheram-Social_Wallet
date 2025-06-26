const { ethers } = require('ethers');

// Test script to demonstrate the backend functionality
async function testBackend() {
    const baseUrl = 'http://localhost:4000';
    
    console.log('🧪 Testing BlockDAG Smart Wallet Backend\n');

    try {
        // Test health check
        console.log('1. Testing health check...');
        const healthResponse = await fetch(`${baseUrl}/health`);
        const healthData = await healthResponse.json();
        
        if (healthData.success) {
            console.log('✅ Health check passed');
            console.log(`   - Chain ID: ${healthData.services.chainId}`);
            console.log(`   - Total transactions: ${healthData.stats.totalTransactions}`);
        } else {
            console.log('❌ Health check failed');
            return;
        }

        // Test basic API info
        console.log('\n2. Testing API info...');
        const infoResponse = await fetch(`${baseUrl}/`);
        const infoData = await infoResponse.json();
        
        if (infoData.success) {
            console.log('✅ API info retrieved');
            console.log(`   - Version: ${infoData.version}`);
            console.log(`   - Available endpoints: ${Object.keys(infoData.endpoints).length}`);
        }

        // Test wallet info (with invalid address to see validation)
        console.log('\n3. Testing wallet validation...');
        const invalidWalletResponse = await fetch(`${baseUrl}/wallet?address=invalid`);
        const invalidWalletData = await invalidWalletResponse.json();
        
        if (!invalidWalletData.success) {
            console.log('✅ Input validation working');
            console.log(`   - Error: ${invalidWalletData.error}`);
        }

        // Test relay validation (with invalid data)
        console.log('\n4. Testing relay validation...');
        const invalidRelayResponse = await fetch(`${baseUrl}/relay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: 'invalid-address',
                value: 'not-a-number',
                nonce: 'invalid'
            })
        });
        const invalidRelayData = await invalidRelayResponse.json();
        
        if (!invalidRelayData.success) {
            console.log('✅ Relay validation working');
            console.log(`   - Validation errors: ${invalidRelayData.details.length}`);
        }

        console.log('\n🎉 Backend test completed successfully!');
        console.log('\n📝 Next steps:');
        console.log('   1. Deploy smart contracts to BlockDAG testnet');
        console.log('   2. Update contract addresses in .env files');
        console.log('   3. Test meta-transaction relay with real wallet');
        console.log('   4. Connect frontend to backend');

    } catch (error) {
        console.error('❌ Backend test failed:', error.message);
        console.log('\n💡 Make sure the backend is running: npm start');
    }
}

// Helper function for fetch (Node.js doesn't have fetch by default in older versions)
if (typeof fetch === 'undefined') {
    global.fetch = require('node-fetch');
}

testBackend();
