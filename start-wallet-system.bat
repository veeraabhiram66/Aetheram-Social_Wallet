@echo off
echo ========================================
echo   BlockDAG Smart Wallet Startup Script
echo ========================================
echo.

echo 🔍 Checking system setup...

:: Check if we're in the right directory
if not exist "backend" (
    echo ❌ Error: backend directory not found
    echo Please run this script from the BlockDAG root directory
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ❌ Error: frontend directory not found  
    echo Please run this script from the BlockDAG root directory
    pause
    exit /b 1
)

echo ✅ Directory structure looks good
echo.

echo 🚀 Starting Backend Server...
echo Opening new terminal for backend...
start "BlockDAG Backend" cmd /k "cd backend && echo Starting Enhanced Backend Server... && node src/enhanced-server.js"

:: Wait a moment for backend to start
timeout /t 3 > nul

echo.
echo 🖥️ Starting Frontend...
echo Opening new terminal for frontend...
start "BlockDAG Frontend" cmd /k "cd frontend && echo Starting React Frontend... && npm start"

echo.
echo ========================================
echo   🎉 BlockDAG Smart Wallet Started!
echo ========================================
echo.
echo 📋 What's happening:
echo   • Backend server starting on http://localhost:4000
echo   • Frontend starting on http://localhost:3000
echo   • Check the opened terminal windows for status
echo.
echo 📝 Next Steps:
echo   1. Wait for frontend to open in your browser
echo   2. Connect your MetaMask wallet
echo   3. Deploy your smart wallet if needed
echo   4. Start sending gasless transactions!
echo.
echo 🔧 If you see any errors, check the terminal windows
echo    for detailed error messages.
echo.
pause
