# One command vocabulary for people and agents. Run `make` to list the targets.
SHELL := /bin/bash
.DEFAULT_GOAL := help

GRADLE := ./backend/gradlew -p backend
FRONTEND := scripts/with-node.sh pnpm --dir frontend

# $(call require,<path>) stops with a clear message until the scaffold ticket that creates <path> has run.
require = @test -e $(1) || { echo "$(1) does not exist yet: it arrives with PF-002 (docs/prd/backlog.md)."; exit 1; }
# $(LOAD_ENV) exports the repository's .env (gitignored; template .env.example) into one recipe line, so the run targets
# and the helper scripts see the same port and database overrides that docker compose reads by itself. The check and
# test targets do not load it, so a local SPRING_PROFILES_ACTIVE never leaks into the test suites. As with compose, a
# variable already exported by the shell wins: its value is saved before .env is read and restored after.
LOAD_ENV = if [ -f .env ]; then shell_env="$$(export -p)"; set -a; . ./.env; set +a; eval "$$shell_env"; fi;
# $(call frontend_or_skip,<pnpm script and args>) runs a frontend script once frontend/ is scaffolded, and says so when skipped.
frontend_or_skip = @if [ -e frontend/package.json ]; then $(FRONTEND) $(1); else echo "frontend: skipped, frontend/package.json arrives with PF-002"; fi

.PHONY: help up down reset ps status backend frontend check test format openapi release

help: ## List the available targets
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN { FS = ":.*## " } { printf "  %-10s %s\n", $$1, $$2 }'

up: ## Start local infrastructure (PostgreSQL) and wait until it is healthy
	docker compose up -d --wait

down: ## Stop local infrastructure and keep its data
	docker compose down

reset: ## Stop local infrastructure and DELETE its data volume
	docker compose down -v

ps: ## Show the compose services
	docker compose ps

status: ## Report the whole local stack (read-only)
	@$(LOAD_ENV) scripts/check-services.sh

backend: ## Run the backend with the local profile on :8080, first stopping a stale copy that holds the port
	$(call require,backend/gradlew)
	@$(LOAD_ENV) scripts/free-port.sh backend && $(GRADLE) bootRun

frontend: ## Run the frontend dev server on :5173, first stopping a stale copy that holds the port
	$(call require,frontend/package.json)
	@$(LOAD_ENV) scripts/free-port.sh frontend && $(FRONTEND) dev

check: ## Full quality gate: formatting, lint, types, tests, coverage
	$(call require,backend/gradlew)
	$(GRADLE) check
	$(call frontend_or_skip,check:type)
	$(call frontend_or_skip,check:lint)
	$(call frontend_or_skip,check:format)
	$(call frontend_or_skip,coverage)

test: ## Unit and integration tests for both packages
	$(call require,backend/gradlew)
	$(GRADLE) testUnit testIT
	$(call frontend_or_skip,test --run)

format: ## Apply the formatters to both packages
	$(call require,backend/gradlew)
	$(GRADLE) spotlessApply
	$(call frontend_or_skip,format)

openapi: ## Regenerate backend/openapi/openapi.json and the frontend API types
	$(call require,backend/gradlew)
	$(GRADLE) testIT --tests '*OpenApiSnapshotIT'
	$(call frontend_or_skip,gen:api)

release: ## Release VERSION=x.y.z: tag the head of origin/main as vx.y.z and push it; ci-cd deploys it to production
	@[[ "$(VERSION)" =~ ^[0-9]+\.[0-9]+\.[0-9]+$$ ]] || { echo "Usage: make release VERSION=1.2.3 (MAJOR.MINOR.PATCH)"; exit 1; }
	git fetch origin main --tags
	git tag --annotate "v$(VERSION)" --message "Release v$(VERSION)" origin/main
	git push origin "v$(VERSION)"
	@echo "Pushed v$(VERSION). The ci-cd run deploys it once the release gate passes: gh run list --workflow ci-cd.yml --limit 3"
