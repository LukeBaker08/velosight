<#
.SYNOPSIS
  Start local development services for VeloSight (Supabase, Frontend, LLM backend) in separate PowerShell windows.

.DESCRIPTION
  This script launches the usual local development services you listed:
   - `supabase start` (Supabase local stack)
   - `pnpm dev` (Vite frontend)
   - Activates the Python virtualenv and runs the LLM/backend UVicorn server

  Each service is started in its own PowerShell window so you can view logs independently.

.USAGE
  - From a PowerShell prompt in the repo root run:
      ./scripts/start-dev.ps1

  - To run all commands inline in the same window (blocking), call with the -Inline switch:
      ./scripts/start-dev.ps1 -Inline

.NOTES
  - This script assumes the repo root is the current directory when run (it uses absolute paths below for robustness).
  - Adjust the $RepoRoot variable if you keep this script in a different location.
#>

param(
  [switch]$Inline = $false
)

# === Adjust this if your workspace lives elsewhere ===
$RepoRoot = "C:\Users\Luke Baker\OneDrive - fidere.au\VeloSight\Velosight_Development\velosight"

Write-Host "VeloSight: starting development environment (Inline=$Inline)"

if ($Inline) {
  Push-Location $RepoRoot
  try {
    Write-Host "[1/3] Starting Supabase (inline) - this will block until stopped"
    supabase start

    Write-Host "[2/3] Starting frontend (inline) - this will block until stopped"
    pnpm dev

    Write-Host "[3/3] Activating virtualenv and starting backend (inline)"
    # Activate the venv for the current session, then run uvicorn
    .\ragenv\Scripts\Activate.ps1
    uvicorn src.integrations.documents.document_service:app --reload --port 8002
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
  Write-Host "Launched: $title -> $command"
}

# 1) Supabase
Start-InNewWindow -workingDir $RepoRoot -title "Supabase" -command "Write-Host 'Starting Supabase services...'; supabase start"

# 2) Frontend (Vite)
Start-InNewWindow -workingDir $RepoRoot -title "Frontend (Vite)" -command "Write-Host 'Starting frontend (Vite)...'; pnpm dev"

# 3) LLM / Backend (activate venv then start uvicorn)
$backendCmd = "Write-Host 'Activating venv and starting backend...'; .\ragenv\Scripts\Activate.ps1; uvicorn src.integrations.documents.document_service:app --reload --port 8002"
Start-InNewWindow -workingDir $RepoRoot -title "Backend (UVicorn)" -command $backendCmd

Write-Host "Startup launched. Check the new PowerShell windows for logs."