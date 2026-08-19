.PHONY: run test lint format check clean install-backend install-frontend build-frontend

run-backend:
	uvicorn backend.src.main:app --reload --host 0.0.0.0 --port 8000

run-frontend:
	cd frontend && npm run dev

test:
	pytest backend/tests/ -v

lint:
	ruff check backend/src/ backend/tests/

format:
	ruff format backend/src/ backend/tests/

check: lint test

clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type d -name .pytest_cache -exec rm -rf {} +
	find . -type d -name .ruff_cache -exec rm -rf {} +
