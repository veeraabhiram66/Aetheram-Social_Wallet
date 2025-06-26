@echo off
echo 🚀 Deploying Smart Wallet...
echo.

echo ⚠️  Make sure your deployer account has enough BDAG for gas fees!
echo 👤 Deployer: 0x484eab4066d5631754C329Cc27FA6213ba038cc8
echo.

pause

node deploy-smart-wallet.js

echo.
echo ✅ Deployment script completed.
echo 📖 Check the output above for next steps.
pause
