const { ethers } = require('ethers');

class SimpleNonceService {
    constructor() {
        this.provider = null;
        this.initializeProvider();
    }    async initializeProvider() {
        try {
            const networkConfig = {
                name: 'blockdag',
                chainId: 1043,
                ensAddress: null
            };
            
            // Use the same RPC URL from environment as the main BlockchainService
            const rpcUrl = process.env.BLOCKDAG_RPC_URL || 'https://rpc.primordial.bdagscan.com';
            
            this.provider = new ethers.JsonRpcProvider(
                rpcUrl, 
                networkConfig, 
                {
                    timeout: 15000, // Shorter timeout
                    staticNetwork: true
                }
            );
            
            // Test connection with timeout
            await Promise.race([
                this.provider.getBlockNumber(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Connection timeout')), 10000)
                )
            ]);
            console.log('✅ SimpleNonceService: Provider initialized');
        } catch (error) {
            console.warn('⚠️ SimpleNonceService: Failed to initialize provider:', error.message);
            // Don't fail completely, we'll try to initialize on demand
            this.provider = null;
        }
    }    async getOnChainNonce(walletAddress) {
        try {
            // Try to initialize provider if not available
            if (!this.provider) {
                await this.initializeProvider();
                // If still no provider, fall back to using the main BlockchainService pattern
                if (!this.provider) {
                    throw new Error('Provider not available');
                }
            }

            const minimalAbi = [
                "function owner() view returns (address)",
                "function nonces(address) view returns (uint256)"
            ];
            
            const walletContract = new ethers.Contract(walletAddress, minimalAbi, this.provider);
            
            // Get owner and nonce with shorter timeout
            const owner = await Promise.race([
                walletContract.owner(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
            ]);
            
            const nonce = await Promise.race([
                walletContract.nonces(owner),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
            ]);
            
            return Number(nonce);
        } catch (error) {
            console.error('❌ SimpleNonceService error:', error.message);
            throw error;
        }
    }
}

module.exports = SimpleNonceService;
