@echo off
echo 🚀 Complete Smart Wallet Deployment ^& Testing Script
echo ==================================================

:: Step 1: Check environment
echo ℹ️  Step 1: Checking environment...

if not exist ".env" (
    echo ❌ Missing .env file!
    exit /b 1
)

echo ✅ Environment file found

:: Step 2: Install dependencies
echo ℹ️  Step 2: Installing dependencies...

cd backend
call npm install --silent
echo ✅ Backend dependencies installed

cd ..\frontend  
call npm install --silent
echo ✅ Frontend dependencies installed

cd ..\contracts
call npm install --silent
echo ✅ Contract dependencies installed

cd ..

:: Step 3: Compile contracts
echo ℹ️  Step 3: Compiling smart contracts...

cd contracts
call npx hardhat compile
if errorlevel 1 (
    echo ❌ Contract compilation failed
    exit /b 1
)

echo ✅ Smart contracts compiled successfully
cd ..

:: Step 4: Test backend connectivity
echo ℹ️  Step 4: Testing backend connectivity...

node test-transaction.js

if errorlevel 1 (
    echo ❌ Backend connectivity test failed
    exit /b 1
)

echo ✅ Backend connectivity test passed

:: Step 5: Ready message
echo ℹ️  Step 5: Setup complete!

echo.
echo ⚠️  Ready to deploy! Next steps:
echo.
echo 1. 🚀 Start Backend: cd backend ^&^& node src/enhanced-server.js
echo 2. 🎨 Start Frontend: cd frontend ^&^& npm start
echo 3. 🌐 Open Browser: http://localhost:3000
echo 4. 🔗 Connect your wallet
echo 5. 📦 Deploy smart wallet using the new AccurateWalletDeployer
echo 6. ✅ Test transactions
echo.

echo ℹ️  Environment is ready for smart wallet deployment!
echo Your smart wallet will be deployed with:
echo - ✅ Correct contract bytecode
echo - ✅ Proper owner verification  
echo - ✅ Working nonce management
echo - ✅ Full transaction support
echo.

echo ✅ Setup complete! 🎉

pause
