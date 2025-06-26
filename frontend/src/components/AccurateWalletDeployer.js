import React, { useState } from 'react';
import { ethers } from 'ethers';
import { Button } from './UI';

// Correct SimpleWallet contract bytecode and ABI from compiled contract
const SIMPLE_WALLET_BYTECODE = "0x608060405234801561001057600080fd5b50336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506000600181905550610a3b806100686000396000f3fe6080604052600436106100595760003560e01c806312065fe0146100655780633a60c386146100905780638da5cb5b146100bb578063affed0e0146100e6578063b61d27f614610111578063f2fde38b1461014e57610060565b3661006057005b600080fd5b34801561007157600080fd5b5061007a610177565b604051610087919061053d565b60405180910390f35b34801561009c57600080fd5b506100a561017f565b6040516100b2919061053d565b60405180910390f35b3480156100c757600080fd5b506100d0610189565b6040516100dd9190610599565b60405180910390f35b3480156100f257600080fd5b506100fb6101ad565b604051610108919061053d565b60405180910390f35b34801561011d57600080fd5b506101386004803603810190610133919061067b565b6101b3565b604051610145919061070a565b60405180910390f35b34801561015a57600080fd5b5061017560048036038101906101709190610725565b61036a565b005b600047905090565b6000600154905090565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60015481565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610244576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161023b906107af565b60405180910390fd5b60016000815480929190610257906107fe565b91905055508473ffffffffffffffffffffffffffffffffffffffff16848484604051610284929190610885565b60006040518083038185875af1925050503d8060081146102c1576040519150601f19603f3d011682016040523d82523d6000602084013e6102c6565b606091505b5050809150508061030c576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610303906108ea565b60405180910390fd5b8473ffffffffffffffffffffffffffffffffffffffff167f862c2fee80ff12bbe85a7ba5ef3a95eefd276d7aad48da241d19fd23378f68e585858560015460405161035a9493929190610959565b60405180910390a2949350505050565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16146103f8576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016103ef906107af565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1603610467576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161045e906109e5565b60405180910390fd5b8073ffffffffffffffffffffffffffffffffffffffff1660008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a3806000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b6000819050919050565b61053781610524565b82525050565b6000602082019050610552600083018461052e565b92915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061058382610558565b9050919050565b61059381610578565b82525050565b60006020820190506105ae600083018461058a565b92915050565b600080fd5b600080fd5b6105c781610578565b81146105d257600080fd5b50565b6000813590506105e4816105be565b92915050565b6105f381610524565b81146105fe57600080fd5b50565b600081359050610610816105ea565b92915050565b600080fd5b600080fd5b600080fd5b60008083601f84011261063b5761063a610616565b5b8235905067ffffffffffffffff8111156106585761065761061b565b5b60208301915083600182028301111561067457610673610620565b5b9250929050565b60008060008060608587031215610695576106946105b4565b5b60006106a3878288016105d5565b94505060206106b487828801610601565b935050604085013567ffffffffffffffff8111156106d5576106d46105b9565b5b6106e187828801610625565b925092505092959194509250565b60008115159050919050565b610704816106ef565b82525050565b600060208201905061071f60008301846106fb565b92915050565b60006020828403121561073b5761073a6105b4565b5b6000610749848285016105d5565b91505092915050565b600082825260208201905092915050565b7f4e6f7420746865206f776e657200000000000000000000000000000000000000600082015250565b6000610799600d83610752565b91506107a482610763565b602082019050919050565b600060208201905081810360008301526107c88161078c565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600061080982610524565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff820361083b5761083a6107cf565b5b600182019050919050565b600081905092915050565b82818337600083830152505050565b600061086c8385610846565b9350610879838584610851565b82840190509392505050565b6000610892828486610860565b91508190509392505050565b7f5472616e73616374696f6e206661696c65640000000000000000000000000000600082015250565b60006108d4601283610752565b91506108df8261089e565b602082019050919050565b60006020820190508181036000830152610903816108c7565b9050919050565b600082825260208201905092915050565b6000601f19601f8301169050919050565b6000610938838561090a565b9350610945838584610851565b61094e8361091b565b840190509392505050565b600060608201905061096e600083018761052e565b818103602083015261098181858761092c565b9050610990604083018461052e565b95945050505050565b7f4e6577206f776e65722063616e6e6f74206265207a65726f2061646472657373600082015250565b60006109cf602083610752565b91506109da82610999565b602082019050919050565b600060208201905081810360008301526109fe816109c2565b905091905056fea2646970667358221220a8044c152b6af739a2872bc998591c61aaba4d0116de4d02cfb6433b90c07e1e64736f6c63430008180033";

const SIMPLE_WALLET_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "nonce",
        "type": "uint256"
      }
    ],
    "name": "TransactionExecuted",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "execute",
    "outputs": [
      {
        "internalType": "bool",
        "name": "success",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCurrentNonce",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nonce",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
];

const AccurateWalletDeployer = ({ onDeployment, account }) => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedAddress, setDeployedAddress] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);

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
    setVerificationStatus('Deploying...');
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Verify the signer address matches the account
      const signerAddress = await signer.getAddress();
      if (signerAddress.toLowerCase() !== account.toLowerCase()) {
        throw new Error(`Address mismatch! Expected: ${account}, Got: ${signerAddress}`);
      }
      
      console.log('🚀 Deploying SimpleWallet for:', account);
      console.log('🔧 Using bytecode length:', SIMPLE_WALLET_BYTECODE.length);
      
      // Create contract factory
      const factory = new ethers.ContractFactory(SIMPLE_WALLET_ABI, SIMPLE_WALLET_BYTECODE, signer);
      
      setVerificationStatus('Sending deployment transaction...');
      
      // Deploy the contract with higher gas limit to ensure success
      const deployTx = await factory.deploy({
        gasLimit: 1000000 // 1M gas limit
      });
      
      console.log('📨 Deploy transaction sent:', deployTx.deploymentTransaction().hash);
      setVerificationStatus('Waiting for deployment confirmation...');
      
      // Wait for deployment
      const contract = await deployTx.waitForDeployment();
      const address = await contract.getAddress();
      
      console.log('✅ Smart wallet deployed to:', address);
      setVerificationStatus('Verifying contract...');
      
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
      
      // Notify parent component
      if (onDeployment) {
        onDeployment(walletInfo);
      }
      
      console.log('🎉 Smart wallet successfully deployed and verified!');
      
      // Show success message
      alert(`🎉 Smart wallet deployed successfully!
      
Address: ${address}
Owner: ${account}
Initial Nonce: 0

✅ Contract verified and ready to use!`);
      
    } catch (error) {
      console.error('❌ Deployment failed:', error);
      setVerificationStatus(`❌ Failed: ${error.message}`);
      
      // Show detailed error
      alert(`❌ Deployment failed: ${error.message}

Please check:
1. You have enough ETH for gas
2. Your wallet is connected
3. You're on the correct network

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
            <li>A new smart wallet contract is created on-chain</li>
            <li>Your address ({account}) becomes the owner</li>
            <li>The contract is verified to ensure it works correctly</li>
            <li>You can then send transactions through this smart wallet</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AccurateWalletDeployer;
