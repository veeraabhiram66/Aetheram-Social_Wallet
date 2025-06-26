const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Real Guardian Functionality", function () {
    let smartWallet;
    let factory;
    let owner;
    let guardian1;
    let guardian2;
    let guardian3;
    let nonGuardian;    beforeEach(async function () {
        // Get test accounts
        [owner, guardian1, guardian2, guardian3, nonGuardian] = await ethers.getSigners();

        // Deploy SmartWallet implementation
        const SmartWallet = await ethers.getContractFactory("SmartWallet");
        const implementation = await SmartWallet.deploy([guardian1.address, guardian2.address]);
        await implementation.waitForDeployment();

        // Deploy Factory
        const SmartWalletFactory = await ethers.getContractFactory("SmartWalletFactory");
        factory = await SmartWalletFactory.deploy(await implementation.getAddress());
        await factory.waitForDeployment();

        // Deploy a wallet through factory with guardian addresses
        const salt = ethers.randomBytes(32);
        const guardians = [guardian1.address, guardian2.address];
        await factory.connect(owner).deployWallet(guardians, salt);
        
        const walletAddress = await factory.predictWalletAddress(owner.address, salt);
        smartWallet = SmartWallet.attach(walletAddress);
    });describe("Guardian Management", function () {
        it("Should add guardian (REAL)", async function () {
            const initialCount = await smartWallet.getGuardianCount();
            
            // Add guardian3 as new guardian
            await smartWallet.connect(owner).addGuardian(guardian3.address);
            
            const newCount = await smartWallet.getGuardianCount();
            expect(newCount).to.equal(initialCount + 1n);
            
            // Verify guardian was actually added
            const isGuardian = await smartWallet.isGuardian(guardian3.address);
            expect(isGuardian).to.be.true;
        });        it("Should remove guardian (REAL)", async function () {
            const initialCount = await smartWallet.getGuardianCount();
            
            // First add a third guardian so we can remove one
            await smartWallet.connect(owner).addGuardian(guardian3.address);
            
            // Now remove one guardian
            await smartWallet.connect(owner).removeGuardian(guardian2.address);
            
            const newCount = await smartWallet.getGuardianCount();
            expect(newCount).to.equal(initialCount); // 2 + 1 - 1 = 2
            
            // Verify guardian was actually removed
            const isGuardian = await smartWallet.isGuardian(guardian2.address);
            expect(isGuardian).to.be.false;
        });

        it("Should update threshold automatically (REAL)", async function () {
            const initialThreshold = await smartWallet.requiredApprovals();
            const initialCount = await smartWallet.getGuardianCount();
            
            // Add guardian3 (should auto-adjust threshold)
            await smartWallet.connect(owner).addGuardian(guardian3.address);
            
            const newThreshold = await smartWallet.requiredApprovals();
            const newCount = await smartWallet.getGuardianCount();
            
            // Threshold should be calculated as 60% of guardians (rounded up)
            const expectedThreshold = (newCount * 60n + 99n) / 100n;
            expect(newThreshold).to.equal(expectedThreshold >= 2n ? expectedThreshold : 2n);
        });        it("Should reject non-owner guardian operations", async function () {
            // Non-owner cannot add guardian
            await expect(
                smartWallet.connect(nonGuardian).addGuardian(nonGuardian.address)
            ).to.be.revertedWith("Not owner");

            // Non-owner cannot remove guardian
            await expect(
                smartWallet.connect(nonGuardian).removeGuardian(guardian1.address)
            ).to.be.revertedWith("Not owner");

            // Non-owner cannot set recovery threshold
            await expect(
                smartWallet.connect(nonGuardian).setRecoveryThreshold(3)
            ).to.be.revertedWith("Not owner");
        });
    });    describe("Recovery Process", function () {
        it("Should initiate recovery (REAL)", async function () {
            const newOwner = nonGuardian.address;
            
            // Guardian initiates recovery
            await smartWallet.connect(guardian1).initiateRecovery(newOwner);
            
            // Check recovery info
            const recoveryInfo = await smartWallet.getRecoveryInfo();
            expect(recoveryInfo.exists).to.be.true;
            expect(recoveryInfo.newOwner).to.equal(newOwner);
            expect(recoveryInfo.approvals).to.equal(1n);
        });        it("Should approve recovery (REAL)", async function () {
            const newOwner = nonGuardian.address;
            
            // Guardian1 initiates recovery
            await smartWallet.connect(guardian1).initiateRecovery(newOwner);
            
            // Guardian2 approves recovery (no parameters needed)
            await smartWallet.connect(guardian2).approveRecovery();
            
            // Check approval count increased
            const recoveryInfo = await smartWallet.getRecoveryInfo();
            expect(recoveryInfo.approvals).to.equal(2n);
        });

        it("Should finalize recovery when conditions met (REAL)", async function () {
            const newOwner = nonGuardian.address;
            const initialOwner = await smartWallet.owner();
            
            // Guardian1 initiates recovery
            await smartWallet.connect(guardian1).initiateRecovery(newOwner);
              // Guardian2 approves recovery
            await smartWallet.connect(guardian2).approveRecovery();
            
            // Wait for recovery delay (simulate time passing)
            await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]); // 1 day + 1 second
            await ethers.provider.send("evm_mine", []);
            
            // Finalize recovery
            await smartWallet.finalizeRecovery();
            
            // Check if owner changed
            const currentOwner = await smartWallet.owner();
            expect(currentOwner).to.equal(newOwner);
        });        it("Should reject non-guardian recovery operations", async function () {
            const newOwner = nonGuardian.address;
            
            // Non-guardian cannot initiate recovery
            await expect(
                smartWallet.connect(nonGuardian).initiateRecovery(newOwner)
            ).to.be.revertedWith("Not guardian");

            // First, let guardian initiate recovery
            await smartWallet.connect(guardian1).initiateRecovery(newOwner);

            // Non-guardian cannot approve recovery
            await expect(
                smartWallet.connect(nonGuardian).approveRecovery()
            ).to.be.revertedWith("Not guardian");
        });
    });    describe("Guardian Data Reading", function () {        it("Should read guardian list (REAL)", async function () {
            const guardiansCount = await smartWallet.getGuardianCount();
            expect(Number(guardiansCount)).to.be.greaterThan(0);
            
            // Get all guardians
            const guardianList = await smartWallet.getGuardians();
            expect(guardianList.length).to.equal(Number(guardiansCount));
            
            // Verify each guardian
            for (let i = 0; i < guardianList.length; i++) {
                const guardianAddr = guardianList[i];
                expect(ethers.isAddress(guardianAddr)).to.be.true;
                
                // Verify they are actually guardians
                const isGuardian = await smartWallet.isGuardian(guardianAddr);
                expect(isGuardian).to.be.true;
            }
        });        it("Should read guardian threshold (REAL)", async function () {
            const threshold = await smartWallet.requiredApprovals();
            expect(Number(threshold)).to.be.greaterThan(0);
        });

        it("Should check guardian status (REAL)", async function () {
            // Check existing guardians
            expect(await smartWallet.isGuardian(guardian1.address)).to.be.true;
            expect(await smartWallet.isGuardian(guardian2.address)).to.be.true;
            
            // Check non-guardian
            expect(await smartWallet.isGuardian(nonGuardian.address)).to.be.false;
        });
    });    describe("Integration Test - Full Guardian Lifecycle", function () {
        it("Should handle complete guardian management cycle (REAL)", async function () {
            console.log("🧪 Starting Full Guardian Lifecycle Test");
            
            // 1. Read initial state
            const initialCount = await smartWallet.getGuardianCount();
            const initialThreshold = await smartWallet.requiredApprovals();
            console.log(`Initial: ${initialCount} guardians, threshold ${initialThreshold}`);
            
            // 2. Add new guardian
            await smartWallet.connect(owner).addGuardian(guardian3.address);
            const afterAddCount = await smartWallet.getGuardianCount();
            console.log(`After add: ${afterAddCount} guardians`);
            expect(afterAddCount).to.equal(initialCount + 1n);
              // 3. Check threshold auto-adjustment
            const newThreshold = await smartWallet.requiredApprovals();
            console.log(`New threshold: ${newThreshold}`);
            expect(Number(newThreshold)).to.be.greaterThanOrEqual(2);
            
            // 4. Test recovery process
            const newOwner = nonGuardian.address;
            await smartWallet.connect(guardian1).initiateRecovery(newOwner);
            
            let recoveryInfo = await smartWallet.getRecoveryInfo();
            console.log(`Recovery initiated, approvals: ${recoveryInfo.approvals}`);
            expect(recoveryInfo.approvals).to.equal(1n);
              // 5. More guardians approve
            await smartWallet.connect(guardian2).approveRecovery();
            recoveryInfo = await smartWallet.getRecoveryInfo();
            console.log(`After second approval: ${recoveryInfo.approvals}`);
            
            // 6. Remove guardian
            await smartWallet.connect(owner).removeGuardian(guardian3.address);
            const finalCount = await smartWallet.getGuardianCount();
            console.log(`Final: ${finalCount} guardians`);
            expect(finalCount).to.equal(initialCount);
            
            console.log("✅ Full Guardian Lifecycle Test Completed");
        });
    });
});
