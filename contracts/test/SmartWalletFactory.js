require("@nomicfoundation/hardhat-chai-matchers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SmartWalletFactory", function () {
    let factory, implementation, SmartWallet;
    let owner, user1, user2, guardian1, guardian2, guardian3, guardian4, other;

    beforeEach(async function () {
        [owner, user1, user2, guardian1, guardian2, guardian3, guardian4, other] = await ethers.getSigners();

        // Deploy SmartWallet implementation
        SmartWallet = await ethers.getContractFactory("SmartWallet");
        const tempGuardians = [guardian1.address, guardian2.address];
        implementation = await SmartWallet.deploy(tempGuardians);
        await implementation.waitForDeployment();

        // Deploy SmartWalletFactory
        const SmartWalletFactory = await ethers.getContractFactory("SmartWalletFactory");
        factory = await SmartWalletFactory.deploy(await implementation.getAddress());
        await factory.waitForDeployment();
    });

    describe("Factory Setup and Configuration", function () {
        it("should set correct implementation address", async function () {
            expect(await factory.implementation()).to.equal(await implementation.getAddress());
        });        it("should have correct initial configuration", async function () {
            expect(await factory.deploymentFee()).to.equal(0n);
            expect(await factory.deploymentPaused()).to.be.false;
            expect(await factory.getTotalWallets()).to.equal(0n);
        });

        it("should allow owner to set deployment fee", async function () {
            const newFee = ethers.parseEther("0.001");
            await factory.setDeploymentFee(newFee);
            expect(await factory.deploymentFee()).to.equal(newFee);
        });

        it("should allow owner to pause deployment", async function () {
            await factory.setDeploymentPaused(true);
            expect(await factory.deploymentPaused()).to.be.true;
        });        it("should not allow non-owner to change configuration", async function () {
            await expect(factory.connect(user1).setDeploymentFee(100))
                .to.be.reverted;
            
            await expect(factory.connect(user1).setDeploymentPaused(true))
                .to.be.reverted;
        });
    });

    describe("Wallet Deployment", function () {
        it("should deploy wallet with correct configuration", async function () {
            const guardians = [guardian1.address, guardian2.address, guardian3.address];
            const salt = ethers.randomBytes(32);

            // Predict address
            const predictedAddress = await factory.predictWalletAddress(user1.address, salt);

            // Deploy wallet
            const tx = await factory.connect(user1).deployWallet(guardians, salt);
            const receipt = await tx.wait();

            // Find the WalletDeployed event
            const event = receipt.logs.find(log => {
                try {
                    const parsed = factory.interface.parseLog(log);
                    return parsed.name === 'WalletDeployed';
                } catch {
                    return false;
                }
            });

            expect(event).to.not.be.undefined;
            const parsedEvent = factory.interface.parseLog(event);
            const [deployedOwner, walletAddress, deployedGuardians, threshold] = parsedEvent.args;

            expect(deployedOwner).to.equal(user1.address);
            expect(walletAddress).to.equal(predictedAddress);
            expect(deployedGuardians).to.deep.equal(guardians);            expect(threshold).to.equal(2n); // ceil(3 * 0.6) = 2

            // Verify wallet is properly configured
            const deployedWallet = SmartWallet.attach(walletAddress);
            expect(await deployedWallet.owner()).to.equal(user1.address);
            expect(await deployedWallet.getGuardianCount()).to.equal(3n);
            expect(await deployedWallet.requiredApprovals()).to.equal(2n);

            // Verify factory registry
            expect(await factory.isValidWallet(walletAddress)).to.be.true;
            expect(await factory.walletToOwner(walletAddress)).to.equal(user1.address);
            
            const userWallets = await factory.getUserWallets(user1.address);
            expect(userWallets).to.include(walletAddress);
            expect(await factory.getTotalWallets()).to.equal(1);
        });

        it("should deploy multiple wallets for same user", async function () {
            const guardians = [guardian1.address, guardian2.address];
            
            const salt1 = ethers.randomBytes(32);
            const salt2 = ethers.randomBytes(32);

            await factory.connect(user1).deployWallet(guardians, salt1);
            await factory.connect(user1).deployWallet(guardians, salt2);            const userWallets = await factory.getUserWallets(user1.address);
            expect(userWallets.length).to.equal(2);
            expect(await factory.getTotalWallets()).to.equal(2n);
        });

        it("should deploy wallets for different users", async function () {
            const guardians1 = [guardian1.address, guardian2.address];
            const guardians2 = [guardian3.address, guardian4.address];
            const salt = ethers.randomBytes(32);

            await factory.connect(user1).deployWallet(guardians1, salt);
            await factory.connect(user2).deployWallet(guardians2, salt);            expect((await factory.getUserWallets(user1.address)).length).to.equal(1);
            expect((await factory.getUserWallets(user2.address)).length).to.equal(1);
            expect(await factory.getTotalWallets()).to.equal(2n);
        });

        it("should require deployment fee when set", async function () {
            const fee = ethers.parseEther("0.001");
            await factory.setDeploymentFee(fee);

            const guardians = [guardian1.address, guardian2.address];
            const salt = ethers.randomBytes(32);            // Should fail without fee
            await expect(factory.connect(user1).deployWallet(guardians, salt))
                .to.be.revertedWith("Insufficient fee");

            // Should succeed with fee
            await expect(factory.connect(user1).deployWallet(guardians, salt, { value: fee }))
                .to.not.be.reverted;
        });        it("should prevent deployment when paused", async function () {
            await factory.setDeploymentPaused(true);

            const guardians = [guardian1.address, guardian2.address];
            const salt = ethers.randomBytes(32);

            await expect(factory.connect(user1).deployWallet(guardians, salt))
                .to.be.revertedWith("Deployment paused");
        });
    });    describe("Guardian Validation", function () {
        it("should reject insufficient guardians", async function () {
            const guardians = [guardian1.address]; // Only 1 guardian
            const salt = ethers.randomBytes(32);

            await expect(factory.connect(user1).deployWallet(guardians, salt))
                .to.be.revertedWith("Need at least 2 guardians");
        });

        it("should reject too many guardians", async function () {
            const guardians = [];
            for (let i = 0; i < 11; i++) {
                guardians.push(ethers.Wallet.createRandom().address);
            }
            const salt = ethers.randomBytes(32);

            await expect(factory.connect(user1).deployWallet(guardians, salt))
                .to.be.revertedWith("Too many guardians");
        });

        it("should reject zero address guardians", async function () {
            const guardians = [guardian1.address, ethers.ZeroAddress];
            const salt = ethers.randomBytes(32);

            await expect(factory.connect(user1).deployWallet(guardians, salt))
                .to.be.revertedWith("Zero guardian");
        });

        it("should reject owner as guardian", async function () {
            const guardians = [guardian1.address, user1.address];
            const salt = ethers.randomBytes(32);

            await expect(factory.connect(user1).deployWallet(guardians, salt))
                .to.be.revertedWith("Owner cannot be guardian");
        });

        it("should reject duplicate guardians", async function () {
            const guardians = [guardian1.address, guardian1.address];
            const salt = ethers.randomBytes(32);

            await expect(factory.connect(user1).deployWallet(guardians, salt))
                .to.be.revertedWith("Duplicate guardian");
        });
    });

    describe("Deterministic Addresses", function () {
        it("should predict correct wallet address", async function () {
            const guardians = [guardian1.address, guardian2.address];
            const salt = ethers.randomBytes(32);

            const predicted = await factory.predictWalletAddress(user1.address, salt);
            const tx = await factory.connect(user1).deployWallet(guardians, salt);
            const receipt = await tx.wait();

            const event = receipt.logs.find(log => {
                try {
                    const parsed = factory.interface.parseLog(log);
                    return parsed.name === 'WalletDeployed';
                } catch {
                    return false;
                }
            });

            const parsedEvent = factory.interface.parseLog(event);
            const actualAddress = parsedEvent.args[1];

            expect(actualAddress).to.equal(predicted);
        });

        it("should generate different addresses for different salts", async function () {
            const salt1 = ethers.randomBytes(32);
            const salt2 = ethers.randomBytes(32);

            const addr1 = await factory.predictWalletAddress(user1.address, salt1);
            const addr2 = await factory.predictWalletAddress(user1.address, salt2);

            expect(addr1).to.not.equal(addr2);
        });

        it("should generate different addresses for different users", async function () {
            const salt = ethers.randomBytes(32);

            const addr1 = await factory.predictWalletAddress(user1.address, salt);
            const addr2 = await factory.predictWalletAddress(user2.address, salt);

            expect(addr1).to.not.equal(addr2);
        });
    });

    describe("Fee Management", function () {
        it("should allow owner to withdraw fees", async function () {
            const fee = ethers.parseEther("0.001");
            await factory.setDeploymentFee(fee);

            const guardians = [guardian1.address, guardian2.address];
            const salt = ethers.randomBytes(32);

            // Deploy wallet with fee
            await factory.connect(user1).deployWallet(guardians, salt, { value: fee });            const initialBalance = await ethers.provider.getBalance(owner.address);
            
            // Withdraw fees
            const tx = await factory.withdrawFees(owner.address);
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;

            const finalBalance = await ethers.provider.getBalance(owner.address);
            const expectedBalance = initialBalance + fee - gasUsed;
            const tolerance = ethers.parseEther("0.0001");
            
            expect(finalBalance >= expectedBalance - tolerance && finalBalance <= expectedBalance + tolerance).to.be.true;
        });        it("should not allow non-owner to withdraw fees", async function () {
            await expect(factory.connect(user1).withdrawFees(user1.address))
                .to.be.reverted;
        });

        it("should reject withdrawal to zero address", async function () {
            await expect(factory.withdrawFees(ethers.ZeroAddress))
                .to.be.revertedWith("Zero address");
        });
    });

    describe("Factory Statistics", function () {
        it("should return correct factory stats", async function () {
            const fee = ethers.parseEther("0.001");
            await factory.setDeploymentFee(fee);

            const guardians = [guardian1.address, guardian2.address];
            
            // Deploy multiple wallets
            await factory.connect(user1).deployWallet(guardians, ethers.randomBytes(32), { value: fee });
            await factory.connect(user2).deployWallet(guardians, ethers.randomBytes(32), { value: fee });            const stats = await factory.getFactoryStats();
            expect(stats.totalWallets).to.equal(2n);
            expect(stats.totalFees).to.equal(fee * 2n);
            expect(stats.isPaused).to.be.false;
        });
    });

    describe("Wallet Functionality", function () {
        let deployedWallet;

        beforeEach(async function () {
            const guardians = [guardian1.address, guardian2.address, guardian3.address];
            const salt = ethers.randomBytes(32);

            const tx = await factory.connect(user1).deployWallet(guardians, salt);
            const receipt = await tx.wait();

            const event = receipt.logs.find(log => {
                try {
                    const parsed = factory.interface.parseLog(log);
                    return parsed.name === 'WalletDeployed';
                } catch {
                    return false;
                }
            });

            const parsedEvent = factory.interface.parseLog(event);
            const walletAddress = parsedEvent.args[1];
            deployedWallet = SmartWallet.attach(walletAddress);
        });

        it("should have functional wallet after deployment", async function () {            // Test basic wallet functionality
            expect(await deployedWallet.owner()).to.equal(user1.address);
            expect(await deployedWallet.getGuardianCount()).to.equal(3n);
            
            // Test guardian management
            await deployedWallet.connect(user1).addGuardian(guardian4.address);
            expect(await deployedWallet.getGuardianCount()).to.equal(4n);
            
            // Test recovery initiation
            await deployedWallet.connect(guardian1).initiateRecovery(other.address);
            const recoveryInfo = await deployedWallet.getRecoveryInfo();
            expect(recoveryInfo.exists).to.be.true;
            expect(recoveryInfo.newOwner).to.equal(other.address);
        });        it("should prevent reinitialization", async function () {
            const newGuardians = [guardian1.address, guardian2.address];
            await expect(deployedWallet.initialize(user2.address, newGuardians))
                .to.be.revertedWith("Already initialized");
        });
    });
});
