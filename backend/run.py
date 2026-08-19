from __future__ import annotations

import sys
from pathlib import Path
import uvicorn
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

load_dotenv(BACKEND_DIR / '.env')
load_dotenv(PROJECT_ROOT / '.env')

from src.config import get_settings
from src.main import app

if __name__ == '__main__':
    settings = get_settings()
    uvicorn.run(
        'src.main:app',
        host=settings.app_host,
        port=settings.app_port,
        reload=(settings.app_env == 'development'),
    )
