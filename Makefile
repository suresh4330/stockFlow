.PHONY: up down logs test prod restart ps seed compose-config

up:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f

test:
	cd backend && python -m pytest

seed:
	cd backend && python -m app.seed

prod:
	docker compose -f docker-compose.prod.yml up --build -d

restart:
	docker compose down
	docker compose up --build

ps:
	docker compose ps

compose-config:
	docker compose config

