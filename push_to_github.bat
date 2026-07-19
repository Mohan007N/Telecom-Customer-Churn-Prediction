@echo off
title Push to GitHub - Telecom Customer Churn Prediction
echo ======================================================
echo Preparing to update Git repository and push to GitHub...
echo ======================================================

:: Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git is not installed or not in your system PATH.
    echo Please install Git from https://git-scm.com/ and try again.
    pause
    exit /b 1
)

:: Check if .git directory exists. If not, initialize repository.
if not exist .git (
    echo [INFO] Initializing new local Git repository...
    git init
    if errorlevel 1 (
        echo [ERROR] Failed to initialize git repository.
        pause
        exit /b 1
    )
)

:: Check if the remote 'origin' is set. If not, add it.
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo [INFO] Adding remote 'origin' pointing to https://github.com/Mohan007N/Telecom-Customer-Churn-Prediction ...
    git remote add origin https://github.com/Mohan007N/Telecom-Customer-Churn-Prediction
    if errorlevel 1 (
        echo [ERROR] Failed to add remote origin.
        pause
        exit /b 1
    )
) else (
    echo [INFO] Remote 'origin' is already set. Updating remote URL...
    git remote set-url origin https://github.com/Mohan007N/Telecom-Customer-Churn-Prediction
    if errorlevel 1 (
        echo [ERROR] Failed to update remote URL.
        pause
        exit /b 1
    )
)

:: Stage all changes
echo [INFO] Staging all files...
git add .
if errorlevel 1 (
    echo [ERROR] Failed to stage files.
    pause
    exit /b 1
)

:: Prompt user for a commit message
set /p commit_msg="Enter commit message [Default: Update MLOps pipeline and model artifacts]: "
if "%commit_msg%"=="" set commit_msg=Update MLOps pipeline and model artifacts

:: Commit changes
echo [INFO] Committing changes with message: "%commit_msg%"...
git commit -m "%commit_msg%"

:: Set branch name to main
echo [INFO] Setting branch name to main...
git branch -M main

:: Push changes to GitHub
echo [INFO] Pushing changes to remote repository on branch 'main'...
echo [INFO] Note: If prompted, please complete authentication in the browser or command prompt.
git push -f -u origin main
if errorlevel 1 (
    echo.
    echo [ERROR] Git push failed. 
    echo This could be due to credentials/authentication issues or merge conflicts.
    echo If there are changes on GitHub that you do not have locally, try running:
    echo   git pull origin main --rebase
    echo in your terminal first, then try this script again.
    pause
    exit /b 1
)

echo.
echo ======================================================
echo 🎉 SUCCESS! Repository updated successfully on GitHub.
echo ======================================================
pause
