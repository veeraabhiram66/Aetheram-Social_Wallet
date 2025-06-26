/**
 * Guardian Feature Test Suite
 * 
 * This test file provides comprehensive testing for all guardian-related features
 * in the BlockDAG Smart Wallet project. It includes manual testing instructions,
 * automated test scenarios, and troubleshooting guides.
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
    RPC_URL: 'http://localhost:8545', // Hardhat local node
    WALLET_FACTORY_ADDRESS: process.env.REACT_APP_WALLET_FACTORY_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    PRIVATE_KEYS: [
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // Owner
        '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', // Guardian 1
        '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a', // Guardian 2
        '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6'  // Guardian 3
    ],
    TEST_TIMEOUT: 30000 // 30 seconds
};

class GuardianTestSuite {
    constructor() {
        this.provider = null;
        this.wallets = [];
        this.walletFactory = null;
        this.testResults = {
            passed: 0,
            failed: 0,
            errors: []
        };
    }

    async initialize() {
        console.log('🔄 Initializing Guardian Test Suite...');
        
        try {
            // Connect to local blockchain
            this.provider = new ethers.providers.JsonRpcProvider(TEST_CONFIG.RPC_URL);
            
            // Create test wallets
            this.wallets = TEST_CONFIG.PRIVATE_KEYS.map(key => 
                new ethers.Wallet(key, this.provider)
            );
            
            // Load smart contract ABIs and addresses
            await this.loadContracts();
            
            console.log('✅ Test suite initialized successfully');
            console.log(`📊 Test wallets: ${this.wallets.length}`);
            console.log(`🏭 Factory address: ${TEST_CONFIG.WALLET_FACTORY_ADDRESS}`);
            
        } catch (error) {
            console.error('❌ Failed to initialize test suite:', error);
            throw error;
        }
    }

    async loadContracts() {
        try {
            // Load contract artifacts
            const factoryArtifact = JSON.parse(
                fs.readFileSync(
                    path.join(__dirname, '../contracts/artifacts/contracts/SmartWalletFactory.sol/SmartWalletFactory.json'),
                    'utf8'
                )
            );
            
            const walletArtifact = JSON.parse(
                fs.readFileSync(
                    path.join(__dirname, '../contracts/artifacts/contracts/SmartWallet.sol/SmartWallet.json'),
                    'utf8'
                )
            );
            
            this.factoryABI = factoryArtifact.abi;
            this.walletABI = walletArtifact.abi;
            
            // Connect to factory contract
            this.walletFactory = new ethers.Contract(
                TEST_CONFIG.WALLET_FACTORY_ADDRESS,
                this.factoryABI,
                this.wallets[0] // Owner wallet
            );
            
        } catch (error) {
            console.error('❌ Failed to load contracts:', error);
            throw error;
        }
    }

    async runTest(testName, testFunction) {
        console.log(`\n🔬 Running test: ${testName}`);
        
        try {
            const startTime = Date.now();
            await testFunction();
            const duration = Date.now() - startTime;
            
            console.log(`✅ Test passed: ${testName} (${duration}ms)`);
            this.testResults.passed++;
            
        } catch (error) {
            console.error(`❌ Test failed: ${testName}`, error);
            this.testResults.failed++;
            this.testResults.errors.push({ test: testName, error: error.message });
        }
    }

    async testWalletCreation() {
        const owner = this.wallets[0];
        const guardians = [this.wallets[1].address, this.wallets[2].address];
        const threshold = 2;
        
        // Create a new smart wallet
        const tx = await this.walletFactory.createWallet(guardians, threshold);
        const receipt = await tx.wait();
        
        // Get the wallet address from events
        const event = receipt.events.find(e => e.event === 'WalletCreated');
        if (!event) throw new Error('WalletCreated event not found');
        
        const walletAddress = event.args.wallet;
        console.log(`📍 Created wallet at: ${walletAddress}`);
        
        // Connect to the wallet contract
        const wallet = new ethers.Contract(walletAddress, this.walletABI, owner);
        
        // Verify initial setup
        const actualThreshold = await wallet.threshold();
        const guardianCount = await wallet.getGuardianCount();
        
        if (actualThreshold.toNumber() !== threshold) {
            throw new Error(`Threshold mismatch: expected ${threshold}, got ${actualThreshold}`);
        }
        
        if (guardianCount.toNumber() !== guardians.length) {
            throw new Error(`Guardian count mismatch: expected ${guardians.length}, got ${guardianCount}`);
        }
        
        return { wallet, walletAddress };
    }

    async testAddGuardian() {
        const { wallet } = await this.testWalletCreation();
        const newGuardian = this.wallets[3].address;
        
        // Add new guardian
        const tx = await wallet.addGuardian(newGuardian);
        await tx.wait();
        
        // Verify guardian was added
        const isGuardian = await wallet.isGuardian(newGuardian);
        const guardianCount = await wallet.getGuardianCount();
        
        if (!isGuardian) {
            throw new Error('Guardian was not added successfully');
        }
        
        if (guardianCount.toNumber() !== 3) {
            throw new Error(`Expected 3 guardians, got ${guardianCount}`);
        }
        
        console.log(`✅ Successfully added guardian: ${newGuardian}`);
    }

    async testRemoveGuardian() {
        const { wallet } = await this.testWalletCreation();
        const guardianToRemove = this.wallets[1].address;
        
        // Remove guardian
        const tx = await wallet.removeGuardian(guardianToRemove);
        await tx.wait();
        
        // Verify guardian was removed
        const isGuardian = await wallet.isGuardian(guardianToRemove);
        const guardianCount = await wallet.getGuardianCount();
        
        if (isGuardian) {
            throw new Error('Guardian was not removed successfully');
        }
        
        if (guardianCount.toNumber() !== 1) {
            throw new Error(`Expected 1 guardian, got ${guardianCount}`);
        }
        
        console.log(`✅ Successfully removed guardian: ${guardianToRemove}`);
    }

    async testChangeThreshold() {
        const { wallet } = await this.testWalletCreation();
        const newThreshold = 1;
        
        // Change threshold
        const tx = await wallet.changeThreshold(newThreshold);
        await tx.wait();
        
        // Verify threshold was changed
        const actualThreshold = await wallet.threshold();
        
        if (actualThreshold.toNumber() !== newThreshold) {
            throw new Error(`Threshold not changed: expected ${newThreshold}, got ${actualThreshold}`);
        }
        
        console.log(`✅ Successfully changed threshold to: ${newThreshold}`);
    }

    async testRecoveryProcess() {
        const { wallet, walletAddress } = await this.testWalletCreation();
        const newOwner = this.wallets[3].address;
        const guardian1 = new ethers.Contract(walletAddress, this.walletABI, this.wallets[1]);
        const guardian2 = new ethers.Contract(walletAddress, this.walletABI, this.wallets[2]);
        
        // Initiate recovery
        const initTx = await guardian1.initiateRecovery(newOwner);
        const initReceipt = await initTx.wait();
        
        // Get recovery ID from event
        const recoveryEvent = initReceipt.events.find(e => e.event === 'RecoveryInitiated');
        if (!recoveryEvent) throw new Error('RecoveryInitiated event not found');
        
        const recoveryId = recoveryEvent.args.recoveryId;
        console.log(`🔄 Recovery initiated with ID: ${recoveryId}`);
        
        // Second guardian approves recovery
        const approveTx = await guardian2.approveRecovery(recoveryId);
        await approveTx.wait();
        
        // Execute recovery (should succeed with 2/2 approvals)
        const executeTx = await guardian1.executeRecovery(recoveryId);
        await executeTx.wait();
        
        // Verify new owner
        const actualOwner = await wallet.owner();
        if (actualOwner !== newOwner) {
            throw new Error(`Recovery failed: expected owner ${newOwner}, got ${actualOwner}`);
        }
        
        console.log(`✅ Recovery completed successfully. New owner: ${newOwner}`);
    }

    async testGuardianDashboardIntegration() {
        console.log('\n🖥️  Testing Guardian Dashboard Integration...');
        
        // This would test the frontend integration
        // For now, we'll simulate the key operations
        
        const { wallet, walletAddress } = await this.testWalletCreation();
        
        // Test data structure that frontend would use
        const dashboardData = {
            walletAddress,
            currentGuardians: await this.getGuardiansList(wallet),
            threshold: await wallet.threshold(),
            recoveryRequests: await this.getRecoveryRequests(wallet),
            isOwner: true,
            isGuardian: false
        };
        
        console.log('📋 Dashboard Data:', JSON.stringify(dashboardData, null, 2));
        
        // Verify data structure
        if (!Array.isArray(dashboardData.currentGuardians)) {
            throw new Error('currentGuardians should be an array');
        }
        
        if (typeof dashboardData.threshold !== 'number') {
            throw new Error('threshold should be a number');
        }
        
        console.log('✅ Guardian Dashboard data structure is valid');
    }

    async getGuardiansList(wallet) {
        const guardianCount = await wallet.getGuardianCount();
        const guardians = [];
        
        for (let i = 0; i < guardianCount.toNumber(); i++) {
            const guardianAddress = await wallet.guardians(i);
            guardians.push({
                address: guardianAddress,
                name: `Guardian ${i + 1}`, // In real app, this would come from storage
                addedAt: new Date().toISOString()
            });
        }
        
        return guardians;
    }

    async getRecoveryRequests(wallet) {
        // This would query recovery events from the blockchain
        // For now, return empty array
        return [];
    }

    async runAllTests() {
        console.log('🚀 Starting Guardian Feature Test Suite');
        console.log('='.repeat(50));
        
        await this.initialize();
        
        // Run all tests
        await this.runTest('Wallet Creation', () => this.testWalletCreation());
        await this.runTest('Add Guardian', () => this.testAddGuardian());
        await this.runTest('Remove Guardian', () => this.testRemoveGuardian());
        await this.runTest('Change Threshold', () => this.testChangeThreshold());
        await this.runTest('Recovery Process', () => this.testRecoveryProcess());
        await this.runTest('Dashboard Integration', () => this.testGuardianDashboardIntegration());
        
        // Print results
        this.printResults();
    }

    printResults() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 TEST RESULTS');
        console.log('='.repeat(50));
        console.log(`✅ Passed: ${this.testResults.passed}`);
        console.log(`❌ Failed: ${this.testResults.failed}`);
        console.log(`📈 Success Rate: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)}%`);
        
        if (this.testResults.errors.length > 0) {
            console.log('\n❌ ERRORS:');
            this.testResults.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error.test}: ${error.error}`);
            });
        }
        
        console.log('\n🏁 Test suite completed');
    }
}

// Manual Testing Instructions
const MANUAL_TESTING_GUIDE = `
🧪 MANUAL TESTING GUIDE FOR GUARDIAN FEATURES
=============================================

Prerequisites:
1. Start the local blockchain: npm run blockchain
2. Deploy contracts: npm run deploy
3. Start backend: npm run backend
4. Start frontend: npm run frontend

Test Scenarios:

1️⃣ WALLET CREATION WITH GUARDIANS
   - Navigate to the wallet creation page
   - Add 2-3 guardian addresses
   - Set threshold to 2
   - Create wallet
   - ✅ Expected: Wallet created successfully with guardians listed

2️⃣ ADD GUARDIAN (Owner Only)
   - Go to Guardian Dashboard
   - Click "Add Guardian" button (should not blink/vibrate)
   - Enter valid Ethereum address
   - Submit
   - ✅ Expected: Guardian added, UI updates, no errors

3️⃣ REMOVE GUARDIAN (Owner Only)
   - In Guardian Dashboard, find a guardian
   - Click "Remove" button
   - Confirm action
   - ✅ Expected: Guardian removed, threshold adjusts if needed

4️⃣ CHANGE THRESHOLD (Owner Only)
   - Go to Settings tab in Guardian Dashboard
   - Change threshold value
   - Submit changes
   - ✅ Expected: Threshold updated, validation prevents invalid values

5️⃣ INITIATE RECOVERY (Guardian Only)
   - Switch to a guardian account
   - Go to Recovery tab
   - Enter new owner address
   - Initiate recovery
   - ✅ Expected: Recovery request created, other guardians notified

6️⃣ APPROVE RECOVERY (Guardian Only)
   - As another guardian, view pending recovery
   - Click "Approve Recovery"
   - ✅ Expected: Recovery approved, progress updated

7️⃣ EXECUTE RECOVERY
   - When threshold met, recovery auto-executes
   - ✅ Expected: Ownership transferred, dashboard updates

UI/UX Tests:
- ✅ No button blinking or vibrating animations
- ✅ Smooth transitions between states
- ✅ Loading states during transactions
- ✅ Error handling and user feedback
- ✅ Responsive design on mobile devices

Common Issues & Troubleshooting:
❌ Button animations: Check UI.js motion values
❌ Contract calls fail: Verify contract addresses in .env
❌ Guardian not added: Check wallet ownership and gas
❌ Recovery fails: Ensure threshold requirements met
❌ UI not updating: Check state management in hooks
`;

// Export for use in other files
module.exports = {
    GuardianTestSuite,
    TEST_CONFIG,
    MANUAL_TESTING_GUIDE
};

// Run tests if this file is executed directly
if (require.main === module) {
    const testSuite = new GuardianTestSuite();
    testSuite.runAllTests().catch(console.error);
}
