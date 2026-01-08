build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose down
	docker compose up -d

logs:
	docker compose logs -f

migrate:
	docker exec -it finance-tracker-app bunx --bun drizzle-kit migrate