# Rental Scraper Dashboard - script de démarrage
# Usage: .\start.ps1

Write-Host "=== Rental Scraper Dashboard ===" -ForegroundColor Cyan

# 1. SSH tunnel: VPS:15432 -> localhost:25432
$tunnelActive = Get-NetTCPConnection -LocalPort 25432 -ErrorAction SilentlyContinue
if ($tunnelActive) {
    Write-Host "Tunnel SSH deja actif (port 25432)" -ForegroundColor Green
} else {
    Write-Host "Demarrage tunnel SSH..." -ForegroundColor Yellow
    $keyPath = "$env:USERPROFILE\.ssh\id_ed25519"
    Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c ssh -o StrictHostKeyChecking=no -i `"$keyPath`" -L 25432:localhost:15432 -N root@37.187.39.209" `
        -WindowStyle Hidden
    Start-Sleep -Seconds 4
    $tunnelActive = Get-NetTCPConnection -LocalPort 25432 -ErrorAction SilentlyContinue
    if ($tunnelActive) {
        Write-Host "Tunnel SSH actif" -ForegroundColor Green
    } else {
        Write-Host "AVERTISSEMENT: Tunnel SSH echec, verifie ta connexion VPS" -ForegroundColor Red
    }
}

# 2. Start Next.js
Write-Host "Dashboard: http://localhost:3000" -ForegroundColor Green
Set-Location $PSScriptRoot
cmd.exe /c "npm run dev"