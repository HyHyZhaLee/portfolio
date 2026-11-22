#!/usr/bin/env bash
# Report the state of the local stack. Read-only, safe to run at any time, always exits 0.
#
#   scripts/check-services.sh
#
# Checks Docker, the compose services (PostgreSQL), the backend health endpoint, the frontend dev
# server, and which processes listen on the stack's ports. Compose ports are discovered from Docker.
# Backend and frontend ports default to 8080 and 5173; override them with SERVER_PORT and
# FRONTEND_PORT in the calling environment. This script never reads .env files.
set -uo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root" || exit 0

backend_port="${SERVER_PORT:-8080}"
frontend_port="${FRONTEND_PORT:-5173}"
postgres_port="${POSTGRES_PORT:-5432}"
problems=0
hints=()

row() { printf '%-10s %-9s %s\n' "$1" "$2" "$3"; }
http_code() { curl -s -o /dev/null -m 3 -w '%{http_code}' "$1" 2> /dev/null || true; }
listeners() {
    command -v lsof > /dev/null 2>&1 || { echo "lsof unavailable"; return; }
    lsof -nP -iTCP:"$1" -sTCP:LISTEN 2> /dev/null | awk 'NR > 1 { print $1 "(" $2 ")" }' | sort -u | paste -sd, -
}
compose_port() { # service container-port fallback
    local mapped
    mapped="$(docker compose port "$1" "$2" 2> /dev/null | head -n 1)"
    mapped="${mapped##*:}"
    if [[ "$mapped" =~ ^[0-9]+$ ]]; then echo "$mapped"; else echo "$3"; fi
}

printf 'Local stack status, %s\n\n' "$(date '+%Y-%m-%d %H:%M:%S')"
row SERVICE STATE DETAIL

# Docker engine
docker_up=false
if docker_version="$(docker info --format '{{.ServerVersion}}' 2> /dev/null)"; then
    docker_up=true
    row docker up "engine $docker_version"
else
    row docker down "daemon not reachable; start Docker Desktop"
    problems=$((problems + 1))
fi

# Compose services
check_compose_service() { # service container-port
    local name="$1" container_port="$2" state health host_port
    if [[ ! -f compose.yaml ]]; then
        row "$name" missing "compose.yaml not found"
        problems=$((problems + 1))
        return
    fi
    if [[ "$docker_up" != true ]]; then
        row "$name" unknown "Docker is down"
        return
    fi
    read -r state health < <(docker compose ps --all --format '{{.State}} {{.Health}}' "$name" 2> /dev/null | head -n 1)
    if [[ -z "${state:-}" ]]; then
        row "$name" stopped "no container; run: make up"
        problems=$((problems + 1))
        return
    fi
    host_port="$(compose_port "$name" "$container_port" "")"
    if [[ "$name" == postgres && -n "$host_port" ]]; then postgres_port="$host_port"; fi
    if [[ "$state" != running ]]; then
        row "$name" "$state" "container not running; run: make up"
        problems=$((problems + 1))
        return
    fi
    case "$name" in
        postgres)
            if [[ "${health:-}" == healthy ]] || docker compose exec -T postgres pg_isready -q > /dev/null 2>&1; then
                row postgres up "accepting connections on :$postgres_port"
            else
                row postgres starting "container running, not ready yet (health: ${health:-none})"
                problems=$((problems + 1))
            fi
            ;;
    esac
}
check_compose_service postgres 5432

# Backend health
health_body="$(curl -s -m 3 "http://localhost:$backend_port/actuator/health" 2> /dev/null || true)"
if [[ -z "$health_body" ]]; then
    row backend down "no response on :$backend_port; start it with: make backend"
    problems=$((problems + 1))
else
    health_line="$(printf '%s' "$health_body" | python3 -I -c '
import json, sys
try:
    data = json.load(sys.stdin)
except Exception:
    print("unknown\tresponse is not health JSON"); sys.exit(0)
status = str(data.get("status", "UNKNOWN"))
parts = ["overall " + status]
component = data.get("components", {}).get("db")
if component:
    parts.append("db " + str(component.get("status", "UNKNOWN")))
print(("up" if status == "UP" else "degraded") + "\t" + ", ".join(parts))
' 2> /dev/null || printf 'unknown\tresponse received; python3 unavailable to parse it')"
    health_state="${health_line%%$'\t'*}"
    row backend "$health_state" "${health_line#*$'\t'} on :$backend_port"
    [[ "$health_state" == up ]] || problems=$((problems + 1))
fi

# Frontend dev server
frontend_code="$(http_code "http://localhost:$frontend_port/")"
case "$frontend_code" in
    200) row frontend up "serving on :$frontend_port" ;;
    000 | "") row frontend down "no response on :$frontend_port; start it with: make frontend"; problems=$((problems + 1)) ;;
    *) row frontend degraded "HTTP $frontend_code on :$frontend_port"; problems=$((problems + 1)) ;;
esac

# Port owners
printf '\n%-10s %-9s %s\n' PORT FOR LISTENER
for entry in "postgres:$postgres_port" "backend:$backend_port" "frontend:$frontend_port"; do
    name="${entry%%:*}"
    port="${entry##*:}"
    owners="$(listeners "$port")"
    printf '%-10s %-9s %s\n' ":$port" "$name" "${owners:-free}"
    case "$name" in
        postgres) port_variable=POSTGRES_PORT ;;
        *) port_variable="" ;;
    esac
    if [[ -n "$port_variable" && -n "$owners" && "$owners" != *com.docke* && "$owners" != *docker* && "$owners" != *vpnkit* ]]; then
        hints+=("port $port is held by $owners, not Docker, so another stack may be using it. Stop that process, or set $port_variable in your .env and run make up again.")
    fi
done

printf '\n'
if [[ $problems -eq 0 ]]; then
    echo "All services are up."
else
    echo "$problems service(s) not up."
fi
for hint in "${hints[@]+"${hints[@]}"}"; do
    echo "Hint: $hint"
done
exit 0
