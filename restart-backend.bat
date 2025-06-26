@echo off
echo Restarting BlockDAG Backend Server...

REM Kill any existing node processes on port 4000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :4000') do (
    echo Killing process %%a
    taskkill /f /pid %%a 2>nul
)

cd /d "C:\Users\pveer\Documents\BlockDAG\backend"
echo Starting enhanced server...
node src/enhanced-server.js
