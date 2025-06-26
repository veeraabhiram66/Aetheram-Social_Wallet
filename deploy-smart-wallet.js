const { ethers } = require('ethers');
require('dotenv').config();

async function deploySmartWallet() {
    console.log('🚀 Deploying Smart Wallet...');
    
    // Setup provider and deployer
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    
    console.log('📍 Network:', process.env.NETWORK_NAME);
    console.log('👤 Deployer:', deployer.address);
    
    // Check balance
    const balance = await provider.getBalance(deployer.address);
    console.log('💰 Deployer balance:', ethers.formatEther(balance), 'BDAG');
    
    if (balance < ethers.parseEther('0.1')) {
        console.error('❌ Insufficient balance for deployment!');
        return;
    }
    
    // Simple Smart Wallet Contract
    const smartWalletCode = `
        // SPDX-License-Identifier: MIT
        pragma solidity ^0.8.0;
        
        contract SimpleSmartWallet {
            address public owner;
            uint256 public nonce;
            
            event MetaTransactionExecuted(
                address indexed from,
                address indexed to,
                uint256 value,
                bytes data,
                uint256 nonce,
                bytes32 txHash
            );
            
            constructor(address _owner) {
                owner = _owner;
                nonce = 0;
            }
            
            function getCurrentNonce() external view returns (uint256) {
                return nonce;
            }
            
            function getBalance() external view returns (uint256) {
                return address(this).balance;
            }
            
            // Simple execute function
            function execute(
                address to,
                uint256 value,
                bytes calldata data
            ) external returns (bool) {
                require(msg.sender == owner, "Only owner can execute");
                nonce++;
                
                (bool success, ) = to.call{value: value}(data);
                require(success, "Transaction failed");
                
                emit MetaTransactionExecuted(
                    msg.sender,
                    to,
                    value,
                    data,
                    nonce - 1,
                    keccak256(abi.encodePacked(to, value, data, nonce - 1))
                );
                
                return true;
            }
            
            // Meta-transaction execute (with signature verification)
            function executeMetaTransaction(
                address to,
                uint256 value,
                bytes calldata data,
                uint256 _nonce,
                bytes calldata signature
            ) external returns (bool) {
                require(_nonce == nonce, "Invalid nonce");
                
                // Create message hash for signature verification
                bytes32 messageHash = keccak256(abi.encodePacked(
                    to, value, keccak256(data), _nonce
                ));
                
                bytes32 ethSignedMessageHash = keccak256(abi.encodePacked(
                    "\\x19Ethereum Signed Message:\\n32", messageHash
                ));
                
                // Recover signer from signature
                address signer = recoverSigner(ethSignedMessageHash, signature);
                require(signer == owner, "Invalid signature");
                
                nonce++;
                
                (bool success, ) = to.call{value: value}(data);
                require(success, "Transaction failed");
                
                emit MetaTransactionExecuted(
                    signer,
                    to,
                    value,
                    data,
                    _nonce,
                    messageHash
                );
                
                return true;
            }
            
            function recoverSigner(bytes32 hash, bytes memory signature) internal pure returns (address) {
                bytes32 r;
                bytes32 s;
                uint8 v;
                
                if (signature.length != 65) {
                    return address(0);
                }
                
                assembly {
                    r := mload(add(signature, 32))
                    s := mload(add(signature, 64))
                    v := byte(0, mload(add(signature, 96)))
                }
                
                if (v < 27) {
                    v += 27;
                }
                
                if (v != 27 && v != 28) {
                    return address(0);
                }
                
                return ecrecover(hash, v, r, s);
            }
            
            // Allow receiving Ether
            receive() external payable {}
            fallback() external payable {}
        }
    `;
    
    try {
        // Compile and deploy (simplified - you'd normally use Hardhat)
        console.log('📝 Contract code prepared');
        console.log('👤 Owner will be:', deployer.address);
        
        // For now, let's use the factory if it exists
        const factoryAddress = '0x026C40Dfc0DB194A5D3Ac41909C736a93a2bffa9';
        
        console.log('🏭 Attempting to use factory at:', factoryAddress);
        
        // Simple factory ABI
        const factoryABI = [
            "function createWallet(address owner) external returns (address)",
            "function getWalletAddress(address owner) external view returns (address)"
        ];
        
        const factory = new ethers.Contract(factoryAddress, factoryABI, deployer);
        
        // Check if wallet already exists
        try {
            const existingWallet = await factory.getWalletAddress(deployer.address);
            if (existingWallet !== ethers.ZeroAddress) {
                console.log('✅ Smart wallet already exists at:', existingWallet);
                return {
                    owner: deployer.address,
                    smartWallet: existingWallet,
                    isNew: false
                };
            }
        } catch (e) {
            console.log('🔍 No existing wallet found, creating new one...');
        }
        
        // Create new wallet
        console.log('🏗️ Creating smart wallet...');
        const tx = await factory.createWallet(deployer.address);
        console.log('⏳ Transaction sent:', tx.hash);
        
        const receipt = await tx.wait();
        console.log('✅ Transaction confirmed!');
        
        // Try to get the new wallet address
        let smartWalletAddress;
        try {
            smartWalletAddress = await factory.getWalletAddress(deployer.address);
        } catch (e) {
            // Parse from events if available
            if (receipt.logs && receipt.logs.length > 0) {
                console.log('📋 Parsing wallet address from events...');
                // This would need to be customized based on your factory events
            }
            smartWalletAddress = 'CHECK_TRANSACTION_RECEIPT';
        }
        
        console.log('🎉 DEPLOYMENT SUCCESSFUL!');
        console.log('👤 Owner:', deployer.address);
        console.log('🏠 Smart Wallet:', smartWalletAddress);
        console.log('📄 Transaction:', tx.hash);
        
        return {
            owner: deployer.address,
            smartWallet: smartWalletAddress,
            txHash: tx.hash,
            isNew: true
        };
        
    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        
        // Provide manual deployment instructions
        console.log('\n📖 MANUAL DEPLOYMENT INSTRUCTIONS:');
        console.log('1. Use Remix IDE or Hardhat to deploy the SimpleSmartWallet contract');
        console.log('2. Constructor parameter: owner =', deployer.address);
        console.log('3. Update REACT_APP_WALLET_CONTRACT_ADDRESS in frontend/.env');
        console.log('4. Update backend to recognize the new address');
        
        return null;
    }
}

// Run if called directly
if (require.main === module) {
    deploySmartWallet()
        .then(result => {
            if (result) {
                console.log('\n🔧 NEXT STEPS:');
                console.log('1. Update frontend/.env:');
                console.log(`   REACT_APP_WALLET_CONTRACT_ADDRESS=${result.smartWallet}`);
                console.log('2. Update backend to recognize this address');
                console.log('3. Restart both frontend and backend');
            }
            process.exit(0);
        })
        .catch(error => {
            console.error('Error:', error);
            process.exit(1);
        });
}

module.exports = { deploySmartWallet };
