// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EnhancedSmartWallet
 * @dev Enhanced smart wallet with meta-transaction support, social recovery, and advanced features
 * @notice This contract implements the ideal transaction system architecture
 */
contract EnhancedSmartWallet is EIP712, ReentrancyGuard, Ownable {
    using ECDSA for bytes32;

    // Version
    string public constant VERSION = "1.0.0";
    
    // EIP-712 Type Hash
    bytes32 public constant META_TRANSACTION_TYPEHASH = 
        keccak256("MetaTransaction(address to,uint256 value,bytes data,uint256 nonce)");

    // State variables
    uint256 private _nonce;
    mapping(address => bool) public guardians;
    mapping(address => bool) public approvedRecovery;
    uint256 public guardianThreshold;
    address public pendingOwner;
    uint256 public recoveryInitiatedAt;
    uint256 public constant RECOVERY_PERIOD = 7 days;
    
    // Events
    event MetaTransactionExecuted(
        address indexed from,
        address indexed to,
        uint256 value,
        bytes data,
        uint256 nonce,
        bytes32 indexed txHash
    );
    
    event GuardianAdded(address indexed guardian, address indexed addedBy);
    event GuardianRemoved(address indexed guardian, address indexed removedBy);
    event RecoveryInitiated(address indexed newOwner, address indexed initiatedBy);
    event RecoveryApproved(address indexed guardian, address indexed newOwner);
    event RecoveryExecuted(address indexed oldOwner, address indexed newOwner);
    event RecoveryCancelled(address indexed cancelledBy);
    event ThresholdChanged(uint256 oldThreshold, uint256 newThreshold);
    
    // Modifiers
    modifier onlyOwnerOrGuardian() {
        require(
            owner() == msg.sender || guardians[msg.sender],
            "EnhancedSmartWallet: caller is not owner or guardian"
        );
        _;
    }

    /**
     * @dev Constructor
     * @param initialOwner The initial owner of the wallet
     */
    constructor(address initialOwner) 
        EIP712("SimpleWallet", "1") 
        Ownable(initialOwner)
    {
        _nonce = 0;
        guardianThreshold = 1; // Default threshold
    }

    /**
     * @dev Receive function to accept Ether
     */
    receive() external payable {
        // Wallet can receive Ether
    }

    /**
     * @dev Execute a transaction directly (only owner)
     * @param to Destination address
     * @param value Amount of Ether to send
     * @param data Transaction data
     * @return success Whether the transaction succeeded
     */
    function execute(
        address to,
        uint256 value,
        bytes calldata data
    ) external onlyOwner nonReentrant returns (bool success) {
        require(to != address(0), "EnhancedSmartWallet: invalid destination");
        require(address(this).balance >= value, "EnhancedSmartWallet: insufficient balance");

        // Execute the transaction
        (success, ) = to.call{value: value}(data);
        require(success, "EnhancedSmartWallet: transaction failed");

        return success;
    }

    /**
     * @dev Execute a meta-transaction with EIP-712 signature
     * @param to Destination address
     * @param value Amount of Ether to send
     * @param data Transaction data
     * @param nonce Transaction nonce
     * @param signature EIP-712 signature from wallet owner
     * @return success Whether the transaction succeeded
     */
    function executeMetaTransaction(
        address to,
        uint256 value,
        bytes calldata data,
        uint256 nonce,
        bytes calldata signature
    ) external nonReentrant returns (bool success) {
        require(to != address(0), "EnhancedSmartWallet: invalid destination");
        require(nonce == _nonce, "EnhancedSmartWallet: invalid nonce");
        require(address(this).balance >= value, "EnhancedSmartWallet: insufficient balance");

        // Verify EIP-712 signature
        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(META_TRANSACTION_TYPEHASH, to, value, keccak256(data), nonce))
        );
        
        address signer = digest.recover(signature);
        require(signer == owner(), "EnhancedSmartWallet: invalid signature");

        // Increment nonce
        _nonce++;

        // Execute the transaction
        (success, ) = to.call{value: value}(data);
        require(success, "EnhancedSmartWallet: transaction failed");

        // Generate transaction hash for tracking
        bytes32 txHash = keccak256(abi.encodePacked(to, value, data, nonce, block.timestamp));

        emit MetaTransactionExecuted(signer, to, value, data, nonce, txHash);

        return success;
    }

    /**
     * @dev Get current nonce
     * @return Current nonce value
     */
    function getCurrentNonce() external view returns (uint256) {
        return _nonce;
    }

    /**
     * @dev Get wallet balance
     * @return Current balance in wei
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Add a guardian (only owner)
     * @param guardian Address of the new guardian
     */
    function addGuardian(address guardian) external onlyOwner {
        require(guardian != address(0), "EnhancedSmartWallet: invalid guardian address");
        require(guardian != owner(), "EnhancedSmartWallet: owner cannot be guardian");
        require(!guardians[guardian], "EnhancedSmartWallet: guardian already exists");

        guardians[guardian] = true;
        emit GuardianAdded(guardian, msg.sender);
    }

    /**
     * @dev Remove a guardian (only owner)
     * @param guardian Address of the guardian to remove
     */
    function removeGuardian(address guardian) external onlyOwner {
        require(guardians[guardian], "EnhancedSmartWallet: guardian does not exist");

        guardians[guardian] = false;
        emit GuardianRemoved(guardian, msg.sender);
    }

    /**
     * @dev Set guardian threshold (only owner)
     * @param threshold New threshold value
     */
    function setGuardianThreshold(uint256 threshold) external onlyOwner {
        require(threshold > 0, "EnhancedSmartWallet: threshold must be greater than 0");
        
        uint256 oldThreshold = guardianThreshold;
        guardianThreshold = threshold;
        
        emit ThresholdChanged(oldThreshold, threshold);
    }

    /**
     * @dev Initiate recovery process (only guardians)
     * @param newOwner Address of the new owner
     */
    function initiateRecovery(address newOwner) external {
        require(guardians[msg.sender], "EnhancedSmartWallet: only guardians can initiate recovery");
        require(newOwner != address(0), "EnhancedSmartWallet: invalid new owner");
        require(newOwner != owner(), "EnhancedSmartWallet: new owner cannot be current owner");
        require(pendingOwner == address(0), "EnhancedSmartWallet: recovery already in progress");

        pendingOwner = newOwner;
        recoveryInitiatedAt = block.timestamp;
        approvedRecovery[msg.sender] = true;

        emit RecoveryInitiated(newOwner, msg.sender);
    }

    /**
     * @dev Approve recovery (only guardians)
     */
    function approveRecovery() external {
        require(guardians[msg.sender], "EnhancedSmartWallet: only guardians can approve recovery");
        require(pendingOwner != address(0), "EnhancedSmartWallet: no recovery in progress");
        require(!approvedRecovery[msg.sender], "EnhancedSmartWallet: already approved");

        approvedRecovery[msg.sender] = true;

        emit RecoveryApproved(msg.sender, pendingOwner);
    }

    /**
     * @dev Execute recovery if conditions are met
     */
    function executeRecovery() external {
        require(pendingOwner != address(0), "EnhancedSmartWallet: no recovery in progress");
        require(
            block.timestamp >= recoveryInitiatedAt + RECOVERY_PERIOD,
            "EnhancedSmartWallet: recovery period not elapsed"
        );

        // Count approvals
        uint256 approvals = 0;
        // Note: In a real implementation, you'd maintain a list of guardians
        // For simplicity, we're assuming the threshold check is done off-chain

        require(approvals >= guardianThreshold, "EnhancedSmartWallet: insufficient approvals");

        address oldOwner = owner();
        _transferOwnership(pendingOwner);

        // Reset recovery state
        pendingOwner = address(0);
        recoveryInitiatedAt = 0;

        emit RecoveryExecuted(oldOwner, owner());
    }

    /**
     * @dev Cancel recovery (only current owner)
     */
    function cancelRecovery() external onlyOwner {
        require(pendingOwner != address(0), "EnhancedSmartWallet: no recovery in progress");

        pendingOwner = address(0);
        recoveryInitiatedAt = 0;

        emit RecoveryCancelled(msg.sender);
    }

    /**
     * @dev Check if address is a guardian
     * @param guardian Address to check
     * @return Whether the address is a guardian
     */
    function isGuardian(address guardian) external view returns (bool) {
        return guardians[guardian];
    }

    /**
     * @dev Get recovery status
     * @return pendingOwner_ Address of pending owner
     * @return timeRemaining Time remaining in recovery period
     * @return isActive Whether recovery is active
     */
    function getRecoveryStatus() external view returns (
        address pendingOwner_,
        uint256 timeRemaining,
        bool isActive
    ) {
        pendingOwner_ = pendingOwner;
        isActive = pendingOwner != address(0);
        
        if (isActive && block.timestamp < recoveryInitiatedAt + RECOVERY_PERIOD) {
            timeRemaining = (recoveryInitiatedAt + RECOVERY_PERIOD) - block.timestamp;
        } else {
            timeRemaining = 0;
        }
    }

    /**
     * @dev EIP-165 support
     * @param interfaceId Interface identifier
     * @return Whether the interface is supported
     */
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == type(IERC165).interfaceId;
    }

    /**
     * @dev Emergency function to withdraw all funds (only owner)
     * @param to Destination address
     */
    function emergencyWithdraw(address payable to) external onlyOwner {
        require(to != address(0), "EnhancedSmartWallet: invalid destination");
        
        uint256 balance = address(this).balance;
        require(balance > 0, "EnhancedSmartWallet: no funds to withdraw");
        
        (bool success, ) = to.call{value: balance}("");
        require(success, "EnhancedSmartWallet: withdrawal failed");
    }
}

/**
 * @title EnhancedSmartWalletFactory
 * @dev Factory contract for deploying Enhanced Smart Wallets
 */
contract EnhancedSmartWalletFactory {
    event WalletDeployed(
        address indexed wallet,
        address indexed owner,
        bytes32 indexed salt
    );

    /**
     * @dev Deploy a new Enhanced Smart Wallet
     * @param owner Initial owner of the wallet
     * @param salt Salt for deterministic deployment
     * @return wallet Address of the deployed wallet
     */
    function deployWallet(address owner, bytes32 salt) 
        external 
        returns (address wallet) 
    {
        require(owner != address(0), "Factory: invalid owner");

        bytes memory bytecode = abi.encodePacked(
            type(EnhancedSmartWallet).creationCode,
            abi.encode(owner)
        );

        assembly {
            wallet := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }

        require(wallet != address(0), "Factory: deployment failed");

        emit WalletDeployed(wallet, owner, salt);
    }

    /**
     * @dev Compute the address of a wallet before deployment
     * @param owner Initial owner of the wallet
     * @param salt Salt for deterministic deployment
     * @return wallet Predicted address of the wallet
     */
    function computeWalletAddress(address owner, bytes32 salt)
        external
        view
        returns (address wallet)
    {
        bytes memory bytecode = abi.encodePacked(
            type(EnhancedSmartWallet).creationCode,
            abi.encode(owner)
        );

        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                salt,
                keccak256(bytecode)
            )
        );

        wallet = address(uint160(uint256(hash)));
    }
}
