.PHONY: up down migrate seed test lint import-fwc worker api admin mobile

up:
	docker-compose up -d postgres redis api worker

down:
	docker-compose down

migrate:
	cd services/api && alembic upgrade head

seed:
	cd services/api && python -m app.jobs.seed

test:
	cd services/api && pytest -q

lint:
	cd services/api && ruff check . && black --check .

import-fwc:
	cd services/api && python -m app.jobs.import_fwc

worker:
	cd services/api && python -m app.jobs.worker

api:
	cd services/api && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

admin:
	cd apps/admin && npm install && npm run dev

mobile:
	cd apps/mobile && npm install && npm run start
