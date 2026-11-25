#!/usr/bin/env bash
# Wait until a deployed backend serves the expected commit in the expected environment (PF-027 P6).
#
#   scripts/wait-for-commit.sh <api-url> <commit-sha> <environment> [timeout-seconds]
#
# Polls <api-url>/actuator/info every 15 s. Each request may take up to 110 s, because a sleeping Render Free service
# answers only after its cold start (about 80 s). Exits 0 as soon as the endpoint reports both values, and 1 once the
# timeout (default 900 s) has passed, printing the last values it saw. The endpoint is public and read-only.
set -euo pipefail

usage="usage: scripts/wait-for-commit.sh <api-url> <commit-sha> <environment> [timeout-seconds]"
api_url="${1:?$usage}"
expected_commit="${2:?$usage}"
expected_environment="${3:?$usage}"
timeout_seconds="${4:-900}"
interval_seconds=15

info_url="${api_url%/}/actuator/info"
deadline=$((SECONDS + timeout_seconds))
last_seen="no answer yet"

while true; do
    if body="$(curl --silent --show-error --fail --max-time 110 "$info_url" 2>&1)"; then
        commit="$(jq -r '.app.commit // empty' <<<"$body" 2>/dev/null || true)"
        environment="$(jq -r '.app.environment // empty' <<<"$body" 2>/dev/null || true)"
        if [[ "$commit" == "$expected_commit" && "$environment" == "$expected_environment" ]]; then
            echo "The API at $api_url serves $commit in $environment."
            exit 0
        fi
        last_seen="commit=${commit:-none} environment=${environment:-none}"
    else
        last_seen="request failed: ${body}"
    fi
    if ((SECONDS + interval_seconds > deadline)); then
        echo "::error title=Backend deploy not verified::$info_url did not report commit $expected_commit in $expected_environment within ${timeout_seconds}s. Last seen: $last_seen"
        exit 1
    fi
    echo "Waiting for $expected_commit in $expected_environment. Last seen: $last_seen"
    sleep "$interval_seconds"
done
