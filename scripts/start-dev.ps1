<#
.SYNOPSIS
  Start local development services for VeloSight (Supabase, Frontend, Backend) in separate PowerShell windows.

.DESCRIPTION
  This script launches the local development services:
   - `supabase start` (Supabase local stack)
   - `pnpm dev` (Vite frontend on port 5173/8080)
   - `npm run dev:backend` (TypeScript Express backend on port 3001)

  Each service is started in its own PowerShell window so you can view logs independently.

.USAGE
  - From a PowerShell prompt in the repo root run:
      ./scripts/start-dev.ps1

  - To run all commands inline in the same window (blocking), call with the -Inline switch:
      ./scripts/start-dev.ps1 -Inline

.NOTES
  - This script assumes the repo root is the current directory when run.
  - Adjust the $RepoRoot variable if you keep this script in a different location.
  - Backend requires .env.local with Azure and Supabase credentials.
#>

param(
  [switch]$Inline = $false
)

# === Adjust this if your workspace lives elsewhere ===
$RepoRoot = "C:\Users\Luke Baker\OneDrive - fidere.au\VeloSight\Velosight_Development\velosight"

Write-Host "VeloSight: starting development environment (Inline=$Inline)"
Write-Host ""
Write-Host "Services:"
Write-Host "  - Supabase (local stack)"
Write-Host "  - Frontend (Vite) -> http://localhost:5173 or http://localhost:8080"
Write-Host "  - Backend (Express) -> http://localhost:3001"
Write-Host ""

if ($Inline) {
  Push-Location $RepoRoot
  try {
    Write-Host "[1/3] Starting Supabase (inline) - this will block until stopped"
    supabase start

    Write-Host "[2/3] Starting frontend (inline) - this will block until stopped"
    pnpm dev

    Write-Host "[3/3] Starting TypeScript backend (inline)"
    npm run dev:backend

  } finally {
    Pop-Location
  }
  return
}

# Helper to launch a command in a new PowerShell window (keeps the window open)
function Start-InNewWindow($workingDir, $title, $command) {
  $escapedCmd = $command -replace '"','`"'
  $arg = "-NoExit -Command cd `"$workingDir`"; $escapedCmd"
  Start-Process -FilePath "powershell.exe" -ArgumentList $arg -WindowStyle Normal -WorkingDirectory $workingDir
  Write-Host "Launched: $title"
}

# 1) Supabase
Start-InNewWindow -workingDir $RepoRoot -title "Supabase" -command "Write-Host 'Starting Supabase services...'; supabase start"

# 2) Frontend (Vite)
Start-InNewWindow -workingDir $RepoRoot -title "Frontend (Vite)" -command "Write-Host 'Starting frontend (Vite) on port 5173...'; pnpm dev"

# 3) TypeScript Backend (Express on port 3001)
$backendCmd = "Write-Host 'Starting TypeScript backend on port 3001...'; npm run dev:backend"
Start-InNewWindow -workingDir $RepoRoot -title "Backend (Express)" -command $backendCmd

Write-Host ""
Write-Host "Startup complete. Check the new PowerShell windows for logs."
Write-Host ""
Write-Host "Endpoints:"
Write-Host "  Frontend:  http://localhost:5173 (or 8080)"
Write-Host "  Backend:   http://localhost:3001/api"
Write-Host "  Supabase:  http://localhost:54321 (Studio: 54323)"
