@echo off
REM BlockDAG Smart Wallet Startup Script for Windows

echo 🚀 Starting BlockDAG Smart Wallet...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Run this script from the project root directory
    exit /b 1
)

REM Kill any existing processes
echo 🔧 Cleaning up existing processes...
taskkill /f /im node.exe 2>nul || echo No node processes to kill

REM Wait a moment for processes to clean up
timeout /t 2 /nobreak >nul

REM Start Backend (Enhanced Server)
echo 🔥 Starting Enhanced Backend Server...
cd backend

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing backend dependencies...
    call npm install
)

REM Start the enhanced server
start "Backend Server" cmd /c "node src/enhanced-server.js > ../backend.log 2>&1"
echo ✅ Backend server starting...

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM Start Frontend
echo 🎨 Starting Frontend...
cd ../frontend

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing frontend dependencies...
    call npm install
)

REM Start frontend
start "Frontend Server" cmd /c "npm start > ../frontend.log 2>&1"
echo ✅ Frontend server starting...

echo.
echo 🎉 BlockDAG Smart Wallet is starting up!
echo.
echo 📊 Services:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:4000
echo.
echo 📝 Check the console windows for logs
echo.
echo 🛑 To stop: Close the console windows or use Ctrl+C
echo.

pause
