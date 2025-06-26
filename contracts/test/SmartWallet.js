require("@nomicfoundation/hardhat-chai-matchers");
const { ethers } = require("hardhat");
const { expect } = require("chai");
const { utils, Wallet } = require("ethers");

describe("SmartWallet", function () {
  let SmartWallet, wallet, owner, guardian1, guardian2, guardian3, other;
  let metaWallet, metaWalletAddress;

  beforeEach(async function () {
    [owner, guardian1, guardian2, guardian3, other] = await ethers.getSigners();
    SmartWallet = await ethers.getContractFactory("SmartWallet");
    wallet = await SmartWallet.deploy([guardian1.address, guardian2.address]);
  });
  it("should set owner and guardians with smart threshold", async function () {
    expect(await wallet.owner()).to.equal(owner.address);
    const guardians = await wallet.getGuardians();
    expect(guardians).to.include(guardian1.address);
    expect(guardians).to.include(guardian2.address);
    expect(await wallet.getGuardianCount()).to.equal(2);
    // Smart threshold: ceil(2 * 0.6) = 2
    expect(await wallet.requiredApprovals()).to.equal(2);
  });

  it("should allow owner to add and remove guardians with threshold adjustment", async function () {
    // Add third guardian
    await wallet.addGuardian(guardian3.address);
    expect(await wallet.getGuardianCount()).to.equal(3);
    // Smart threshold: ceil(3 * 0.6) = 2
    expect(await wallet.requiredApprovals()).to.equal(2);
    
    // Add fourth guardian (should increase threshold)
    await wallet.addGuardian(other.address);
    expect(await wallet.getGuardianCount()).to.equal(4);
    // Smart threshold: ceil(4 * 0.6) = 3
    expect(await wallet.requiredApprovals()).to.equal(3);
    
    // Remove guardian (should adjust threshold down)
    await wallet.removeGuardian(other.address);
    expect(await wallet.getGuardianCount()).to.equal(3);
    expect(await wallet.requiredApprovals()).to.equal(2);
  });

  it("should allow owner to execute transaction", async function () {
    const tx = await wallet.executeTransaction(other.address, 0, "0x");
    await expect(tx).to.emit(wallet, "Executed");
  });
  it("should allow guardians to initiate and approve recovery with M-of-N voting", async function () {
    // Initiate recovery (guardian1 auto-approves)
    await wallet.connect(guardian1).initiateRecovery(other.address);
    
    let recoveryInfo = await wallet.getRecoveryInfo();
    expect(recoveryInfo.exists).to.be.true;
    expect(recoveryInfo.approvals).to.equal(1);
    expect(recoveryInfo.requiredApprovals_).to.equal(2);
    expect(await wallet.hasApprovedRecovery(guardian1.address)).to.be.true;
    
    // Guardian2 approves
    await wallet.connect(guardian2).approveRecovery();
    recoveryInfo = await wallet.getRecoveryInfo();
    expect(recoveryInfo.approvals).to.equal(2);
    expect(await wallet.hasApprovedRecovery(guardian2.address)).to.be.true;
    
    // Fast forward past delay
    await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]);
    await ethers.provider.send("evm_mine");
    
    // Should be able to finalize
    recoveryInfo = await wallet.getRecoveryInfo();
    expect(recoveryInfo.canFinalize).to.be.true;
    
    await wallet.finalizeRecovery();
    expect(await wallet.owner()).to.equal(other.address);
  });
  it("should not allow non-guardians to initiate recovery", async function () {
    await expect(wallet.connect(other).initiateRecovery(other.address)).to.be.revertedWith("Not guardian");
  });  it("should allow owner to set custom recovery threshold", async function () {
    // Add more guardians first (skipping owner at index 0)
    await wallet.addGuardian(guardian3.address);
    const signers = await ethers.getSigners();
    // Skip owner (index 0), guardian1 (index 1), guardian2 (index 2), guardian3 (index 3), other (index 4)
    await wallet.addGuardian(signers[5].address);
    await wallet.addGuardian(signers[6].address);
    
    expect(await wallet.getGuardianCount()).to.equal(5);
    
    // Check current threshold (should be 3 due to smart calculation: ceil(5 * 0.6) = 3)
    expect(await wallet.requiredApprovals()).to.equal(3);
    
    // Set a different custom threshold (4 out of 5)
    await wallet.setRecoveryThreshold(4);
    expect(await wallet.requiredApprovals()).to.equal(4);
    
    // Test recovery with new threshold (need 4 approvals)
    await wallet.connect(guardian1).initiateRecovery(other.address);
    await wallet.connect(guardian2).approveRecovery();
    await wallet.connect(guardian3).approveRecovery();
    await wallet.connect(signers[5]).approveRecovery();
    
    let recoveryInfo = await wallet.getRecoveryInfo();
    expect(recoveryInfo.approvals).to.equal(4);
    expect(recoveryInfo.requiredApprovals_).to.equal(4);
    
    await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]);
    await ethers.provider.send("evm_mine");
    
    await wallet.finalizeRecovery();
    expect(await wallet.owner()).to.equal(other.address);
  });

  it("should prevent recovery with insufficient approvals", async function () {
    await wallet.connect(guardian1).initiateRecovery(other.address);
    
    // Only 1 approval (initiator), need 2
    await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]);
    await ethers.provider.send("evm_mine");
    
    await expect(wallet.finalizeRecovery()).to.be.revertedWith("Insufficient approvals");
  });

  it("should handle recovery expiration", async function () {
    await wallet.connect(guardian1).initiateRecovery(other.address);
    
    // Fast forward past expiration (7 days)
    await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");
    
    let recoveryInfo = await wallet.getRecoveryInfo();
    expect(recoveryInfo.canFinalize).to.be.false;
    
    await expect(wallet.finalizeRecovery()).to.be.revertedWith("Recovery expired");
    
    // Should be able to cancel expired recovery
    await wallet.cancelRecovery();
    recoveryInfo = await wallet.getRecoveryInfo();
    expect(recoveryInfo.exists).to.be.false;
  });  it("should enforce guardian limits and validations", async function () {
    // Cannot add owner as guardian
    await expect(wallet.addGuardian(owner.address)).to.be.revertedWith("Owner cannot be guardian");
    
    // Cannot add zero address
    await expect(wallet.addGuardian(ethers.ZeroAddress)).to.be.revertedWith("Zero address");
    
    // Cannot add duplicate guardian
    await expect(wallet.addGuardian(guardian1.address)).to.be.revertedWith("Already guardian");
    
    // Test maximum guardians limit (start with 2, add 8 more to reach 10)
    const signers = await ethers.getSigners();
    let guardianCount = await wallet.getGuardianCount();
    
    // Skip owner (0), guardian1 (1), guardian2 (2), guardian3 (3), other (4)
    for (let i = 5; i < 13 && guardianCount < 10; i++) {
      await wallet.addGuardian(signers[i].address);
      guardianCount = await wallet.getGuardianCount();
    }
    
    expect(await wallet.getGuardianCount()).to.equal(10); // Should now have 10 guardians
    
    // Should fail when trying to exceed MAX_GUARDIANS (10)
    await expect(wallet.addGuardian(signers[13].address)).to.be.revertedWith("Max guardians reached");
  });

  describe("Meta-transaction EIP-712", function () {
    const TEST_OWNER_KEY = "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113b37eae6c5f7c3e8b8e8e9e7a";
    let TEST_OWNER;
    beforeEach(async function () {
      TEST_OWNER = new Wallet(TEST_OWNER_KEY, ethers.provider);
      metaWallet = await SmartWallet.deploy([guardian1.address, guardian2.address]);
      metaWalletAddress = metaWallet.target; // ethers v6: use .target for contract address
      await metaWallet.transferOwnership(TEST_OWNER.address);
      await owner.sendTransaction({ to: TEST_OWNER.address, value: ethers.parseEther("10") });
    });    it("should execute meta-transaction with valid EIP-712 signature", async function () {
      const to = other.address;
      const value = 0;
      const data = "0x";
      const chainId = Number((await ethers.provider.getNetwork()).chainId);
      const nonce = Number(await metaWallet.nonces(TEST_OWNER.address));
      const domain = {
        name: "SmartWallet",
        version: "1",
        chainId,
        verifyingContract: metaWalletAddress,
      };
      const types = {
        MetaTransaction: [
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "data", type: "bytes32" },
          { name: "nonce", type: "uint256" },
        ],
      };
      const message = { to, value, data: ethers.keccak256(data), nonce };
      const signature = await TEST_OWNER.signTypedData(domain, types, message);
      await expect(
        metaWallet.connect(other).executeMetaTransaction(to, value, data, nonce, signature)
      ).to.emit(metaWallet, "MetaTransactionExecuted");
      expect(await metaWallet.nonces(TEST_OWNER.address)).to.equal(BigInt(nonce + 1));
    });

    it("should reject meta-transaction with invalid signature", async function () {
      const to = other.address;
      const value = 0;
      const data = "0x";
      const chainId = Number((await ethers.provider.getNetwork()).chainId);
      const nonce = Number(await metaWallet.nonces(TEST_OWNER.address));
      const domain = {
        name: "SmartWallet",
        version: "1",
        chainId,
        verifyingContract: metaWalletAddress,
      };
      const types = {
        MetaTransaction: [
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "data", type: "bytes32" },
          { name: "nonce", type: "uint256" },
        ],
      };
      const message = { to, value, data: ethers.keccak256(data), nonce };
      const signature = await other.signTypedData(domain, types, message);
      await expect(
        metaWallet.connect(other).executeMetaTransaction(to, value, data, nonce, signature)
      ).to.be.revertedWith("Invalid signature");
    });    it("should prevent replay attacks with used nonce", async function () {
      const to = other.address;
      const value = 0;
      const data = "0x";
      const chainId = Number((await ethers.provider.getNetwork()).chainId);
      const nonce = Number(await metaWallet.nonces(TEST_OWNER.address));
      const domain = {
        name: "SmartWallet",
        version: "1",
        chainId,
        verifyingContract: metaWalletAddress,
      };
      const types = {
        MetaTransaction: [
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "data", type: "bytes32" },
          { name: "nonce", type: "uint256" },
        ],
      };
      const message = { to, value, data: ethers.keccak256(data), nonce };
      const signature = await TEST_OWNER.signTypedData(domain, types, message);
      await metaWallet.connect(other).executeMetaTransaction(to, value, data, nonce, signature);
      // Try to replay
      await expect(
        metaWallet.connect(other).executeMetaTransaction(to, value, data, nonce, signature)
      ).to.be.revertedWith("Invalid nonce");
    });
  });
});
