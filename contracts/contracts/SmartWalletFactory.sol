// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./EnhancedSmartWallet.sol";

/**
 * @title SmartWalletFactory
 * @dev Factory contract for creating EnhancedSmartWallet instances
 */
contract SmartWalletFactory {
    event WalletCreated(address indexed owner, address indexed wallet, bytes32 salt);
    
    mapping(address => address) public walletForOwner;
    
    /**
     * @dev Creates a new smart wallet for the given owner
     * @param owner The address that will own the smart wallet
     * @return wallet The address of the created smart wallet
     */
    function createWallet(address owner) external returns (address wallet) {
        require(owner != address(0), "Invalid owner address");
        require(walletForOwner[owner] == address(0), "Wallet already exists for this owner");
        
        // Create deterministic salt
        bytes32 salt = keccak256(abi.encodePacked(owner, block.timestamp));
        
        // Deploy the smart wallet using CREATE2
        bytes memory bytecode = abi.encodePacked(
            type(EnhancedSmartWallet).creationCode,
            abi.encode(owner)
        );
        
        assembly {
            wallet := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
            if iszero(extcodesize(wallet)) {
                revert(0, 0)
            }
        }
        
        walletForOwner[owner] = wallet;
        
        emit WalletCreated(owner, wallet, salt);
        
        return wallet;
    }
    
    /**
     * @dev Gets the smart wallet address for a given owner
     * @param owner The owner address
     * @return The smart wallet address (zero if not created)
     */
    function getWalletAddress(address owner) external view returns (address) {
        return walletForOwner[owner];
    }
    
    /**
     * @dev Predicts the smart wallet address for a given owner and salt
     * @param owner The owner address
     * @param salt The salt used for CREATE2
     * @return The predicted smart wallet address
     */
    function predictWalletAddress(address owner, bytes32 salt) external view returns (address) {
        bytes memory bytecode = abi.encodePacked(
            type(EnhancedSmartWallet).creationCode,
            abi.encode(owner)
        );
        
        bytes32 hash = keccak256(abi.encodePacked(
            bytes1(0xff),
            address(this),
            salt,
            keccak256(bytecode)
        ));
        
        return address(uint160(uint256(hash)));
    }
}
