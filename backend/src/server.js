const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
require('dotenv').config({ path: "../.env" });

const app = express();
const PORT = process.env.BACKEND_PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize provider
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// Simple Wallet ABI (only what we need)
const WALLET_ABI = [
    "function execute(address to, uint256 value, bytes calldata data) external returns (bool)",
    "function getCurrentNonce() external view returns (uint256)",
    "function getBalance() external view returns (uint256)",
    "function owner() external view returns (address)"
];

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        network: process.env.NETWORK_NAME 
    });
});

// Get wallet info
app.get('/wallet/:address', async (req, res) => {
    try {
        const { address } = req.params;
        
        if (!ethers.isAddress(address)) {
            return res.status(400).json({ error: 'Invalid address' });
        }
        
        const wallet = new ethers.Contract(address, WALLET_ABI, provider);
        
        const [nonce, balance, owner] = await Promise.all([
            wallet.getCurrentNonce(),
            wallet.getBalance(),
            wallet.owner()
        ]);
        
        res.json({
            address,
            nonce: nonce.toString(),
            balance: ethers.formatEther(balance),
            owner
        });
        
    } catch (error) {
        console.error('Error getting wallet info:', error);
        res.status(500).json({ error: 'Failed to get wallet info' });
    }
});

// Get transaction count
app.get('/nonce/:address', async (req, res) => {
    try {
        const { address } = req.params;
        
        if (!ethers.isAddress(address)) {
            return res.status(400).json({ error: 'Invalid address' });
        }
        
        const nonce = await provider.getTransactionCount(address, 'pending');
        res.json({ nonce });
        
    } catch (error) {
        console.error('Error getting nonce:', error);
        res.status(500).json({ error: 'Failed to get nonce' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Backend server running on port ${PORT}`);
    console.log(`🌐 Network: ${process.env.NETWORK_NAME}`);
    console.log(`🔗 RPC: ${process.env.RPC_URL}`);
});
