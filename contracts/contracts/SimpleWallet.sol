// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SimpleWallet {
    address public owner;
    uint256 public nonce;
    
    event TransactionExecuted(address indexed to, uint256 value, bytes data, uint256 nonce);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        nonce = 0;
    }
    
    // Execute a transaction
    function execute(
        address to,
        uint256 value,
        bytes calldata data
    ) external onlyOwner returns (bool success) {
        nonce++;
        (success, ) = to.call{value: value}(data);
        require(success, "Transaction failed");
        
        emit TransactionExecuted(to, value, data, nonce);
    }
    
    // Transfer ownership
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
    
    // Get current nonce
    function getCurrentNonce() external view returns (uint256) {
        return nonce;
    }
    
    // Receive ETH
    receive() external payable {}
    
    // Get balance
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
