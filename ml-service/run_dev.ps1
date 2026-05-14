# Start AAROH FastAPI (from ml-service directory)
Set-Location $PSScriptRoot
if (Test-Path ".\venv\Scripts\Activate.ps1") {
    . .\venv\Scripts\Activate.ps1
}
Write-Host "Starting uvicorn on http://127.0.0.1:8000 (docs: /docs)" -ForegroundColor Green
uvicorn app:app --reload --host 127.0.0.1 --port 8000
