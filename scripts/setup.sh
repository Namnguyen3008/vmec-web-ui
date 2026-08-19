#!/bin/bash
# Setup script cho VMEC Healthcare (P-208)

set -e

echo "=== VMEC Healthcare Project Setup ==="

# Check Python version
python3 -c "import sys; assert sys.version_info >= (3, 11), 'Python 3.11+ required'"
echo "Python version OK"

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Create .env if not exists
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env — please edit with your API keys"
fi

echo "Setup complete! Run: uvicorn backend.src.main:app --reload --port 8000"
