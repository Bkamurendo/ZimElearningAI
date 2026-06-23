# ============================================================
# MaFundi Auto-Resume Training Script
# Waits for Supabase to recover, then restarts training
# ============================================================

$projectDir = Split-Path -Parent $PSScriptRoot
$waitMinutes = 120
$retryIntervalMinutes = 10
$maxRetries = 12  # Try for up to 2 more hours after initial wait

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  MaFundi Auto-Resume Scheduler" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Giving Supabase $waitMinutes minutes to recover..." -ForegroundColor Yellow
Write-Host "Training will auto-restart at: $((Get-Date).AddMinutes($waitMinutes).ToString('HH:mm:ss'))" -ForegroundColor Yellow
Write-Host ""

# === PHASE 1: Initial wait ===
for ($i = $waitMinutes; $i -gt 0; $i--) {
    Write-Host "`r  Resuming in $i minutes...   " -NoNewline -ForegroundColor Gray
    Start-Sleep -Seconds 60
}

Write-Host ""
Write-Host ""
Write-Host "Initial wait complete. Checking if Supabase is responsive..." -ForegroundColor Cyan

# === PHASE 2: Ping DB until alive ===
$alive = $false
for ($attempt = 1; $attempt -le $maxRetries; $attempt++) {
    Write-Host "  [Attempt $attempt/$maxRetries] Pinging database..." -ForegroundColor Gray
    
    $pingResult = & npx tsx -e @"
import path from 'path'
import dotenv from 'dotenv'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
import { createClient } from '@supabase/supabase-js'
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
try {
  const { count, error } = await s.from('knowledge_vectors').select('*', { count: 'exact', head: true })
  if (error) { console.log('FAIL:' + error.message); process.exit(1) }
  console.log('OK:' + count)
} catch(e) { console.log('FAIL:' + e.message); process.exit(1) }
"@ 2>&1

    if ($pingResult -match "^OK:") {
        $fragCount = ($pingResult -replace "OK:", "").Trim()
        Write-Host ""
        Write-Host "  Database is ALIVE! Fragment count: $fragCount" -ForegroundColor Green
        $alive = $true
        break
    } else {
        Write-Host "  Still recovering. Waiting $retryIntervalMinutes more minutes..." -ForegroundColor Yellow
        Start-Sleep -Seconds ($retryIntervalMinutes * 60)
    }
}

# === PHASE 3: Start training ===
if ($alive) {
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Green
    Write-Host "  Supabase recovered! Starting MaFundi..." -ForegroundColor Green
    Write-Host "===============================================" -ForegroundColor Green
    Write-Host ""
    Set-Location $projectDir
    & npm run train-funda
} else {
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Red
    Write-Host "  Supabase still unresponsive after all retries." -ForegroundColor Red
    Write-Host "  Please check your Supabase dashboard manually." -ForegroundColor Red
    Write-Host "  https://supabase.com/dashboard/project/pemqvgflcmbytfaunxyg" -ForegroundColor Yellow
    Write-Host "===============================================" -ForegroundColor Red
}
