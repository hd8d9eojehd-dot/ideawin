@echo off
echo ============================================
echo IdeaWin Platform - Quick GitHub Push
echo ============================================
echo.

set /p username="Enter your GitHub username: "
if "%username%"=="" (
    echo Error: Username required
    pause
    exit /b 1
)

set repo=ideawin-platform

echo.
echo Creating repository on GitHub...
echo Please visit: https://github.com/new
echo Repository name: %repo%
echo.
pause

echo.
echo Setting up git remote...
git remote remove origin 2>nul
git remote add origin https://github.com/%username%/%repo%.git

echo Renaming branch to main...
git branch -M main

echo.
echo Pushing to GitHub...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ============================================
    echo SUCCESS! Code pushed to GitHub
    echo Repository: https://github.com/%username%/%repo%
    echo ============================================
) else (
    echo.
    echo ============================================
    echo Push failed. Please check your credentials.
    echo ============================================
)

echo.
pause
