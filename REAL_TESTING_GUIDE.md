# 🧪 Testing REAL Guardian Functionality

## ✅ Current Status
- **Smart Wallet Implementation**: `0x96d4f1a317dfA7e3C09bD3ae446ebA22f148c294` ✅
- **Smart Wallet Factory**: `0x769AA5Ee4191c72a8e15aECc547A2045F8C788B7` ✅
- **Backend API**: Ready for testing ✅
- **Frontend**: Real guardian hooks implemented ✅

## 🎯 3 Ways to Test Real Functionality

### Method 1: Frontend Testing (Best for Demo)

1. **Start Backend:**
   ```bash
   cd backend
   node src/index.js
   # Should show: "🚀 BlockDAG Smart Wallet Backend running on port 4000"
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm start
   # Opens http://localhost:3000
   ```

3. **Test Real Guardian Features:**
   - Connect MetaMask to BlockDAG network
   - Switch to "Social Recovery" tab
   - Try adding a guardian (will make real blockchain call)
   - Try changing threshold (real contract interaction)

### Method 2: Contract Testing

Create a test wallet and interact with it:

```bash
cd contracts
npx hardhat run scripts/createTestWallet.js --network blockdag
```

### Method 3: API Testing

Test the backend directly:

```bash
# Test health
curl http://localhost:4000/api/health

# Test wallet info
curl http://localhost:4000/api/wallet/YOUR_ADDRESS
```

## 🔍 What's REAL vs FAKE Now

### ✅ REAL (Blockchain interactions):
- `addGuardian()` - Calls smart contract
- `removeGuardian()` - Calls smart contract  
- `changeThreshold()` - Calls smart contract
- `initiateRecovery()` - Calls smart contract
- `approveRecovery()` - Calls smart contract
- Guardian data loaded from blockchain
- Recovery requests from blockchain events

### ❌ FAKE (Fallback only):
- If contract calls fail, shows mock data with "- Mock" suffix
- This is only for development/demo purposes

## 🧪 Step-by-Step Testing

### Step 1: Verify Contracts
```javascript
// In browser console or script
const factory = new ethers.Contract(
  "0x769AA5Ee4191c72a8e15aECc547A2045F8C788B7",
  factoryABI,
  provider
);
console.log(await factory.implementation());
// Should return: 0x96d4f1a317dfA7e3C09bD3ae446ebA22f148c294
```

### Step 2: Create Test Wallet
```javascript
// Use the factory to create a wallet
const salt = ethers.randomBytes(32);
const tx = await factory.deployWallet(ownerAddress, salt);
const receipt = await tx.wait();
// Get wallet address from events
```

### Step 3: Test Guardian Operations
```javascript
// Add guardian to wallet
const wallet = new ethers.Contract(walletAddress, walletABI, signer);
const tx = await wallet.addGuardian(guardianAddress);
await tx.wait();

// Verify guardian was added
const guardiansCount = await wallet.guardiansCount();
const guardian = await wallet.guardians(0);
console.log("Guardian added:", guardian);
```

## 🚀 Expected Real Behavior

When you test in the frontend:

1. **Add Guardian**: 
   - Shows loading spinner
   - MetaMask popup for transaction
   - Success/error message
   - Guardian list updates from blockchain

2. **Remove Guardian**:
   - Real transaction to blockchain
   - Updates guardian count
   - Updates threshold if needed

3. **Initiate Recovery**:
   - Creates real recovery request on-chain
   - Shows in recovery requests section
   - Tracks approval count

4. **Approve Recovery**:
   - Guardian approves via smart contract
   - Updates approval count on-chain
   - Executes recovery when threshold met

## 🔧 Troubleshooting

If you see "Mock" data:
- Check network connection
- Verify contract addresses in .env
- Check MetaMask is connected to BlockDAG
- Look at browser console for errors

## 📊 Verification

Real functionality working when:
- ✅ No "Mock" suffix in guardian names
- ✅ Loading states during operations
- ✅ MetaMask transaction popups
- ✅ Data persists after page refresh
- ✅ Multiple users see same guardian list
