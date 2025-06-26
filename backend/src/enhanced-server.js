/**
 * Enhanced Backend Server for Meta-Transaction Relayer
 * Comprehensive API for the ideal transaction system architecture
 */

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { ethers } = require('ethers');
require('dotenv').config({ path: "../.env" });

const app = express();
const PORT = process.env.BACKEND_PORT || 4000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(limiter);

// Initialize provider and relayer wallet
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const relayerWallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);

console.log('🔑 Relayer address:', relayerWallet.address);

// Smart Wallet ABI (comprehensive)
const WALLET_ABI = [
    "function execute(address to, uint256 value, bytes calldata data) external returns (bool)",
    "function executeMetaTransaction(address to, uint256 value, bytes calldata data, uint256 nonce, bytes calldata signature) external returns (bool)",
    "function getCurrentNonce() external view returns (uint256)",
    "function getBalance() external view returns (uint256)",
    "function owner() external view returns (address)",
    "function isValidSignature(bytes32 hash, bytes calldata signature) external view returns (bytes4)",
    "event MetaTransactionExecuted(address indexed from, address indexed to, uint256 value, bytes data, uint256 nonce, bytes32 txHash)"
];

// EIP-712 Domain and Types
const createDomain = (verifyingContract, chainId) => ({
  name: 'SmartWallet',
  version: '1',
  chainId: chainId,
  verifyingContract: verifyingContract,
});

const META_TRANSACTION_TYPES = {
  MetaTransaction: [
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'data', type: 'bytes32' },
    { name: 'nonce', type: 'uint256' },
  ],
};

// Utilities
const formatError = (message, details = null) => ({
  success: false,
  error: message,
  details,
  timestamp: new Date().toISOString()
});

const formatSuccess = (data, message = 'Success') => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString()
});

// Verify EIP-712 signature
const verifyMetaTransactionSignature = (signature, walletAddress, to, value, data, nonce, expectedSigner, chainId) => {
  try {
    const domain = createDomain(walletAddress, chainId);
    
    // Hash the data for bytes32 type (same as frontend)
    const hashedData = ethers.keccak256(data || '0x');
    
    const message = {
      to: to,
      value: value.toString(),
      data: hashedData, // Use hashed data for verification
      nonce: nonce.toString(),
    };

    console.log('🔍 Backend signature verification:', {
      domain,
      message,
      signature,
      expectedSigner
    });

    const recoveredAddress = ethers.verifyTypedData(domain, META_TRANSACTION_TYPES, message, signature);
    const isValid = recoveredAddress.toLowerCase() === expectedSigner.toLowerCase();

    console.log('🔍 Verification result:', {
      recoveredAddress,
      expectedSigner,
      isValid
    });

    return {
      success: true,
      isValid,
      recoveredAddress,
      expectedSigner,
    };
  } catch (error) {
    console.error('❌ Signature verification failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Routes

// Health check with comprehensive status
app.get('/health', async (req, res) => {
  try {
    const blockNumber = await provider.getBlockNumber();
    const relayerBalance = await provider.getBalance(relayerWallet.address);
    const gasPrice = await provider.getFeeData();
    
    res.json(formatSuccess({
      status: 'healthy',
      network: process.env.NETWORK_NAME || 'unknown',
      blockNumber,
      relayerAddress: relayerWallet.address,
      relayerBalance: ethers.formatEther(relayerBalance),
      gasPrice: {
        maxFeePerGas: gasPrice.maxFeePerGas ? ethers.formatUnits(gasPrice.maxFeePerGas, 'gwei') : null,
        maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas ? ethers.formatUnits(gasPrice.maxPriorityFeePerGas, 'gwei') : null,
      },
      uptime: process.uptime(),
    }));
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json(formatError('Backend unhealthy', error.message));
  }
});

// Get wallet info with enhanced data
app.get('/wallet/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    console.log('🔍 Wallet info request for address:', address);
    
    if (!ethers.isAddress(address)) {
      console.log('❌ Invalid address format:', address);
      return res.status(400).json(formatError('Invalid wallet address'));
    }

    // Try to detect if this is a smart wallet by checking if it has code
    const contractCode = await provider.getCode(address);
    const isSmartWallet = contractCode !== '0x';
    
    console.log('🔍 Code check for', address, '- Is smart wallet:', isSmartWallet, 'Code length:', contractCode.length);
    
    if (!isSmartWallet) {
      console.log('❌ No smart wallet deployed at address:', address);
      return res.status(404).json(formatError('No smart wallet contract found at this address'));
    }

    // Try to interact with the smart wallet contract
    const wallet = new ethers.Contract(address, WALLET_ABI, provider);
    
    try {
      // Test contract functions
      const owner = await wallet.owner();
      const nonce = await wallet.getCurrentNonce();
      const contractBalance = await provider.getBalance(address);
      
      console.log('✅ Smart wallet found:', {
        address,
        owner,
        nonce: nonce.toString(),
        balance: ethers.formatEther(contractBalance)
      });
      
      const walletResponse = {
        wallet: {
          address: address,
          owner: owner,
          nonce: nonce.toString(),
          balance: ethers.formatEther(contractBalance),
          isDeployed: true,
          codeSize: contractCode.length
        }
      };
      
      console.log('🔧 Returning wallet response:', JSON.stringify(walletResponse, null, 2));
      return res.json(formatSuccess(walletResponse));
      
    } catch (contractError) {
      console.error('❌ Error interacting with smart wallet contract:', contractError);
      return res.status(500).json(formatError('Smart wallet contract interaction failed', contractError.message));
    }
    
  } catch (error) {
    console.error('❌ Error getting wallet info:', error);
    res.status(500).json(formatError('Failed to get wallet info', error.message));
  }
});

// Get current nonce with source tracking
app.get('/wallet/:address/nonce', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!ethers.isAddress(address)) {
      return res.status(400).json(formatError('Invalid wallet address'));
    }
    
    // Check if this is a smart wallet contract
    const contractCode = await provider.getCode(address);
    const isSmartWallet = contractCode !== '0x';
    
    if (!isSmartWallet) {
      console.log('❌ No smart wallet deployed at address:', address);
      return res.status(404).json(formatError('No smart wallet contract found at this address'));
    }

    const wallet = new ethers.Contract(address, WALLET_ABI, provider);
    
    try {
      // Try to get nonce from smart wallet contract
      const contractNonce = await wallet.getCurrentNonce();
      console.log('🔢 NONCE REQUEST - Contract nonce for', address, ':', contractNonce.toString());
      
      res.json(formatSuccess({
        data: {
          nonce: parseInt(contractNonce.toString()),
          source: 'smart_wallet_contract'
        }
      }));
    } catch (contractError) {
      console.log('🔢 NONCE REQUEST - Contract nonce failed, using provider fallback for', address);
      console.error('Contract error:', contractError.message);
      // Fallback to provider nonce
      const providerNonce = await provider.getTransactionCount(address, 'pending');
      console.log('🔢 NONCE REQUEST - Provider fallback nonce for', address, ':', providerNonce);
      
      res.json(formatSuccess({
        data: {
          nonce: providerNonce,
          source: 'provider_fallback'
        }
      }));
    }
    
  } catch (error) {
    console.error('Error getting nonce:', error);
    res.status(500).json(formatError('Failed to get nonce', error.message));
  }
});

// Estimate gas for transaction
app.post('/estimate-gas', async (req, res) => {
  try {
    const { walletAddress, to, value, data } = req.body;
    
    if (!ethers.isAddress(walletAddress) || !ethers.isAddress(to)) {
      return res.status(400).json(formatError('Invalid address format'));
    }
    
    const wallet = new ethers.Contract(walletAddress, WALLET_ABI, relayerWallet);
    
    const gasEstimate = await wallet.execute.estimateGas(
      to,
      value || '0',
      data || '0x'
    );
    
    const feeData = await provider.getFeeData();
    
    res.json(formatSuccess({
      gasLimit: gasEstimate.toString(),
      gasPrice: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : null,
      maxFeePerGas: feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei') : null,
      estimatedCost: feeData.gasPrice ? ethers.formatEther(gasEstimate * feeData.gasPrice) : null
    }));
    
  } catch (error) {
    console.error('Gas estimation failed:', error);
    res.status(500).json(formatError('Gas estimation failed', error.message));
  }
});

// Relay meta-transaction
app.post('/relay', async (req, res) => {
  try {
    const { walletAddress, to, value, data, nonce, signature } = req.body;
    
    console.log('🔢 RELAY REQUEST - Received nonce from frontend:', nonce);
    
    // Validation
    if (!ethers.isAddress(walletAddress) || !ethers.isAddress(to)) {
      return res.status(400).json(formatError('Invalid address format'));
    }
    
    if (!signature || signature.length !== 132) {
      return res.status(400).json(formatError('Invalid signature format'));
    }
    
    const wallet = new ethers.Contract(walletAddress, WALLET_ABI, relayerWallet);
    
    // Get wallet owner and current nonce for verification
    const owner = await wallet.owner();
    const chainId = (await provider.getNetwork()).chainId;
    
    // CRITICAL: Check current nonce on-chain before executing
    let currentContractNonce;
    try {
      currentContractNonce = await wallet.getCurrentNonce();
      console.log('🔢 CURRENT CONTRACT NONCE:', currentContractNonce.toString());
      console.log('🔢 FRONTEND SENT NONCE:', nonce);
      console.log('🔢 NONCE MATCH:', currentContractNonce.toString() === nonce.toString());
      
      if (currentContractNonce.toString() !== nonce.toString()) {
        console.log('❌ NONCE MISMATCH DETECTED!');
        return res.status(400).json(formatError(
          'Nonce mismatch',
          {
            expected: currentContractNonce.toString(),
            received: nonce,
            message: `Contract expects nonce ${currentContractNonce.toString()}, but received ${nonce}. Please refresh and try again.`
          }
        ));
      }
    } catch (nonceError) {
      console.log('🔢 Could not get contract nonce, using provider nonce for mock wallet');
      const providerNonce = await provider.getTransactionCount(relayerWallet.address, 'pending');
      console.log('🔢 PROVIDER NONCE:', providerNonce);
      console.log('🔢 FRONTEND SENT NONCE:', nonce);
    }
    
    // Verify signature
    const signatureVerification = verifyMetaTransactionSignature(
      signature, 
      walletAddress, 
      to, 
      value, 
      data, 
      nonce, 
      owner, 
      Number(chainId)
    );
    
    if (!signatureVerification.success || !signatureVerification.isValid) {
      return res.status(400).json(formatError('Invalid signature', signatureVerification.error));
    }
      console.log('✅ Signature verified for owner:', owner);
    
    console.log('🔢 FINAL NONCE CHECK before execution:', {
      walletAddress,
      to,
      value: value || '0',
      data: data || '0x',
      nonce,
      signature: signature.slice(0, 10) + '...'
    });
    
    // Execute meta-transaction with EIP-1559 gas params
    const feeData = await provider.getFeeData();
    const tx = await wallet.executeMetaTransaction(
      to,
      value || '0',
      data || '0x',
      nonce,
      signature,
      {
        gasLimit: 500000,
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
      }
    );
    
    console.log('🚀 Meta-transaction sent:', tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    
    console.log('✅ Meta-transaction confirmed:', receipt.hash);
    
    res.json(formatSuccess({
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      gasSaved: '0.001', // Calculate actual gas saved
      status: receipt.status === 1 ? 'success' : 'failed'
    }));
    
  } catch (error) {
    console.error('❌ Meta-transaction failed:', error);
    
    if (error.message.includes('nonce')) {
      return res.status(400).json(formatError('Invalid nonce', 'Transaction nonce is invalid or already used'));
    }
    
    if (error.message.includes('gas')) {
      return res.status(400).json(formatError('Gas price too low - please try again', error.message));
    }
    
    res.status(500).json(formatError('Transaction failed', error.message));
  }
});

// Get transaction status
app.get('/transaction/:txHash/status', async (req, res) => {
  try {
    const { txHash } = req.params;
    
    if (!txHash || !txHash.startsWith('0x') || txHash.length !== 66) {
      return res.status(400).json(formatError('Invalid transaction hash'));
    }
    
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      return res.json(formatSuccess({
        status: 'pending',
        txHash
      }));
    }
    
    res.json(formatSuccess({
      status: receipt.status === 1 ? 'success' : 'failed',
      txHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      confirmations: await provider.getBlockNumber() - receipt.blockNumber
    }));
    
  } catch (error) {
    console.error('Error getting transaction status:', error);
    res.status(500).json(formatError('Failed to get transaction status', error.message));
  }
});

// Get relayer info
app.get('/relayer/info', async (req, res) => {
  try {
    const balance = await provider.getBalance(relayerWallet.address);
    const blockNumber = await provider.getBlockNumber();
    
    res.json(formatSuccess({
      address: relayerWallet.address,
      balance: ethers.formatEther(balance),
      network: process.env.NETWORK_NAME,
      blockNumber,
      version: '1.0.0'
    }));
  } catch (error) {
    res.status(500).json(formatError('Failed to get relayer info', error.message));
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json(formatError('Internal server error', error.message));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json(formatError('Endpoint not found'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Enhanced relayer server running on port ${PORT}`);
  console.log(`🌐 Network: ${process.env.NETWORK_NAME}`);
  console.log(`🔗 RPC: ${process.env.RPC_URL}`);
  console.log(`🔑 Relayer: ${relayerWallet.address}`);
});

module.exports = app;
