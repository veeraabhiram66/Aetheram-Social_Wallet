require('dotenv').config();
const { ethers } = require('ethers');
const SignatureVerifier = require('./utils/SignatureVerifier');

async function debugDataFlow() {
    console.log('🔄 Debugging Frontend->Backend Data Flow...');
    
    try {
        // Simulate FRONTEND behavior
        console.log('\n📱 === FRONTEND SIMULATION ===');
        
        const originalTransaction = {
            to: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
            value: 0, // Use 0 like MetaMask shows
            data: '0x', // Original data
            nonce: 8 // Use nonce 8 like MetaMask shows
        };
        
        console.log('🔍 Original transaction data:');
        console.log('  To:', originalTransaction.to);
        console.log('  Value:', originalTransaction.value);
        console.log('  Data (original):', originalTransaction.data);
        console.log('  Nonce:', originalTransaction.nonce);
        
        // Frontend hashes the data for EIP-712 signature
        const hashedData = ethers.keccak256(originalTransaction.data);
        console.log('  Data (hashed for signature):', hashedData);
        
        // Create EIP-712 structure
        const domain = {
            name: 'SmartWallet',
            version: '1',
            chainId: 1043,
            verifyingContract: '0xdC10A6aCdA956363300f8a63C7CDEdc74100Fad8'
        };
        
        const types = {
            MetaTransaction: [
                { name: 'to', type: 'address' },
                { name: 'value', type: 'uint256' },
                { name: 'data', type: 'bytes32' },
                { name: 'nonce', type: 'uint256' }
            ]
        };
        
        const message = {
            to: originalTransaction.to,
            value: originalTransaction.value,
            data: hashedData, // Frontend puts HASHED data in signature
            nonce: originalTransaction.nonce
        };
        
        // Test wallet
        const testKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
        const wallet = new ethers.Wallet(testKey);
        console.log('🔑 Test wallet address:', wallet.address);
        
        // Sign with hashed data
        const signature = await wallet.signTypedData(domain, types, message);
        console.log('📝 Generated signature:', signature);
        
        // Simulate what frontend sends to backend
        const frontendRequest = {
            walletAddress: domain.verifyingContract,
            to: originalTransaction.to,
            value: originalTransaction.value,
            data: originalTransaction.data, // Frontend sends ORIGINAL data
            nonce: originalTransaction.nonce,
            signature: signature
        };
        
        console.log('\n📤 Frontend sends to backend:');
        console.log('  walletAddress:', frontendRequest.walletAddress);
        console.log('  to:', frontendRequest.to);
        console.log('  value:', frontendRequest.value);
        console.log('  data:', frontendRequest.data, '(ORIGINAL data)');
        console.log('  nonce:', frontendRequest.nonce);
        console.log('  signature:', frontendRequest.signature.slice(0, 20) + '...');
        
        // Simulate BACKEND behavior
        console.log('\n🖥️ === BACKEND SIMULATION ===');
        
        // Backend receives the request and needs to verify signature
        console.log('🔍 Backend receives data:', frontendRequest.data);
        
        // The problem: Backend needs to hash the data for signature verification
        // because the signature was created with hashed data
        const backendHashedData = ethers.keccak256(frontendRequest.data);
        console.log('🔍 Backend hashes data for verification:', backendHashedData);
        console.log('🔍 Does this match frontend hashed data?', backendHashedData === hashedData);
        
        // Now backend verifies signature with hashed data
        const verifier = new SignatureVerifier();
        
        const verificationResult = await verifier.verifyMetaTransaction({
            to: frontendRequest.to,
            value: frontendRequest.value,
            data: backendHashedData, // Use HASHED data for verification
            nonce: frontendRequest.nonce,
            signature: frontendRequest.signature,
            contractAddress: frontendRequest.walletAddress,
            chainId: domain.chainId,
            expectedSigner: wallet.address
        });
        
        console.log('\n✅ Backend verification result:', verificationResult.isValid ? 'PASSED' : 'FAILED');
        
        if (!verificationResult.isValid) {
            console.log('❌ Verification error:', verificationResult.error);
        }
        
        // Show the key insight
        console.log('\n🎯 === KEY INSIGHT ===');
        console.log('The frontend signs with HASHED data but sends ORIGINAL data to backend.');
        console.log('The backend must HASH the received data before signature verification.');
        console.log('But the backend uses ORIGINAL data for the smart contract call.');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
debugDataFlow().then(() => {
    console.log('\n🏁 Debug completed.');
}).catch(error => {
    console.error('Unhandled error:', error);
});
