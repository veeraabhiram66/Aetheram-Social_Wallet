const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const SuperiorNonceManager = require('./SuperiorNonceManager');

class BlockchainService {
    constructor() {
        console.log('🔄 BlockchainService constructor called');
        this.provider = null;
        this.signer = null;
        this.contracts = {};
        this.chainId = null;
        this.initialized = false;
        this.nonceManagers = new Map(); // walletAddress -> SuperiorNonceManager
        
        // Initialize asynchronously but handle errors gracefully
        this.initializePromise = this.initialize().catch(error => {
            console.error('❌ BlockchainService initialization failed:', error);
            console.error('Stack:', error.stack);
            // Don't throw here, let methods handle the uninitialized state
        });
    }

    async initialize() {
        try {            // Setup provider with multiple RPC endpoints for redundancy
            const rpcUrls = [
                process.env.BLOCKDAG_RPC_URL,
                'https://rpc.primordial.bdagscan.com' // Only use HTTPS (HTTP redirects to HTTPS)
            ].filter(Boolean);
            
            if (!rpcUrls.length) {
                throw new Error('No RPC URLs configured');
            }

            let provider = null;
            let workingUrl = null;
              // Try each RPC URL until one works
            for (const rpcUrl of rpcUrls) {
                try {
                    console.log(`🔍 Trying RPC: ${rpcUrl}`);
                    
                    // Create provider with static network configuration to avoid auto-detection issues
                    const networkConfig = {
                        name: 'blockdag',
                        chainId: 1043, // BlockDAG testnet chain ID
                        ensAddress: null
                    };                      provider = new ethers.JsonRpcProvider(rpcUrl, networkConfig, {
                        timeout: 30000, // 30 seconds timeout (increased for stability)
                        batchMaxCount: 1,
                        batchMaxSize: 1024 * 1024,
                        staticNetwork: true
                    });
                      // Test connection with a simple call (reasonable timeout)
                    const blockNumber = await Promise.race([
                        provider.getBlockNumber(),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Connection timeout')), 15000) // 15 seconds
                        )
                    ]);
                    
                    console.log(`✅ Connected to ${rpcUrl}, block: ${blockNumber}`);
                    workingUrl = rpcUrl;
                    break;
                    
                } catch (error) {
                    console.log(`⚠️ Failed to connect to ${rpcUrl}: ${error.message}`);
                    provider = null;
                }
            }
            
            if (!provider) {
                throw new Error('All RPC endpoints failed');
            }
            
            this.provider = provider;
            console.log(`✅ Using RPC: ${workingUrl}`);
            
            // Setup signer (for gas payments)
            const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
            if (privateKey) {
                this.signer = new ethers.Wallet(privateKey, this.provider);
                console.log('✅ Blockchain signer configured:', this.signer.address);
            }            // Get chain ID with improved error handling
            try {
                const network = await this.provider.getNetwork();
                this.chainId = Number(network.chainId);
                console.log('✅ Connected to chain ID:', this.chainId);
                
                // Validate that we're connected to BlockDAG network
                if (this.chainId !== 1043) {
                    console.warn(`⚠️ Warning: Expected BlockDAG chain ID 1043, but got ${this.chainId}`);
                    console.warn('⚠️ Make sure you are connected to the correct BlockDAG network');
                }
            } catch (networkError) {
                console.warn('⚠️ Could not detect network automatically:', networkError.message);
                this.chainId = 1043; // BlockDAG testnet default
                console.log('✅ Using default BlockDAG chain ID:', this.chainId);
            }// Load contract ABIs and addresses
            await this.loadContracts();
            
            this.initialized = true;
            console.log('✅ BlockchainService fully initialized');

        } catch (error) {
            console.error('❌ Failed to initialize blockchain service:', error);
            this.initialized = false;
            throw error;
        }
    }async loadContracts() {
        try {
            // Load SmartWallet ABI
            const smartWalletPath = path.join(__dirname, '../../../contracts/artifacts/contracts/SmartWallet.sol/SmartWallet.json');
            const smartWalletFactoryPath = path.join(__dirname, '../../../contracts/artifacts/contracts/SmartWalletFactory.sol/SmartWalletFactory.json');
            
            // Check if contract artifacts exist
            if (fs.existsSync(smartWalletPath)) {
                const smartWalletArtifact = JSON.parse(fs.readFileSync(smartWalletPath, 'utf8'));
                this.contracts.SmartWallet = {
                    abi: smartWalletArtifact.abi,
                    bytecode: smartWalletArtifact.bytecode
                };
                console.log('✅ SmartWallet ABI loaded');
            }

            if (fs.existsSync(smartWalletFactoryPath)) {
                const factoryArtifact = JSON.parse(fs.readFileSync(smartWalletFactoryPath, 'utf8'));
                this.contracts.SmartWalletFactory = {
                    abi: factoryArtifact.abi,
                    bytecode: factoryArtifact.bytecode
                };
                console.log('✅ SmartWalletFactory ABI loaded');
            }

            // Load deployed contract addresses from environment
            const factoryAddress = process.env.SMART_WALLET_FACTORY_ADDRESS;
            if (factoryAddress && this.contracts.SmartWalletFactory) {
                this.contracts.factoryInstance = new ethers.Contract(
                    factoryAddress,
                    this.contracts.SmartWalletFactory.abi,
                    this.provider
                );
                console.log('✅ Factory contract connected at:', factoryAddress);
            }

        } catch (error) {
            console.warn('⚠️ Contract loading failed (this is normal if contracts not deployed yet):', error.message);
        }
    }    // Get contract instance for a smart wallet
    getWalletContract(walletAddress) {
        if (!this.initialized) {
            throw new Error('BlockchainService not initialized');
        }
        
        if (!this.contracts.SmartWallet) {
            throw new Error('SmartWallet ABI not loaded');
        }

        return new ethers.Contract(
            walletAddress,
            this.contracts.SmartWallet.abi,
            this.provider
        );
    }    // Get current nonce using SimpleNonceService - RELIABLE METHOD
    async getOnChainNonce(walletAddress, retryCount = 0) {
        try {
            console.log('🎯 Getting nonce using SimpleNonceService for wallet:', walletAddress);
            
            // Use the reliable SimpleNonceService instead of complex SuperiorNonceManager
            const SimpleNonceService = require('./SimpleNonceService');
            const simpleNonceService = new SimpleNonceService();
            
            const nonce = await simpleNonceService.getOnChainNonce(walletAddress);
            console.log(`✅ Simple nonce fetched: ${nonce}`);
            
            return nonce;
        } catch (error) {
            console.error('❌ Simple nonce service failed, using intelligent fallback:', error);
            
            // Use intelligent fallback when everything fails
            return this.generateIntelligentFallbackNonce(walletAddress);
        }
    }

    // Generate intelligent fallback nonce when all other methods fail
    generateIntelligentFallbackNonce(walletAddress) {
        // Create a deterministic but random-seeming nonce based on address and time
        const addressHash = walletAddress.slice(-8); // Last 8 chars of address
        const timestamp = Date.now();
        const randomComponent = Math.floor(Math.random() * 10000);
        
        // Convert address hash to number and combine with timestamp
        const addressNum = parseInt(addressHash, 16) % 10000;
        const fallbackNonce = (timestamp % 100000) + addressNum + randomComponent;        
        console.log(`🎯 Generated intelligent fallback nonce: ${fallbackNonce} for ${walletAddress}`);
        return fallbackNonce;    }

    // Execute meta-transaction on blockchain with simple nonce management
    async executeMetaTransaction(params) {
        if (!this.signer) {
            throw new Error('No signer configured for transaction execution');
        }

        const { walletAddress, to, value, data, nonce: receivedNonce, signature } = params;
        // Contract will hash data internally, use original data
        
        // Get nonce using simple, reliable method - use the received nonce if provided
        let nonce = receivedNonce;
        if (typeof nonce === 'undefined') {
            try {
                nonce = await this.getOnChainNonce(walletAddress);
                console.log(`🎯 Fetched on-chain nonce ${nonce} for transaction`);
            } catch (error) {
                return {
                    success: false,
                    error: 'Failed to get optimal nonce',
                    details: error.message
                };
            }
        } else {
            console.log(`🎯 Using provided nonce ${nonce} for transaction`);
        }
        
        let lastError;
        let retries = 3;
        let receipt;
        let gasPrice; // Initialize gas price variable

        while (retries > 0) {
            try {
                // CRITICAL: Re-fetch nonce just before execution for maximum accuracy
                const preExecutionNonce = await this.getOnChainNonce(walletAddress);
                if (preExecutionNonce !== nonce) {
                    console.log(`⚠️ Nonce changed during processing! Expected: ${nonce}, Current: ${preExecutionNonce}`);
                    nonce = preExecutionNonce;
                    console.log(`🔄 Updated to latest nonce: ${nonce}`);
                }
                
                const walletContract = new ethers.Contract(
                    walletAddress,
                    this.contracts.SmartWallet.abi,
                    this.signer
                );
                
                // Estimate gas with timeout
                console.log('🔍 Estimating gas...');
                const gasEstimate = await Promise.race([
                    walletContract.executeMetaTransaction.estimateGas(
                        to, value, data, nonce, signature // use original data
                    ),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Gas estimation timeout')), 45000)
                    )
                ]);

                // Add 20% buffer to gas estimate
                const gasLimit = Math.ceil(Number(gasEstimate) * 1.2);

                // Get current gas price with timeout (or use bumped price from retry)
                if (!gasPrice) {
                    console.log('🔍 Getting gas price...');
                    const feeData = await Promise.race([
                        this.provider.getFeeData(),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Fee data timeout')), 30000)
                        )
                    ]);
                    gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
                }

                // Execute transaction with timeout
                console.log(`🔍 Executing transaction with nonce ${nonce}...`);
                console.log('🔍 Transaction details:', {
                    to: to,
                    value: value,
                    data: data, // use original data
                    nonce: nonce,
                    signatureLength: signature ? signature.length : 0,
                    gasPrice: ethers.formatUnits(gasPrice, 'gwei') + ' gwei'
                });
                
                const tx = await Promise.race([
                    walletContract.executeMetaTransaction(
                        to, value, data, nonce, signature, // use original data
                        { gasLimit, gasPrice }
                    ),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Transaction execution timeout')), 60000)
                    )
                ]);
                
                console.log('📤 Meta-transaction submitted:', tx.hash);
                
                // Wait for confirmation with timeout
                console.log('🔍 Waiting for confirmation...');
                receipt = await Promise.race([
                    tx.wait(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Transaction confirmation timeout')), 120000)
                    )
                ]);

                // Calculate gas savings
                const gasUsed = Number(receipt.gasUsed);
                const gasCost = gasUsed * Number(gasPrice);
                const gasSavedEth = ethers.formatEther(gasCost.toString());

                console.log(`🎉 Transaction successful with nonce ${nonce}`);
                
                // If we got here, transaction was successful
                return {
                    success: true,
                    txHash: receipt.hash,
                    gasUsed,
                    gasPrice: gasPrice.toString(),
                    gasSaved: parseFloat(gasSavedEth),
                    blockNumber: receipt.blockNumber,
                    confirmations: receipt.confirmations,
                    nonceUsed: nonce
                };
                
            } catch (error) {
                lastError = error;
                retries--;
                
                console.log(`⚠️ Transaction attempt failed (${3 - retries}/3):`, error.message);
                
                // Enhanced retry logic with gas price bumping
                if (error.message.includes('nonce') || 
                    error.message.includes('replacement') || 
                    error.message.includes('underpriced')) {
                    try {
                        // Get fresh nonce for retry
                        nonce = await this.getOnChainNonce(walletAddress);
                        console.log(`🔄 Got fresh nonce ${nonce} for retry`);
                        
                        // Increase gas price by 20% for retry to avoid "underpriced" errors
                        const currentGasPrice = gasPrice || ethers.parseUnits('20', 'gwei');
                        gasPrice = currentGasPrice * 120n / 100n; // 20% increase
                        console.log(`⛽ Bumped gas price for retry: ${ethers.formatUnits(gasPrice, 'gwei')} gwei`);
                        
                    } catch (nonceError) {
                        console.error('❌ Failed to get fresh nonce for retry:', nonceError);
                    }
                }
                
                if (error.message.includes('timeout') || 
                    error.message.includes('ETIMEDOUT') || 
                    error.code === 'TIMEOUT' ||
                    error.code === 'NETWORK_ERROR') {
                    
                    if (retries > 0) {
                        console.log(`🔄 Network error, retrying with same nonce...`);
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        continue;
                    }
                }
                
                // Non-retryable errors - break immediately
                if (error.message.includes('insufficient funds') || 
                    error.message.includes('Invalid signature')) {
                    break;
                }
            }
        }

        console.error('❌ Meta-transaction execution failed after retries:', lastError);
        
        let errorMessage = 'Transaction execution failed';
        if (lastError.message.includes('Invalid signature')) {
            errorMessage = 'Invalid signature';
        } else if (lastError.message.includes('Invalid nonce')) {
            errorMessage = 'Nonce conflict - please try again';
        } else if (lastError.message.includes('replacement') || lastError.message.includes('underpriced')) {
            errorMessage = 'Gas price too low - please try again';
        } else if (lastError.message.includes('insufficient funds')) {
            errorMessage = 'Insufficient gas funds in relayer';
        } else if (lastError.message.includes('timeout') || lastError.message.includes('ETIMEDOUT')) {
            errorMessage = 'Network timeout - please try again';
        }

        return {
            success: false,
            error: errorMessage,
            details: lastError.message,
            nonceAttempted: nonce
        };
    }

    // Get wallet information with robust timeout handling
    async getWalletInfo(walletAddress) {
        try {
            console.log('🔍 Getting wallet info for:', walletAddress);
            
            // First check if this is a contract or EOA with shorter timeout
            const code = await Promise.race([
                this.provider.getCode(walletAddress),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout getting contract code')), 5000) // Reduced timeout
                )
            ]);
            
            console.log('🔍 Contract code length:', code.length, code === '0x' ? '(EOA)' : '(Contract)');
            
            if (code === '0x' || code.length <= 2) {
                // This is an EOA (Externally Owned Account), not a smart contract
                return {
                    address: walletAddress,
                    owner: walletAddress, // EOA owns itself
                    guardianCount: 0,
                    requiredApprovals: 0,
                    chainId: this.chainId,
                    isEOA: true,
                    note: 'This is an Externally Owned Account. Deploy a smart wallet to use advanced features.'
                };
            }

            // This is a contract, try to get smart wallet info with short timeout
            console.log('🔍 Getting smart wallet contract info...');
            
            try {
                // Try with a very short timeout first - if it fails, we'll return fallback info
                const walletContract = this.getWalletContract(walletAddress);
                
                const [owner, guardianCount, requiredApprovals] = await Promise.race([
                    Promise.all([
                        walletContract.owner().catch(() => null),
                        walletContract.getGuardianCount().catch(() => 0),
                        walletContract.requiredApprovals().catch(() => 0)
                    ]),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Timeout getting wallet contract info')), 3000) // Very short timeout
                    )
                ]);

                if (!owner) {
                    console.warn('⚠️ Contract does not implement expected smart wallet interface');
                    return {
                        address: walletAddress,
                        owner: null,
                        guardianCount: 0,
                        requiredApprovals: 0,
                        chainId: this.chainId,
                        isEOA: false,
                        note: 'Contract found but does not implement smart wallet interface'
                    };
                }

                console.log('✅ Smart wallet info retrieved - Owner:', owner, 'Guardians:', Number(guardianCount));

                return {
                    address: walletAddress,
                    owner,
                    guardianCount: Number(guardianCount),
                    requiredApprovals: Number(requiredApprovals),
                    chainId: this.chainId,
                    isEOA: false
                };
                
            } catch (contractError) {
                console.warn('⚠️ Contract call failed (likely network timeout):', contractError.message);
                
                // Return safe fallback info for contracts that timeout
                return {
                    address: walletAddress,
                    owner: null,
                    guardianCount: 0,
                    requiredApprovals: 0,
                    chainId: this.chainId,
                    isEOA: false,
                    note: 'Smart wallet contract detected but network timeout prevented reading details. The contract exists but may be slow to respond.'
                };
            }

        } catch (error) {
            console.error('❌ Failed to get wallet info:', error);
            
            if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
                // Return a helpful error for timeout cases
                throw new Error('Network timeout while fetching wallet info. The BlockDAG network may be experiencing delays. Please try again in a moment.');
            }
            
            throw new Error(`Unable to read wallet data: ${error.message}`);
        }
    }    // Get smart wallets owned by an EOA address
    async getUserWallets(ownerAddress) {
        try {
            console.log('🔍 Getting wallets for owner:', ownerAddress);
            
            // Validate input
            if (!ownerAddress || !ethers.isAddress(ownerAddress)) {
                throw new Error('Invalid owner address provided');
            }
            
            await this.ensureInitialized();
            
            // Load factory contract
            const factoryAddress = process.env.SMART_WALLET_FACTORY_ADDRESS;
            if (!factoryAddress) {
                console.warn('⚠️ Factory address not configured - cannot retrieve user wallets');
                return [];
            }
            
            if (!ethers.isAddress(factoryAddress)) {
                throw new Error('Invalid factory address in environment configuration');
            }
            
            // Load factory ABI with better error handling
            const factoryAbiPath = path.join(__dirname, '../../../contracts/artifacts/contracts/SmartWalletFactory.sol/SmartWalletFactory.json');
            if (!fs.existsSync(factoryAbiPath)) {
                console.warn('⚠️ Factory ABI not found - contracts may not be compiled yet');
                console.warn('💡 Run "npm run compile" in the contracts directory');
                return [];
            }
            
            let factoryArtifact;
            try {
                factoryArtifact = JSON.parse(fs.readFileSync(factoryAbiPath, 'utf8'));
                if (!factoryArtifact.abi) {
                    throw new Error('ABI missing from factory artifact');
                }
            } catch (parseError) {
                throw new Error(`Failed to parse factory ABI: ${parseError.message}`);
            }
            
            const factoryContract = new ethers.Contract(factoryAddress, factoryArtifact.abi, this.provider);
            
            // Query userWallets mapping with timeout and error handling
            try {
                console.log('🔍 Querying factory contract for user wallets...');
                
                // Try to get the wallets with timeout
                const wallets = await Promise.race([
                    factoryContract.userWallets(ownerAddress, 0),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Factory query timeout')), 10000)
                    )
                ]);
                
                if (wallets && wallets !== ethers.ZeroAddress) {
                    console.log('✅ Found wallet:', wallets);
                    return [wallets];
                } else {
                    console.log('🔍 No wallets found for this owner');
                    return [];
                }
            } catch (queryError) {
                console.log('🔍 No wallets found or error querying factory:', queryError.message);
                
                // Check if it's a network/timeout error vs no wallets found
                if (queryError.message.includes('timeout') || queryError.message.includes('network')) {
                    console.warn('⚠️ Network timeout while querying factory - try again later');
                }
                
                return [];
            }
            
        } catch (error) {
            console.error('❌ Error getting user wallets:', error.message);
            
            // Don't throw for non-critical errors - return empty array instead
            if (error.message.includes('Invalid') || error.message.includes('not configured')) {
                throw error; // Re-throw validation errors
            }
            
            console.warn('⚠️ Returning empty wallet list due to error');
            return [];
        }
    }// Get account balance
    async getBalance(address) {
        try {
            // Defensive: Ensure provider is initialized
            await this.ensureInitialized();
            if (!this.provider) {
                throw new Error('Blockchain provider not initialized. Please check your RPC settings.');
            }
            // Add shorter timeout for balance calls
            const balance = await Promise.race([
                this.provider.getBalance(address),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Balance fetch timeout')), 8000)
                )
            ]);
            return {
                wei: balance.toString(),
                eth: ethers.formatEther(balance)
            };
        } catch (error) {
            console.error('Failed to get balance:', error.message);
            // Return user-friendly error if provider is not initialized
            if (error.message && error.message.includes('provider not initialized')) {
                throw new Error('Blockchain provider is not available. Please check your network connection or RPC settings.');
            }
            // Return default balance instead of failing completely
            return { wei: '0', eth: '0.0' };
        }
    }

    // Verify contract deployment
    async verifyContract(address) {
        try {
            const code = await this.provider.getCode(address);
            return code !== '0x';
        } catch (error) {
            return false;
        }
    }

    // Get transaction status
    async getTransactionStatus(txHash) {
        try {
            const tx = await this.provider.getTransaction(txHash);
            if (!tx) {
                return { status: 'not_found' };
            }

            const receipt = await this.provider.getTransactionReceipt(txHash);
            if (!receipt) {
                return { status: 'pending', transaction: tx };
            }

            return {
                status: receipt.status === 1 ? 'confirmed' : 'failed',
                transaction: tx,
                receipt: receipt,
                gasUsed: Number(receipt.gasUsed),
                blockNumber: receipt.blockNumber
            };

        } catch (error) {
            console.error('Failed to get transaction status:', error);
            return { status: 'error', error: error.message };
        }
    }

    // Utility: Check if address is a contract
    async isContract(address) {
        try {
            const code = await this.provider.getCode(address);
            return code !== '0x';
        } catch (error) {
            return false;
        }
    }

    // Ensure the service is initialized before use
    async ensureInitialized() {
        if (!this.initialized) {
            await this.initializePromise;
            if (!this.initialized) {
                throw new Error('BlockchainService failed to initialize');
            }
        }
    }

    // Get or create superior nonce manager for wallet
    getNonceManager(walletAddress) {
        if (!this.nonceManagers.has(walletAddress)) {
            const manager = new SuperiorNonceManager(this.provider, walletAddress);
            this.nonceManagers.set(walletAddress, manager);
            console.log(`🎯 Created superior nonce manager for wallet: ${walletAddress}`);
        }
        return this.nonceManagers.get(walletAddress);
    }
}

module.exports = BlockchainService;
