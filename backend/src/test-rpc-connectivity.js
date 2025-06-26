const { ethers } = require('ethers');

async function testRPCConnectivity() {
    console.log('🔄 Testing RPC connectivity...');
    
    const rpcUrls = [
        'https://rpc.primordial.bdagscan.com',
        'http://rpc.primordial.bdagscan.com',
        'https://rpc-testnet.blockdag.network',
        'http://rpc-testnet.blockdag.network'
    ];
    
    for (const rpcUrl of rpcUrls) {
        console.log(`\n🔍 Testing: ${rpcUrl}`);
        
        try {
            // Test with shorter timeout first
            const provider = new ethers.JsonRpcProvider(rpcUrl, {
                name: 'blockdag',
                chainId: 1043,
                ensAddress: null
            }, {
                timeout: 5000,
                staticNetwork: true
            });
            
            // Test basic connectivity
            const blockNumberPromise = provider.getBlockNumber();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout after 5 seconds')), 5000)
            );
            
            const blockNumber = await Promise.race([blockNumberPromise, timeoutPromise]);
            console.log(`✅ Success! Block number: ${blockNumber}`);
            
            // Test network details
            const network = await provider.getNetwork();
            console.log(`📡 Network: ${network.name}, Chain ID: ${network.chainId}`);
            
            // Test a sample address balance
            const balance = await provider.getBalance('0x484eab4066d5631754c329cc27fa6213ba038cc8');
            console.log(`💰 Sample balance: ${ethers.formatEther(balance)} BDAG`);
            
            console.log(`🎯 ${rpcUrl} is working properly!`);
            return rpcUrl; // Return first working URL
            
        } catch (error) {
            console.log(`❌ Failed: ${error.message}`);
        }
    }
    
    console.log('\n❌ All RPC endpoints failed!');
    return null;
}

// Test with manual URLs
async function testManualRPC() {
    console.log('\n🔧 Testing manual RPC configurations...');
    
    // Test different configurations
    const configs = [
        {
            url: 'https://rpc.primordial.bdagscan.com',
            timeout: 10000,
            description: 'HTTPS with 10s timeout'
        },
        {
            url: 'http://rpc.primordial.bdagscan.com',
            timeout: 10000,
            description: 'HTTP with 10s timeout'
        }
    ];
    
    for (const config of configs) {
        console.log(`\n🧪 Testing: ${config.description}`);
        console.log(`   URL: ${config.url}`);
        
        try {
            const provider = new ethers.JsonRpcProvider(config.url, undefined, {
                timeout: config.timeout
            });
            
            // Simple call
            const result = await provider.send('eth_blockNumber', []);
            console.log(`✅ Raw eth_blockNumber: ${result}`);
            console.log(`✅ Block number: ${parseInt(result, 16)}`);
            
        } catch (error) {
            console.log(`❌ Failed: ${error.message}`);
            if (error.code) console.log(`   Error code: ${error.code}`);
            if (error.info) console.log(`   Error info:`, error.info);
        }
    }
}

async function main() {
    try {
        await testRPCConnectivity();
        await testManualRPC();
    } catch (error) {
        console.error('Test failed:', error);
    }
}

main();
