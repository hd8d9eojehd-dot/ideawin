# GitHub Push Script for IdeaWin Platform
# Run this script to push your code to GitHub

Write-Host "=== IdeaWin Platform - GitHub Push ===" -ForegroundColor Cyan
Write-Host ""

# Get GitHub username
$username = Read-Host "Enter your GitHub username"

if ([string]::IsNullOrWhiteSpace($username)) {
    Write-Host "Error: GitHub username is required" -ForegroundColor Red
    exit 1
}

$repoName = "ideawin-platform"
$repoUrl = "https://github.com/$username/$repoName.git"

Write-Host ""
Write-Host "Repository URL: $repoUrl" -ForegroundColor Yellow
Write-Host ""
Write-Host "Please create this repository on GitHub first:" -ForegroundColor Yellow
Write-Host "1. Go to https://github.com/new" -ForegroundColor White
Write-Host "2. Repository name: $repoName" -ForegroundColor White
Write-Host "3. Make it Public or Private (your choice)" -ForegroundColor White
Write-Host "4. DO NOT initialize with README, .gitignore, or license" -ForegroundColor White
Write-Host ""

$continue = Read-Host "Have you created the repository? (y/n)"

if ($continue -ne "y") {
    Write-Host "Exiting. Please create the repository first." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Setting up remote..." -ForegroundColor Cyan

# Remove existing origin if any
git remote remove origin 2>$null

# Add new origin
git remote add origin $repoUrl

# Rename branch to main if needed
$currentBranch = git branch --show-current
if ($currentBranch -eq "master") {
    Write-Host "Renaming branch from master to main..." -ForegroundColor Cyan
    git branch -M main
}

Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
Write-Host ""

# Push to GitHub
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Repository URL: https://github.com/$username/$repoName" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Push failed. Please check your credentials and try again." -ForegroundColor Red
    Write-Host ""
    Write-Host "If you need to authenticate, you may need to:" -ForegroundColor Yellow
    Write-Host "1. Use a Personal Access Token instead of password" -ForegroundColor White
    Write-Host "2. Generate one at: https://github.com/settings/tokens" -ForegroundColor White
    Write-Host "3. Use the token as your password when prompted" -ForegroundColor White
    Write-Host ""
}
