Set-Location "d:\AAROH_PROJECT\ml-service"
Write-Host "Checking for existing processes on port 8000..."
$pids = netstat -ano | findstr :8000 | ForEach-Object { $parts = $_ -split '\s+'; $parts[$parts.Length-1] } | Select-Object -Unique
foreach ($p in $pids) {
    if ($p -match '^\d+$' -and $p -gt 0) {
        Write-Host "Cleaning up zombie process: $p"
        taskkill /F /PID $p /T
    }
}

if (Test-Path ".\venv\Scripts\Activate.ps1") {
    . .\venv\Scripts\Activate.ps1
}

Write-Host "Starting backend..."
python -m uvicorn app:app --reload --host 127.0.0.1 --port 8000
