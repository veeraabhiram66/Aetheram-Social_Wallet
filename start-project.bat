@echo off
echo Starting BlockDAG Smart Wallet Backend...
cd /d "%~dp0backend"
start "BlockDAG Backend" powershell -Command "npm start; Read-Host 'Press Enter to exit'"

echo Starting BlockDAG Smart Wallet Frontend...
cd /d "%~dp0frontend"  
start "BlockDAG Frontend" powershell -Command "npm start; Read-Host 'Press Enter to exit'"

echo.
echo Both services are starting...
echo Backend: http://localhost:4000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause >nul
