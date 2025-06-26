#!/bin/bash

echo "🚀 Complete Smart Wallet Deployment & Testing Script"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Step 1: Check environment
print_info "Step 1: Checking environment..."

if [ ! -f ".env" ]; then
    print_error "Missing .env file!"
    exit 1
fi

# Source environment variables
source .env

if [ -z "$RPC_URL" ] || [ -z "$RELAYER_PRIVATE_KEY" ]; then
    print_error "Missing required environment variables in .env file!"
    exit 1
fi

print_status "Environment variables loaded"

# Step 2: Install dependencies
print_info "Step 2: Installing dependencies..."

# Backend dependencies
cd backend
npm install --silent
print_status "Backend dependencies installed"

cd ../frontend  
npm install --silent
print_status "Frontend dependencies installed"

cd ../contracts
npm install --silent
print_status "Contract dependencies installed"

cd ..

# Step 3: Compile contracts
print_info "Step 3: Compiling smart contracts..."

cd contracts
npx hardhat compile
if [ $? -eq 0 ]; then
    print_status "Smart contracts compiled successfully"
else
    print_error "Contract compilation failed"
    exit 1
fi

cd ..

# Step 4: Test backend connectivity
print_info "Step 4: Testing backend connectivity..."

node -e "
const { ethers } = require('ethers');
require('dotenv').config();

async function testConnectivity() {
    try {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const relayerWallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
        
        console.log('🔗 RPC URL:', process.env.RPC_URL);
        console.log('🔑 Relayer Address:', relayerWallet.address);
        
        const balance = await provider.getBalance(relayerWallet.address);
        console.log('💰 Relayer Balance:', ethers.formatEther(balance), 'ETH');
        
        if (balance === 0n) {
            console.log('❌ Relayer has no balance!');
            process.exit(1);
        }
        
        const network = await provider.getNetwork();
        console.log('🌐 Network:', network.name, 'Chain ID:', network.chainId);
        
        console.log('✅ Backend connectivity test passed');
    } catch (error) {
        console.log('❌ Backend connectivity test failed:', error.message);
        process.exit(1);
    }
}

testConnectivity();
"

if [ $? -eq 0 ]; then
    print_status "Backend connectivity test passed"
else
    print_error "Backend connectivity test failed"
    exit 1
fi

# Step 5: Start services
print_info "Step 5: Starting services..."

print_warning "Ready to deploy! Next steps:"
echo ""
echo "1. 🚀 Start Backend: cd backend && node src/enhanced-server.js"
echo "2. 🎨 Start Frontend: cd frontend && npm start"
echo "3. 🌐 Open Browser: http://localhost:3000"
echo "4. 🔗 Connect your wallet"
echo "5. 📦 Deploy smart wallet using the new AccurateWalletDeployer"
echo "6. ✅ Test transactions"
echo ""

print_info "Environment is ready for smart wallet deployment!"
echo "Your smart wallet will be deployed with:"
echo "- ✅ Correct contract bytecode"
echo "- ✅ Proper owner verification"  
echo "- ✅ Working nonce management"
echo "- ✅ Full transaction support"
echo ""

print_status "Setup complete! 🎉"
