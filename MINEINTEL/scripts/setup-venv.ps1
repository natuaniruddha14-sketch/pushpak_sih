# PowerShell script to set up Python virtual environment for MINEINTEL AI Service

$VENV_DIR = "services/ai/venv"
$REQ_FILE = "services/ai/requirements.txt"

Write-Host "Checking Python environment..." -ForegroundColor Cyan

if (-not (Test-Path $VENV_DIR)) {
    Write-Host "Creating virtual environment at $VENV_DIR..." -ForegroundColor Yellow
    python -m venv $VENV_DIR
} else {
    Write-Host "Virtual environment already exists at $VENV_DIR." -ForegroundColor Green
}

$PY_BIN = "$VENV_DIR/Scripts/python.exe"

Write-Host "Upgrading pip..." -ForegroundColor Yellow
& $PY_BIN -m pip install --upgrade pip

Write-Host "Installing requirements from $REQ_FILE..." -ForegroundColor Yellow
& $PY_BIN -m pip install -r $REQ_FILE

Write-Host "Python virtual environment setup complete!" -ForegroundColor Green
