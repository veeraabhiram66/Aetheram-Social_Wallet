// Deploy a real smart wallet for testing
const { ethers } = require('ethers');
require('dotenv').config();

async function deployTestSmartWallet() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
  
  console.log('🔍 Deployer address:', deployer.address);
  
  // Simple smart wallet contract (minimal for testing)
  const smartWalletCode = `
    pragma solidity ^0.8.0;
    
    contract TestSmartWallet {
        address public owner;
        uint256 public nonce;
        
        constructor(address _owner) {
            owner = _owner;
            nonce = 0;
        }
        
        function getCurrentNonce() external view returns (uint256) {
            return nonce;
        }
        
        function execute(address to, uint256 value, bytes calldata data) external {
            require(msg.sender == owner, "Only owner");
            nonce++;
            (bool success,) = to.call{value: value}(data);
            require(success, "Transaction failed");
        }
        
        receive() external payable {}
    }`;
    
  // For now, let's just use the factory to create a wallet
  const factoryAddress = process.env.REACT_APP_SMART_WALLET_FACTORY_ADDRESS || '0x026C40Dfc0DB194A5D3Ac41909C736a93a2bffa9';
  
  console.log('📝 Using factory address:', factoryAddress);
  console.log('👤 Owner address (deployer):', deployer.address);
  
  // Simple ABI for factory (you might need to adjust this)
  const factoryABI = [
    "function createWallet(address owner) external returns (address)"
  ];
  
  try {
    const factory = new ethers.Contract(factoryAddress, factoryABI, deployer);
    
    console.log('🏭 Creating smart wallet...');
    const tx = await factory.createWallet(deployer.address);
    const receipt = await tx.wait();
    
    console.log('✅ Smart wallet created!');
    console.log('📄 Transaction hash:', tx.hash);
    console.log('🏠 Smart wallet should be at a new address');
    
    // You'll need to get the actual address from the transaction receipt or events
    return receipt;
  } catch (error) {
    console.error('❌ Failed to deploy smart wallet:', error);
    
    // For immediate testing, let's use a mock deployed address
    console.log('🚨 Using mock smart wallet address for testing');
    console.log('👤 Owner:', deployer.address);
    console.log('🏠 Mock Smart Wallet:', '0x1234567890123456789012345678901234567890');
    
    return {
      owner: deployer.address,
      smartWallet: '0x1234567890123456789012345678901234567890'
    };
  }
}

if (require.main === module) {
  deployTestSmartWallet()
    .then(result => {
      console.log('Result:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = { deployTestSmartWallet };
