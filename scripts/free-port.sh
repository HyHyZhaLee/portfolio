#!/usr/bin/env bash
# Free the backend's or the frontend dev server's port before `make backend` or `make frontend` starts the server.
#
#   scripts/free-port.sh backend            # port $SERVER_PORT, default 8080
#   scripts/free-port.sh frontend           # port $FRONTEND_PORT, default 5173
#   DRY_RUN=1 scripts/free-port.sh frontend # say what would be stopped, and stop nothing
#
# Stops only a stale copy of the same server from this repository: a java process (backend) or a Vite node
# process (frontend) whose command line or working directory is inside the repository. A port held by Docker or
# by any other program is left alone: the script names the holder and exits 1. Like check-services.sh, it never
# reads .env files; override the ports in the calling environment.
set -uo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
target="${1:-}"
case "$target" in
    backend) port="${SERVER_PORT:-8080}" port_variable=SERVER_PORT label="backend" ;;
    frontend) port="${FRONTEND_PORT:-5173}" port_variable=FRONTEND_PORT label="frontend dev server" ;;
    *)
        echo "usage: scripts/free-port.sh backend|frontend" >&2
        exit 64
        ;;
esac
command -v lsof > /dev/null 2>&1 || exit 0 # cannot tell; the server reports a busy port itself

listening() { lsof -nP -t -iTCP:"$port" -sTCP:LISTEN 2> /dev/null | sort -u; }
executable() { basename "$(ps -o comm= -p "$1" 2> /dev/null)" 2> /dev/null; }

inside_repo() { # pid command-line
    local cwd
    [[ "$2" == *"$repo_root/"* ]] && return 0
    cwd="$(lsof -a -p "$1" -d cwd -Fn 2> /dev/null | sed -n 's/^n//p')"
    [[ "$cwd" == "$repo_root" || "$cwd" == "$repo_root/"* ]]
}

is_ours() { # pid executable
    local command_line
    command_line="$(ps -o command= -p "$1" 2> /dev/null)"
    case "$target" in
        backend) [[ "$2" == java ]] || return 1 ;;
        frontend) [[ "$2" == node && "$command_line" == *vite* ]] || return 1 ;;
    esac
    inside_repo "$1" "$command_line"
}

stop() { # pid
    kill "$1" 2> /dev/null || return 0
    for _ in $(seq 1 50); do # up to 10 s for a graceful shutdown
        kill -0 "$1" 2> /dev/null || return 0
        sleep 0.2
    done
    echo "PID $1 did not stop within 10 s; forcing it." >&2
    kill -9 "$1" 2> /dev/null || true
    sleep 0.5
}

pids="$(listening)"
[[ -z "$pids" ]] && exit 0

blocked=0
for pid in $pids; do
    kill -0 "$pid" 2> /dev/null || continue # already gone
    exe="$(executable "$pid")"
    if is_ours "$pid" "$exe"; then
        if [[ -n "${DRY_RUN:-}" ]]; then
            echo "Would stop a stale $label from this repository (PID $pid, $exe) that holds :$port."
        else
            echo "Stopping a stale $label from this repository (PID $pid, $exe) that holds :$port."
            stop "$pid"
        fi
    elif [[ "$exe" == *docker* || "$exe" == vpnkit* || "$exe" == com.docke* ]]; then
        echo "Port $port is held by Docker. Stop that container first." >&2
        blocked=1
    else
        echo "Port $port is held by PID $pid ($exe), which is not this repository's $label, so it was left running." >&2
        echo "Stop it yourself, or use another port, for example: $port_variable=$((port + 1)) make $target" >&2
        blocked=1
    fi
done

if [[ $blocked -eq 0 && -z "${DRY_RUN:-}" && -n "$(listening)" ]]; then
    echo "Port $port is still in use; stop the process that holds it and try again." >&2
    blocked=1
fi
exit "$blocked"
