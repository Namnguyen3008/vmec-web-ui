# VMEC Healthcare — Backend FastAPI Dedicated API (Port 8000)

Backend API chuyen dung cua he thong VMEC Healthcare (Team P-208), phat trien tren nen tang Python 3.12 va framework FastAPI, tich hop engine dieu phoi hoi thoai lam sang 28-Node LangGraph, Supabase pgvector va Azure Cosmos DB Free Tier.

## 1. Kien Truc & Cong Nghe
- **Framework**: FastAPI >= 0.115, Uvicorn ASGI Server, Pydantic v2 Settings.
- **Port**: 8000.
- **Knowledge Base**: Supabase Cloud PostgreSQL + pgvector (3.650 vectors 1024D).
- **State & Locking**: Azure Cosmos DB (Atomic Slot Hold sub-5ms, Session TTL 24h).
- **AI Models**: Google Gemini Rotation Pool (7 keys) + Mistral Semantic Embeddings Pool (13 keys).

## 2. Khoi Chay Server
```bash
# Tao moi truong ao va cai dat thu vien
python -m venv .venv
source .venv/bin/activate  # Hoac .venv\Scripts\activate tren Windows
pip install -r requirements.txt

# Khoi chay FastAPI
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

## 3. Kiem Thu Pytest (29 Test Cases)
```bash
pytest tests/ -v
```
