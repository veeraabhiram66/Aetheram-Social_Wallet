const { ethers } = require('ethers');

console.log('🔄 Testing signature verification...');
console.log('Ethers version:', ethers.version);

async function testSignature() {
    try {
        // Create a simple test transaction
        const transaction = {
            to: '0x742d35Cc6754C00532D5a3a2323c10f6bF3e96E8',
            value: 1000,
            data: '0x',
            nonce: 0
        };
        
        // Use a test private key (this is just for testing, not a real key)
        const testKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
        const wallet = new ethers.Wallet(testKey);
        console.log('Test wallet address:', wallet.address);
        
        // Create domain data for EIP-712 signature
        const domain = {
            name: 'SmartWallet',
            version: '1',
            chainId: 1043, // BlockDAG testnet
            verifyingContract: '0xdC10A6aCdA956363300f8a63C7CDEdc74100Fad8' // Correct deployed smart wallet
        };
        
        // Define the typed data (bytes32 for data, so hash it everywhere)
        const types = {
            MetaTransaction: [
                { name: 'to', type: 'address' },
                { name: 'value', type: 'uint256' },
                { name: 'data', type: 'bytes32' },
                { name: 'nonce', type: 'uint256' }
            ]
        };

        // Always hash the data for bytes32
        const hashedData = ethers.keccak256(transaction.data);
        // Create the message data
        const message = {
            to: transaction.to,
            value: transaction.value,
            data: hashedData, // hashed for bytes32
            nonce: transaction.nonce
        };
        
        console.log('Signing message:', message);
        
        // Sign the message using ethers
        const signature = await wallet.signTypedData(domain, types, message);
        console.log('Generated signature:', signature);
        
        // Now verify using ethers built-in method
        const recoveredAddress = ethers.verifyTypedData(domain, types, message, signature);
        console.log('Recovered address:', recoveredAddress);
        console.log('Expected address:', wallet.address);
        console.log('Match:', recoveredAddress.toLowerCase() === wallet.address.toLowerCase());
        
        if (recoveredAddress.toLowerCase() === wallet.address.toLowerCase()) {
            console.log('✅ Basic signature verification passed!');
        } else {
            console.log('❌ Basic signature verification failed!');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testSignature().then(() => {
    console.log('Test completed.');
}).catch(error => {
    console.error('Unhandled error:', error);
});
