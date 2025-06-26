# 🚀 BlockDAG Smart Wallet - Complete Startup Guide

## Quick Start Instructions

Follow these steps to run the BlockDAG smart wallet project:

### Step 1: Open Two Terminal Windows

You'll need **two separate PowerShell windows** - one for the backend and one for the frontend.

### Step 2: Start the Backend Server

In **Terminal 1**, run these commands:
```powershell
cd "c:\Users\pveer\Documents\BlockDAG\backend"
npm start
```

You should see output like:
```
Enhanced BlockDAG Backend Server
Database initialized successfully
Server running on port 4000
```

### Step 3: Start the Frontend Server

In **Terminal 2**, run these commands:
```powershell
cd "c:\Users\pveer\Documents\BlockDAG\frontend" 
npm start
```

The React development server will start and automatically open http://localhost:3000 in your browser.

### Step 4: Configure MetaMask

1. **Install MetaMask** browser extension if you haven't already
2. **Add BlockDAG Network** to MetaMask:
   - Network Name: `BlockDAG Primordial`
   - RPC URL: `https://rpc.primordial.bdagscan.com`
   - Chain ID: `1043`
   - Currency Symbol: `BDAG`
   - Block Explorer: `https://explorer.primordial.bdagscan.com`

3. **Import Test Account** (optional for testing):
   - Private Key: `1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`
   - This account should have some test BDAG tokens

### Step 5: Test the Smart Wallet

1. **Open the dApp** at http://localhost:3000
2. **Connect MetaMask** when prompted
3. **Fill out the transaction form**:
   - Recipient Address: Any valid Ethereum address
   - Amount: Small amount (e.g., 0.001 BDAG)
   - Click "Send Transaction"

4. **Sign the MetaMask popup** when it appears
5. **Check the transaction** - it should be processed through the smart wallet

## What's Configured

- ✅ **Smart Wallet Address**: `0xdC10A6aCdA956363300f8a63C7CDEdc74100Fad8`
- ✅ **Backend**: Recognizes the test smart wallet and relayer addresses
- ✅ **Frontend**: Uses the correct smart wallet address for all operations
- ✅ **Environment**: All `.env` files properly configured
- ✅ **Network**: Connected to BlockDAG Primordial testnet

## Troubleshooting

### Backend Issues
- If port 4000 is busy: `netstat -ano | findstr :4000` then kill the process
- Check `.env` file exists in backend folder with correct values

### Frontend Issues  
- If port 3000 is busy, React will ask if you want to use a different port
- Clear browser cache if MetaMask connection issues persist

### MetaMask Issues
- Make sure you're connected to the BlockDAG network
- Ensure your account has some BDAG tokens for gas fees
- Try refreshing the page if connection fails

## Success Indicators

✅ **Backend Started**: Console shows "Server running on port 4000"
✅ **Frontend Started**: Browser opens to http://localhost:3000
✅ **MetaMask Connected**: Wallet address appears in the dApp
✅ **Transaction Sent**: MetaMask prompts for signature
✅ **Transaction Processed**: Success message appears in the dApp

## Important Notes

- The smart wallet `0xdC10A6aCdA956363300f8a63C7CDEdc74100Fad8` is already deployed and working
- No need to deploy new contracts - everything is pre-configured
- The relayer handles gas fees, so transactions are gasless for users
- All unnecessary UI toggles have been removed for simplicity
