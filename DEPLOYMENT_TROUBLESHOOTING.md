# 🚨 Smart Wallet Deployment Troubleshooting

## Current Issues Fixed ✅

### 1. **Gas Estimation Error** ✅ FIXED
- **Error**: `factory.getDeployTransaction(...).estimateGas is not a function`
- **Fix**: Updated to use fixed gas limit (1,000,000) instead of estimation
- **Status**: ✅ Ready to deploy

### 2. **Network "Header Not Found" Error** ⚠️ NEEDS SETUP
- **Error**: `"code": -32000, "message": "header not found"`
- **Cause**: MetaMask not properly configured for BlockDAG network
- **Solution**: Follow network setup guide below

### 3. **Backend 404 Error** ✅ EXPECTED
- **Error**: `Failed to load resource: 404 (Not Found)`
- **Status**: ✅ Normal - backend correctly reports no wallet exists yet

---

## 🌐 MetaMask Network Setup (REQUIRED)

### **Step 1: Add BlockDAG Network**

1. Open MetaMask → Network dropdown → "Add Network"
2. Enter these **exact** details:

```
Network Name: BlockDAG Mainnet
RPC URL: https://rpc.primordial.bdagscan.com
Chain ID: 1043
Currency: BDAG
Explorer: https://explorer.bdagscan.com
```

3. Save and switch to BlockDAG network

### **Step 2: Verify Setup**
- ✅ Network shows "BlockDAG Mainnet"
- ✅ Balance shows in BDAG (not ETH)
- ✅ No "header not found" errors in console

---

## 🚀 Deployment Process

### **Prerequisites Checklist**
- ✅ MetaMask installed and unlocked
- ✅ BlockDAG network added and selected
- ✅ At least 0.01 BDAG for gas fees
- ✅ Backend running on localhost:4000
- ✅ Frontend running on localhost:3000

### **Deployment Steps**
1. **Connect Wallet**: Click "Connect Wallet" button
2. **Verify Network**: Should show BlockDAG (1043)
3. **Deploy**: Click "🚀 Deploy Smart Wallet"
4. **Confirm**: Approve transaction in MetaMask
5. **Wait**: Deployment takes 10-30 seconds
6. **Success**: Page refreshes with new wallet loaded

---

## 🔧 Common Issues & Solutions

### **Issue: "Please switch to BlockDAG network"**
- **Solution**: Change MetaMask network to BlockDAG
- **Check**: Network dropdown shows "BlockDAG Mainnet"

### **Issue: "Transaction rejected"**
- **Solution**: You clicked "Reject" in MetaMask
- **Fix**: Try again and click "Confirm"

### **Issue: "Insufficient funds for gas"**
- **Solution**: Need more BDAG tokens
- **Fix**: Get BDAG from exchange or faucet

### **Issue: "Network connection failed"**
- **Solution**: RPC server issues
- **Fix**: Try different RPC URL or wait for network recovery

### **Issue: Still getting "header not found"**
1. **Reset MetaMask Account**:
   - Settings → Advanced → Reset Account
   - (Won't delete your wallet/keys)

2. **Clear Browser Cache**:
   - Ctrl+Shift+Delete → Clear all data
   - Restart browser

3. **Try Different RPC**:
   - Use backup RPC if available
   - Contact BlockDAG support for alternative URLs

---

## 🎯 Quick Test Steps

### **Test 1: Network Connection**
```javascript
// Open browser console and run:
ethereum.request({method: 'eth_getBalance', params: ['0x484eab4066d5631754C329Cc27FA6213ba038cc8', 'latest']})
```
- ✅ Should return balance
- ❌ "header not found" = network issue

### **Test 2: Backend Connection**
Visit: http://localhost:4000/health
- ✅ Should show backend status
- ❌ Connection refused = start backend

### **Test 3: Contract Compilation**
Check console for:
- ✅ "📦 Deployer initialized with: {abiLength: X, bytecodeLength: Y}"
- ❌ Import errors = contract artifacts issue

---

## 📞 **Need Help?**

1. **Check browser console** for detailed error messages
2. **Verify all prerequisites** are met
3. **Try on testnet first** (Sepolia) if BlockDAG has issues
4. **Contact support** with:
   - Error messages from console
   - Network settings
   - Transaction hashes (if any)

---

**Status**: Your deployment system is technically ready. The only blocker is MetaMask network configuration.
