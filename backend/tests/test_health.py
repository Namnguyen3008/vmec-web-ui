import pytest
from httpx import ASGITransport, AsyncClient

from src.main import create_app


@pytest.mark.asyncio
async def test_health_endpoint():
    app = create_app()
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "vmec-dedicated-backend"


@pytest.mark.asyncio
async def test_status_endpoint():
    app = create_app()
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/status")
        assert response.status_code == 200
        data = response.json()
        assert data["app_name"] == "VMEC-Dedicated-Backend"
        assert data["llm_rotation"]["gemini_keys_count"] == 7
        assert data["llm_rotation"]["mistral_keys_count"] == 13
        assert data["llm_rotation"]["allowed_generative_models"] == [
            "gemini-3.1-flash-lite",
            "gemini-3.5-flash-lite",
        ]
        assert data["database"]["database_name"] == "vmec_healthcare_db"
