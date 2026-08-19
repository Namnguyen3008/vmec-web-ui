from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter

from src.config import get_settings
from src.persistence.cosmos_client import get_cosmos_manager

router = APIRouter(tags=["Health & Status"])


@router.get("/health")
async def health_check() -> dict[str, Any]:
    """
    Lightweight healthcheck endpoint for load balancers and Render healthchecks.
    """
    return {
        "status": "ok",
        "service": "vmec-dedicated-backend",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/ready")
async def readiness_check() -> dict[str, Any]:
    """
    Readiness probe verifying database connectivity and configuration integrity.
    """
    settings = get_settings()
    cosmos_mgr = get_cosmos_manager()
    cosmos_health = cosmos_mgr.ping()

    gemini_keys_count = len(settings.get_gemini_api_keys())
    mistral_keys_count = len(settings.get_mistral_api_keys())
    supabase_configured = bool(
        settings.supabase_url and settings.supabase_anon_key.get_secret_value()
    )

    is_ready = (
        cosmos_health.get("status") == "HEALTHY"
        and gemini_keys_count > 0
        and mistral_keys_count > 0
        and supabase_configured
    )

    return {
        "ready": is_ready,
        "environment": settings.app_env,
        "cosmos_db": cosmos_health,
        "gemini_keys_available": gemini_keys_count,
        "mistral_keys_available": mistral_keys_count,
        "supabase_configured": supabase_configured,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/status")
async def system_status() -> dict[str, Any]:
    """
    Detailed system telemetry and operational status.
    """
    settings = get_settings()
    return {
        "app_name": settings.app_name,
        "version": "1.0.0",
        "runtime": "Dedicated Non-Serverless FastAPI on Render/Cloud",
        "database": {
            "engine": "Azure Cosmos DB (Free Tier: 1,000 RU/s + 25GB Storage)",
            "database_name": settings.azure_cosmos_database,
            "containers": [
                settings.azure_cosmos_container_sessions,
                settings.azure_cosmos_container_slots,
                settings.azure_cosmos_container_records,
                settings.azure_cosmos_container_bookings,
                settings.azure_cosmos_container_audit,
            ],
        },
        "knowledge_base": {
            "engine": "Supabase PostgreSQL pgvector",
            "dimensions": settings.mistral_embedding_dimensions,
            "embedding_model": settings.mistral_embedding_model,
        },
        "llm_rotation": {
            "allowed_generative_models": [
                settings.gemini_generative_model_1,
                settings.gemini_generative_model_2,
            ],
            "gemini_keys_count": len(settings.get_gemini_api_keys()),
            "mistral_keys_count": len(settings.get_mistral_api_keys()),
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
