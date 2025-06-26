/**
 * EIP-712 Signature Testing and Debugging Utility
 * Helps validate signature generation and verification
 */

const { ethers } = require('ethers');

class SignatureTestHelper {
    constructor() {
        this.DOMAIN_NAME = 'SmartWallet';
        this.DOMAIN_VERSION = '1';
        this.META_TX_TYPEHASH = ethers.keccak256(
            ethers.toUtf8Bytes("MetaTransaction(address to,uint256 value,bytes32 data,uint256 nonce)")
        );
    }

    /**
     * Generate EIP-712 domain separator
     */
    getDomainSeparator(chainId, contractAddress) {
        return ethers.keccak256(
            ethers.AbiCoder.defaultAbiCoder().encode(
                ["bytes32", "bytes32", "bytes32", "uint256", "address"],
                [
                    ethers.keccak256(ethers.toUtf8Bytes("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")),
                    ethers.keccak256(ethers.toUtf8Bytes(this.DOMAIN_NAME)),
                    ethers.keccak256(ethers.toUtf8Bytes(this.DOMAIN_VERSION)),
                    chainId,
                    contractAddress
                ]
            )
        );
    }

    /**
     * Generate typed data hash for meta-transaction
     */
    getTypedDataHash(chainId, contractAddress, to, value, data, nonce) {
        const domainSeparator = this.getDomainSeparator(chainId, contractAddress);
        
        const structHash = ethers.keccak256(
            ethers.AbiCoder.defaultAbiCoder().encode(
                ["bytes32", "address", "uint256", "bytes32", "uint256"],
                [
                    this.META_TX_TYPEHASH,
                    to,
                    value,
                    ethers.keccak256(data || "0x"),
                    nonce
                ]
            )
        );

        return ethers.keccak256(
            ethers.solidityPacked(
                ["string", "bytes32", "bytes32"],
                ["\x19\x01", domainSeparator, structHash]
            )
        );
    }

    /**
     * Test signature generation and verification
     */
    async testSignature(signer, contractAddress, to, value, data, nonce) {
        console.log('\n🧪 Testing EIP-712 Signature...');
        console.log('=====================================');

        try {
            const chainId = 1043; // BlockDAG testnet

            // 1. Generate domain and types
            const domain = {
                name: this.DOMAIN_NAME,
                version: this.DOMAIN_VERSION,
                chainId: chainId,
                verifyingContract: contractAddress
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
                to: to,
                value: value,
                data: ethers.keccak256(data || '0x'),
                nonce: nonce
            };

            console.log('📋 Domain:', JSON.stringify(domain, null, 2));
            console.log('📋 Types:', JSON.stringify(types, null, 2));
            console.log('📋 Message:', JSON.stringify(message, null, 2));

            // 2. Sign with ethers
            const signature = await signer.signTypedData(domain, types, message);
            console.log('✅ Signature:', signature);

            // 3. Verify with ethers
            const recoveredSigner = ethers.verifyTypedData(domain, types, message, signature);
            const expectedSigner = await signer.getAddress();
            
            console.log('🔍 Verification:');
            console.log('  Expected:', expectedSigner);
            console.log('  Recovered:', recoveredSigner);
            console.log('  Match:', recoveredSigner.toLowerCase() === expectedSigner.toLowerCase());

            // 4. Generate manual hash for comparison
            const manualHash = this.getTypedDataHash(chainId, contractAddress, to, value, data, nonce);
            console.log('🔗 Manual hash:', manualHash);

            // 5. Verify manual hash
            const manualRecovered = ethers.recoverAddress(manualHash, signature);
            console.log('🔍 Manual verification:');
            console.log('  Recovered:', manualRecovered);
            console.log('  Match:', manualRecovered.toLowerCase() === expectedSigner.toLowerCase());

            return {
                success: true,
                signature,
                domain,
                types,
                message,
                hash: manualHash,
                signer: expectedSigner,
                recovered: recoveredSigner,
                valid: recoveredSigner.toLowerCase() === expectedSigner.toLowerCase()
            };

        } catch (error) {
            console.error('❌ Signature test failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Validate signature format
     */
    validateSignatureFormat(signature) {
        if (!signature) return { valid: false, error: 'Signature is empty' };
        if (!signature.startsWith('0x')) return { valid: false, error: 'Signature must start with 0x' };
        if (signature.length !== 132) return { valid: false, error: `Signature must be 132 characters, got ${signature.length}` };
        
        const hex = signature.slice(2);
        if (!/^[0-9a-fA-F]+$/.test(hex)) return { valid: false, error: 'Signature contains invalid characters' };

        return { valid: true };
    }

    /**
     * Extract signature components (r, s, v)
     */
    parseSignature(signature) {
        if (!signature || signature.length !== 132) {
            throw new Error('Invalid signature format');
        }

        const hex = signature.slice(2);
        const r = '0x' + hex.slice(0, 64);
        const s = '0x' + hex.slice(64, 128);
        const v = parseInt(hex.slice(128, 130), 16);

        return { r, s, v };
    }
}

module.exports = SignatureTestHelper;

// Example usage:
if (require.main === module) {
    async function runTest() {
        const testHelper = new SignatureTestHelper();
        
        // Example test parameters
        const contractAddress = '0x27993E3CD61cAf01A583c9c02201bf4988481193';
        const to = '0x742d35Cc6754C00532D5a3a2323c10f6bF3e96E8';
        const value = ethers.parseEther('0.1');
        const data = '0x';
        const nonce = 5;

        // Note: In real usage, you'd pass an actual signer
        console.log('📝 Signature Test Helper loaded');
        console.log('💡 Use: testHelper.testSignature(signer, contractAddress, to, value, data, nonce)');
    }

    runTest();
}
