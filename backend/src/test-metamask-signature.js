require('dotenv').config();
const { ethers } = require('ethers');
const SignatureVerifier = require('./utils/SignatureVerifier');

async function testMetaMaskSignature() {
    console.log('🔄 Testing signature verification with MetaMask exact values...');
    
    try {
        // Create a transaction that matches exactly what MetaMask shows
        const transaction = {
            to: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
            value: 0, // MetaMask shows 0
            data: '0x',
            nonce: 8 // MetaMask shows nonce 8
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
        
        console.log('🔍 MetaMask Values:');
        console.log('  To:', transaction.to);
        console.log('  Value:', transaction.value);
        console.log('  Data (original):', transaction.data);
        console.log('  Data (hashed):', hashedData);
        console.log('  Nonce:', transaction.nonce);
        console.log('  Expected data hash:', '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470');
        console.log('  Data hash matches MetaMask:', hashedData === '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470');
        
        // Print debug info for domain, struct hash, digest
        const structHash = ethers.TypedDataEncoder.hashStruct('MetaTransaction', types, message);
        const domainSeparator = ethers.TypedDataEncoder.hashDomain(domain);
        const digest = ethers.keccak256(
            ethers.solidityPacked(
                ['string', 'bytes32', 'bytes32'],
                ['\x19\x01', domainSeparator, structHash]
            )
        );
        
        console.log('\n🔐 EIP-712 Debug Info:');
        console.log('  Domain separator:', domainSeparator);
        console.log('  Struct hash:', structHash);
        console.log('  Final digest:', digest);
        
        // Sign the message using ethers
        const signature = await wallet.signTypedData(domain, types, message);
        console.log('\n📝 Generated signature:', signature);
        
        // Verify using our SignatureVerifier
        const verifier = new SignatureVerifier();
        
        const result = await verifier.verifyMetaTransaction({
            to: transaction.to,
            value: transaction.value,
            data: hashedData, // pass hashed data for verification
            nonce: transaction.nonce,
            signature: signature,
            contractAddress: domain.verifyingContract,
            chainId: domain.chainId,
            expectedSigner: wallet.address
        });
        
        console.log('\n✅ Verification result:', result.isValid ? 'PASSED' : 'FAILED');
        
        if (!result.isValid) {
            console.log('❌ Error:', result.error);
        }
        
        // Also test with ethers built-in verification
        try {
            const recoveredSigner = ethers.verifyTypedData(domain, types, message, signature);
            console.log('🔍 Ethers verification - Recovered signer:', recoveredSigner);
            console.log('🔍 Ethers verification - Expected signer:', wallet.address);
            console.log('🔍 Ethers verification - Match:', recoveredSigner.toLowerCase() === wallet.address.toLowerCase());
        } catch (ethersError) {
            console.error('❌ Ethers verification failed:', ethersError.message);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testMetaMaskSignature().then(() => {
    console.log('\n🏁 Test completed.');
}).catch(error => {
    console.error('Unhandled error:', error);
});
