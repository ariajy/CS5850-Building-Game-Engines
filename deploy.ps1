# PowerShell deployment script for GitHub Pages
Write-Host "Building the project..." -ForegroundColor Green
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Setting up temporary directory..." -ForegroundColor Green
$tempDir = Join-Path $env:TEMP "gh-pages-deploy-$(Get-Random)"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
Copy-Item -Path "dist\*" -Destination $tempDir -Recurse -Force

try {
    Write-Host "Switching to gh-pages branch..." -ForegroundColor Green
    git checkout -B gh-pages

    Write-Host "Cleaning current branch..." -ForegroundColor Green
    git rm -rf . --ignore-unmatch 2>$null

    Write-Host "Copying built files..." -ForegroundColor Green
    Copy-Item -Path "$tempDir\*" -Destination "." -Recurse -Force

    Write-Host "Adding files to git..." -ForegroundColor Green
    git add .
    git commit -m "Deploy to GitHub Pages - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

    Write-Host "Pushing to GitHub..." -ForegroundColor Green
    git push origin gh-pages --force

    Write-Host "Switching back to main branch..." -ForegroundColor Green
    git checkout main

    Write-Host "Deployment complete!" -ForegroundColor Green
    Write-Host "Your site should be available at: https://ariajy.github.io/CS5850-Building-Game-Engines/" -ForegroundColor Cyan
}
catch {
    Write-Host "Deployment failed: $_" -ForegroundColor Red
    git checkout main 2>$null
    exit 1
}
finally {
    Write-Host "Cleaning up..." -ForegroundColor Green
    Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}
