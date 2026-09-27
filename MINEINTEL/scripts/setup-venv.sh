#!/usr/bin/env bash
# Shell script to set up Python virtual environment for MINEINTEL AI Service

set -e

VENV_DIR="services/ai/venv"
REQ_FILE="services/ai/requirements.txt"

echo "Checking Python environment..."

if [ ! -d "$VENV_DIR" ]; then
    echo "Creating virtual environment at $VENV_DIR..."
    python3 -m venv "$VENV_DIR"
else
    echo "Virtual environment already exists at $VENV_DIR."
fi

PY_BIN="$VENV_DIR/bin/python"

echo "Upgrading pip..."
"$PY_BIN" -m pip install --upgrade pip

echo "Installing requirements from $REQ_FILE..."
"$PY_BIN" -m pip install -r "$REQ_FILE"

echo "Python virtual environment setup complete!"
