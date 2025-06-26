require('dotenv').config();
const { ethers } = require('ethers');
const SignatureVerifier = require('./utils/SignatureVerifier');

async function testSignature() {
    console.log('🔄 Testing signature verification...');
    
    try {        // Create a simple test transaction
        const transaction = {
            to: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // Use properly checksummed address
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
        };        // Always hash the data for bytes32
        const hashedData = ethers.keccak256(transaction.data);
        // Create the message data
        const message = {
            to: transaction.to,
            value: transaction.value,
            data: hashedData, // hashed for bytes32
            nonce: transaction.nonce
        };
        // Print debug info for domain, struct hash, digest
        const structHash = ethers.TypedDataEncoder.hashStruct('MetaTransaction', types, message);
        const domainSeparator = ethers.TypedDataEncoder.hashDomain(domain);
        const digest = ethers.keccak256(
            ethers.solidityPacked(
                ['string', 'bytes32', 'bytes32'],
                ['\x19\x01', domainSeparator, structHash]
            )
        );
        console.log('DEBUG domain:', domain);
        console.log('DEBUG domainSeparator:', domainSeparator);
        console.log('DEBUG message:', message);
        console.log('DEBUG structHash:', structHash);
        console.log('DEBUG digest:', digest);
        
        console.log('Signing message:', message);
        
        // Sign the message using ethers
        const signature = await wallet.signTypedData(domain, types, message);
        console.log('Generated signature:', signature);
        
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
        
        console.log('Verification result:', result);
        
        if (result.isValid) {
            console.log('✅ Signature verification passed!');
        } else {
            console.log('❌ Signature verification failed!');
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
