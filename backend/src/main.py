import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.booking_routes import router as booking_router
from src.api.chat_routes import router as chat_router
from src.api.health_routes import router as health_router
from src.api.triage_routes import router as triage_router
from src.api.vector_routes import router as vector_router
from src.config import get_settings
from src.persistence.cosmos_client import get_cosmos_manager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("vmec.main")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application Lifespan Manager:
    Initializes Cosmos DB containers and verifies all cloud connections upon startup.
    """
    settings = get_settings()
    logger.info("Starting %s in [%s] mode...", settings.app_name, settings.app_env)

    # Initialize Cosmos DB containers
    try:
        cosmos_mgr = get_cosmos_manager()
        cosmos_mgr.initialize_database_and_containers()
        logger.info("Azure Cosmos DB initialization complete.")
    except Exception:
        logger.exception("Failed to initialize Azure Cosmos DB")

    logger.info("VMEC Backend is ready to accept requests.")
    yield
    logger.info("Shutting down %s...", settings.app_name)


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="VMEC Healthcare Dedicated Backend API",
        description="Vietnamese Medical Specialty Routing, Multi-Turn Triage, and Clinical Appointments",
        version="1.0.0",
        lifespan=lifespan,
    )

    # CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.get_cors_origins_list(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include Routers
    app.include_router(health_router)
    app.include_router(chat_router)
    app.include_router(triage_router)
    app.include_router(vector_router)
    app.include_router(booking_router)

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "src.main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=(settings.app_env == "development"),
    )
