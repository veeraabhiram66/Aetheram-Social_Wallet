const { ethers } = require("hardhat");

async function createValidGuardians() {
    console.log("🛡️ Creating valid guardian addresses with proper checksums...\n");
    
    // Create some test addresses and get their proper checksums
    const addresses = [
        "0x742d35cc6636c0532925a3b8d1a42dc74c5bc0eb",
        "0x1234567890123456789012345678901234567890",
        "0x8ba1f109551bd432803012645hac136c77ab5dc85",
        "0x0000000000000000000000000000000000000001",
        "0x0000000000000000000000000000000000000002"
    ];
    
    console.log("✅ Valid guardian addresses with proper checksums:");
    
    addresses.forEach((addr, index) => {
        try {
            const checksummed = ethers.getAddress(addr);
            console.log(`Guardian ${index + 1}: ${checksummed}`);
        } catch (error) {
            console.log(`❌ Invalid address ${index + 1}: ${addr} - ${error.message}`);
            // Create a random valid address instead
            const randomWallet = ethers.Wallet.createRandom();
            console.log(`   Replacement: ${randomWallet.address}`);
        }
    });
}

createValidGuardians();
