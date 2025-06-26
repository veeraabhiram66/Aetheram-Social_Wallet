import React, { useState } from 'react';
import { ethers } from 'ethers';
import { Button } from './UI';

// Correct SimpleWallet contract bytecode and ABI from compiled artifacts
import CONTRACT_DATA from '../contracts/SimpleWallet.json';

const SIMPLE_WALLET_ABI = CONTRACT_DATA.abi;
const SIMPLE_WALLET_BYTECODE = CONTRACT_DATA.bytecode;

const FixedWalletDeployer = ({ onDeployment, account }) => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedAddress, setDeployedAddress] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);

  console.log('📦 Deployer initialized with:', {
    abiLength: SIMPLE_WALLET_ABI.length,
    bytecodeLength: SIMPLE_WALLET_BYTECODE.length,
    bytecodeStart: SIMPLE_WALLET_BYTECODE.substring(0, 10)
  });

  const verifyContractFunctions = async (contract, expectedOwner) => {
    try {
      console.log('🔍 Verifying deployed contract...');
      
      // Test 1: Check owner
      const owner = await contract.owner();
      console.log('👤 Contract owner:', owner);
      console.log('👤 Expected owner:', expectedOwner);
      
      if (owner.toLowerCase() !== expectedOwner.toLowerCase()) {
        throw new Error(`Owner mismatch! Expected: ${expectedOwner}, Got: ${owner}`);
      }
      
      // Test 2: Check initial nonce
      const nonce = await contract.getCurrentNonce();
      console.log('🔢 Initial nonce:', nonce.toString());
      
      if (nonce.toString() !== '0') {
        throw new Error(`Invalid initial nonce! Expected: 0, Got: ${nonce.toString()}`);
      }
      
      // Test 3: Check balance function
      const balance = await contract.getBalance();
      console.log('💰 Initial balance:', balance.toString());
      
      console.log('✅ Contract verification passed!');
      return true;
    } catch (error) {
      console.error('❌ Contract verification failed:', error);
      throw error;
    }
  };

  const deployWallet = async () => {
    if (!window.ethereum || !account) {
      alert('Please connect your wallet first');
      return;
    }

    setIsDeploying(true);
    setVerificationStatus('Initializing deployment...');
    
    try {      // Check network first
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      console.log('🌐 Network info:', { chainId: network.chainId.toString(), name: network.name });
        // Verify we're on the right network (BlockDAG is chain ID 1043)
      // Note: Allow deployment on any network for testing, but warn if not BlockDAG
      if (network.chainId !== 1043n) {
        // eslint-disable-next-line no-restricted-globals
        const proceed = confirm(`You're on network ${network.chainId} instead of BlockDAG (1043). 
        
Do you want to continue anyway? 
- Click OK to deploy on current network
- Click Cancel to switch networks first`);
        
        if (!proceed) {
          throw new Error('Please switch to BlockDAG network (Chain ID: 1043) and try again');
        }
        console.log('⚠️ Deploying on non-BlockDAG network:', network.chainId.toString());
      }
      
      const signer = await provider.getSigner();
      
      // Verify the signer address matches the account
      const signerAddress = await signer.getAddress();
      if (signerAddress.toLowerCase() !== account.toLowerCase()) {
        throw new Error(`Address mismatch! Expected: ${account}, Got: ${signerAddress}`);
      }
      
      console.log('🚀 Deploying SimpleWallet for:', account);
      console.log('🔧 Using bytecode length:', SIMPLE_WALLET_BYTECODE.length);
      console.log('📋 Using ABI with', SIMPLE_WALLET_ABI.length, 'functions');
      
      setVerificationStatus('Creating contract factory...');
        // Create contract factory with imported data
      const factory = new ethers.ContractFactory(SIMPLE_WALLET_ABI, SIMPLE_WALLET_BYTECODE, signer);
      
      setVerificationStatus('Deploying contract...');
      
      // Deploy the contract with a reasonable gas limit
      // Use a fixed high gas limit to avoid estimation issues
      const deployTx = await factory.deploy({
        gasLimit: 1000000 // 1M gas should be enough for simple wallet deployment
      });
      
      console.log('📨 Deploy transaction sent:', deployTx.deploymentTransaction().hash);
      setVerificationStatus('Waiting for deployment confirmation...');
      
      // Wait for deployment
      const contract = await deployTx.waitForDeployment();
      const address = await contract.getAddress();
      
      console.log('✅ Smart wallet deployed to:', address);
      setVerificationStatus('Verifying contract functions...');
      
      // Verify the contract works correctly
      await verifyContractFunctions(contract, account);
      
      setDeployedAddress(address);
      setVerificationStatus('✅ Deployment and verification complete!');
      
      // Create the wallet info object
      const walletInfo = {
        address: address,
        owner: account,
        nonce: 0,
        balance: '0',
        isDeployed: true
      };
      
      console.log('🎉 Smart wallet successfully deployed and verified!');
        // Show success message with transaction details
      alert(`🎉 Smart wallet deployed successfully!
      
Address: ${address}
Owner: ${account}
Transaction: ${deployTx.deploymentTransaction().hash}
Gas Limit: 1,000,000

✅ Contract verified and ready to use!

The page will now refresh to load your new wallet.`);
      
      // Notify parent component
      if (onDeployment) {
        onDeployment(walletInfo);
      }
      
      // Auto-refresh after a delay
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
    } catch (error) {
      console.error('❌ Deployment failed:', error);
      setVerificationStatus(`❌ Failed: ${error.message}`);
      
      // Show detailed error with troubleshooting
      let troubleshooting = '';
      if (error.message.includes('network')) {
        troubleshooting = '\n🔧 Network Issue:\n- Make sure you\'re connected to BlockDAG network\n- Check RPC settings in MetaMask';
      } else if (error.message.includes('gas')) {
        troubleshooting = '\n⛽ Gas Issue:\n- Make sure you have enough BDAG for gas\n- Try increasing gas limit manually';
      } else if (error.message.includes('rejected')) {
        troubleshooting = '\n❌ Transaction Rejected:\n- You cancelled the transaction\n- Try again when ready';
      }
      
      alert(`❌ Deployment failed: ${error.message}${troubleshooting}

Please check:
1. You have enough BDAG for gas fees
2. Your wallet is connected to BlockDAG network (Chain ID: 1043)
3. MetaMask is unlocked and responsive

Try again or check the console for more details.`);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg shadow-lg">
      <div className="space-y-4">
        <div>
          <h4 className="text-lg font-semibold text-green-800 dark:text-green-200 flex items-center">
            🚀 Deploy Smart Wallet
          </h4>
          <p className="text-sm text-green-700 dark:text-green-300 mt-2">
            Deploy a new smart wallet contract for address: <span className="font-mono text-xs bg-green-100 dark:bg-green-800 px-2 py-1 rounded">{account}</span>
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            Network: BlockDAG (Chain ID: 1043)
          </p>
        </div>
        
        {verificationStatus && (
          <div className="bg-blue-100 dark:bg-blue-800 p-3 rounded text-sm">
            <p className="text-blue-800 dark:text-blue-200">
              📊 Status: {verificationStatus}
            </p>
          </div>
        )}
        
        {deployedAddress && (
          <div className="bg-green-100 dark:bg-green-800 p-3 rounded text-sm space-y-2">
            <p className="text-green-800 dark:text-green-200 font-medium">
              ✅ Successfully deployed!
            </p>
            <p className="text-green-700 dark:text-green-300 font-mono text-xs break-all">
              📍 Address: {deployedAddress}
            </p>
            <p className="text-green-700 dark:text-green-300 text-xs">
              🔄 The page will refresh automatically to load your new wallet.
            </p>
          </div>
        )}
        
        <div className="flex gap-3">
          <Button
            onClick={deployWallet}
            disabled={isDeploying || !account}
            variant="primary"
            className="flex-1"
          >
            {isDeploying ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin mr-2">⚙️</span>
                Deploying...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                🚀 Deploy Smart Wallet
              </span>
            )}
          </Button>
          
          {deployedAddress && (
            <Button
              onClick={() => window.location.reload()}
              variant="secondary"
            >
              🔄 Refresh App
            </Button>
          )}
        </div>
        
        <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-3 rounded">
          <p className="font-medium mb-1">ℹ️ What happens when you deploy:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>A new smart wallet contract is created on BlockDAG network</li>
            <li>Your address ({account}) becomes the owner</li>
            <li>The contract is verified to ensure it works correctly</li>
            <li>You can then send gasless transactions through this smart wallet</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FixedWalletDeployer;
