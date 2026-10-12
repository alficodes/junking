@echo off
echo ========================================================
echo   LOCAL CI/CD PIPELINE SIMULATION (JENKINS REPLICA)
echo ========================================================
echo.

echo [Stage 1: Checking Node.js Environment]
node -v
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed or not in PATH!
    exit /b 1
)

echo.
echo [Stage 2: Installing Dependencies]
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to install dependencies!
    exit /b 1
)

echo.
echo [Stage 3: Running Code Quality / Linting]
call npm run lint
if %ERRORLEVEL% NEQ 0 (
    echo Error: Linting checks failed!
    exit /b 1
)

echo.
echo [Stage 4: Executing Automated Tests]
call npm test
if %ERRORLEVEL% NEQ 0 (
    echo Error: Automated unit tests failed!
    exit /b 1
)

echo.
echo [Stage 5: Building Package Artifact]
set BUILD_NUMBER=local-101
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Error: Build process failed!
    exit /b 1
)

echo.
echo [Stage 6: Deploying to Staging and Running Smoke Tests]
set DEPLOY_ENV=staging
call npm run deploy:mock
if %ERRORLEVEL% NEQ 0 (
    echo Error: Deployment smoke test failed!
    exit /b 1
)

echo.
echo ========================================================
echo   PIPELINE SUCCEEDED! Artifacts ready in dist/
echo ========================================================
