COMPOSE := docker compose

.PHONY: up prod-up down prod-down logs ps

up:
	$(COMPOSE) up -d

prod-up:
	$(COMPOSE) --profile prod up -d

down:
	$(COMPOSE) down

prod-down:
	$(COMPOSE) --profile prod down

logs:
	$(COMPOSE) logs -f

ps:
	$(COMPOSE) ps
