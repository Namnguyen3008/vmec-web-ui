from .booking_routes import router as booking_router
from .chat_routes import router as chat_router
from .health_routes import router as health_router
from .triage_routes import router as triage_router
from .vector_routes import router as vector_router

__all__ = [
    "booking_router",
    "chat_router",
    "health_router",
    "triage_router",
    "vector_router",
]
