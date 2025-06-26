# MetaMask BlockDAG Network Setup Guide

## 🌐 **Add BlockDAG Network to MetaMask**

The "header not found" error indicates MetaMask needs to be configured for BlockDAG network. Follow these steps:

### **Method 1: Manual Setup (Recommended)**

1. **Open MetaMask** → Click the network dropdown (usually says "Ethereum Mainnet")
2. **Click "Add Network"** → Select "Add a network manually"
3. **Enter BlockDAG Network Details:**

```
Network Name: BlockDAG Mainnet
New RPC URL: https://rpc.primordial.bdagscan.com
Chain ID: 1043
Currency Symbol: BDAG
Block Explorer URL: https://explorer.bdagscan.com
```

4. **Click "Save"** → Switch to BlockDAG network
5. **Test Connection**: You should see your BDAG balance

### **Method 2: Quick Add (If Available)**

Some dApps can auto-add networks. If your wallet deployment shows a network prompt, click "Add Network" or "Switch Network".

## ⚠️ **Troubleshooting Network Issues**

### **If you see "header not found" errors:**

1. **Clear MetaMask Cache:**
   - Settings → Advanced → Clear activity tab data
   - Settings → Advanced → Reset account (this won't delete your wallet)

2. **Try Different RPC URLs:**
   ```
   Primary: https://rpc.primordial.bdagscan.com
   Backup: https://rpc.blockdag.org (if available)
   ```

3. **Check Network Status:**
   - Visit https://explorer.bdagscan.com
   - Ensure the network is operational

4. **Restart MetaMask:**
   - Close all browser tabs with MetaMask
   - Reopen and try again

### **If you don't have BDAG for gas:**

- You need BDAG tokens to pay for gas fees
- Get BDAG from an exchange or faucet
- Minimum ~0.01 BDAG should be enough for smart wallet deployment

## 🔧 **Alternative Networks for Testing**

If BlockDAG network has issues, you can deploy on other networks for testing:

- **Sepolia Testnet** (Chain ID: 11155111) - Free ETH from faucets
- **Polygon Mumbai** (Chain ID: 80001) - Free MATIC from faucets

⚠️ **Note**: Deploy on BlockDAG mainnet for production use!

## ✅ **Verification Steps**

After setup, verify everything works:

1. **Network Shows**: "BlockDAG Mainnet" in MetaMask
2. **Balance Visible**: Your BDAG balance appears
3. **No RPC Errors**: No "header not found" messages
4. **Ready to Deploy**: Green "Deploy Smart Wallet" button is active

---

**Need help?** Check the browser console for detailed error messages and network status.
