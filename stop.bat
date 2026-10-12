@echo off
setlocal enabledelayedexpansion
title Stop DevOps TaskFlow Server

echo ========================================================
echo       STOPPING DEVOPS TASKFLOW SERVER
echo ========================================================
echo.

cd /d "%~dp0"
set STOPPED=0

if exist ".server.pid" (
    set /p SAVED_PID=<.server.pid
    if defined SAVED_PID (
        echo [1/2] Terminating server process [PID: !SAVED_PID!]...
        taskkill /F /PID !SAVED_PID! >nul 2>&1
        set STOPPED=1
    )
    del /f /q ".server.pid" >nul 2>&1
)

echo [2/2] Checking port 3000 listeners...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    set "PORT_PID=%%a"
    if defined PORT_PID (
        echo       Terminating active listener on port 3000 [PID: !PORT_PID!]...
        taskkill /F /PID !PORT_PID! >nul 2>&1
        set STOPPED=1
    )
)

echo.
echo ========================================================
if "!STOPPED!"=="1" (
    echo   SERVER STOPPED SUCCESSFULLY!
    echo   Port 3000 has been freed up.
) else (
    echo   SERVER IS ALREADY STOPPED. Port 3000 is free.
)
echo ========================================================
echo.
