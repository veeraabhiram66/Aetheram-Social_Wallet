import { ethers } from 'ethers';

class WalletService {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.contractAddress = process.env.REACT_APP_WALLET_CONTRACT_ADDRESS;
        
        // Simple Wallet ABI
        this.contractABI = [
            "function execute(address to, uint256 value, bytes calldata data) external returns (bool)",
            "function getCurrentNonce() external view returns (uint256)",
            "function getBalance() external view returns (uint256)",
            "function owner() external view returns (address)"
        ];
    }
    
    // Initialize with MetaMask
    async connect() {
        if (!window.ethereum) {
            throw new Error('MetaMask not found');
        }
        
        this.provider = new ethers.BrowserProvider(window.ethereum);
        await this.provider.send("eth_requestAccounts", []);
        this.signer = await this.provider.getSigner();
        
        if (this.contractAddress) {
            this.contract = new ethers.Contract(
                this.contractAddress, 
                this.contractABI, 
                this.signer
            );
        }
        
        return await this.signer.getAddress();
    }
    
    // Get wallet info
    async getWalletInfo() {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }
        
        const [nonce, balance, owner] = await Promise.all([
            this.contract.getCurrentNonce(),
            this.contract.getBalance(),
            this.contract.owner()
        ]);
        
        return {
            address: this.contractAddress,
            nonce: nonce.toString(),
            balance: ethers.formatEther(balance),
            owner
        };
    }
    
    // Send transaction
    async sendTransaction(to, value, data = '0x') {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }
        
        const valueWei = ethers.parseEther(value.toString());
        const tx = await this.contract.execute(to, valueWei, data);
        
        return {
            hash: tx.hash,
            wait: () => tx.wait()
        };
    }
    
    // Get current nonce from contract
    async getCurrentNonce() {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }
        
        return await this.contract.getCurrentNonce();
    }
}

const walletService = new WalletService();
export default walletService;
