"""Run every minute from a scheduler to release expired booking state."""
from backend.app import create_app
from backend.app.workers.cleanup_worker import cleanup_booking_state


def main() -> None:
    app = create_app()
    if "appointment_service" not in app.extensions:
        raise RuntimeError("SUPABASE_DATABASE_URL is required")
    print(cleanup_booking_state(app))


if __name__ == "__main__":
    main()
