@echo off
setlocal enabledelayedexpansion
title DevOps TaskFlow Server Manager

echo ========================================================
echo       STARTING DEVOPS TASKFLOW SERVER
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/4] Checking for existing instances on port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    set "OLD_PID=%%a"
    if defined OLD_PID (
        echo       Stopping existing process on port 3000 [PID: !OLD_PID!]...
        taskkill /F /PID !OLD_PID! >nul 2>&1
    )
)

if not exist "node_modules\" (
    echo [2/4] Installing dependencies...
    call npm install
) else (
    echo [2/4] Dependencies verified.
)

echo [3/4] Launching background server...
powershell -NoProfile -Command "$dir = Get-Location; $p = Start-Process -FilePath 'node' -ArgumentList 'src/server.js' -WorkingDirectory $dir -PassThru -WindowStyle Hidden; $p.Id | Out-File -FilePath '.server.pid' -Encoding ascii -NoNewline"

echo [4/4] Verifying server health...
powershell -NoProfile -Command "Start-Sleep -Seconds 2; try { $res = Invoke-RestMethod -Uri 'http://localhost:3000/api/health' -TimeoutSec 3; Write-Host ('      API Health: ' + $res.status + ' (Node ' + $res.nodeVersion + ')') -ForegroundColor Green } catch { Write-Host '      Waiting for server...' -ForegroundColor Yellow }"

echo.
echo ========================================================
echo   SERVER IS LIVE AND RUNNING!
echo ========================================================
echo   Web Dashboard: http://localhost:3000
echo   Health Check:  http://localhost:3000/api/health
echo   Stop Server:   Double-click stop.bat
echo ========================================================
echo.

start http://localhost:3000
