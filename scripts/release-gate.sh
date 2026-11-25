#!/usr/bin/env bash
# Decide whether a release tag may deploy to production (PF-027 F3). Exits 0 to allow and 1 to refuse, with the reason.
#
#   TAG=v1.2.3 SHA=<tagged commit> GITHUB_REPOSITORY=owner/name scripts/release-gate.sh
#
# Needs git with a remote `origin`, and gh authenticated with read access to Actions and Deployments (GH_TOKEN in CI).
# RELEASE_GATE_WAIT_SECONDS (default 1800) bounds the wait for a main run that is still going.
set -euo pipefail

: "${TAG:?TAG is required, for example v1.2.3}"
: "${SHA:?SHA is required: the tagged commit}"
: "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required, for example owner/name}"
wait_seconds="${RELEASE_GATE_WAIT_SECONDS:-1800}"
poll_seconds=30
repo="repos/$GITHUB_REPOSITORY"

summary() {
    if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
        echo "$1" >>"$GITHUB_STEP_SUMMARY"
    fi
}
allow() {
    echo "Allowed: $1"
    summary "Release gate allowed \`$TAG\` (\`$SHA\`): $1"
    exit 0
}
refuse() {
    echo "::error title=Release refused::$1"
    summary "Release gate refused \`$TAG\` (\`$SHA\`): $1"
    exit 1
}

# Rule 1: only SemVer release tags ship (D4).
[[ "$TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] || refuse "$TAG is not a release tag of the form vMAJOR.MINOR.PATCH."

# Rule 2: the tagged commit is on main.
git fetch --quiet origin main
git merge-base --is-ancestor "$SHA" origin/main || refuse "$SHA is not on main. Tag a commit on main."

# Rule 3: the tag names the version the commit builds, so the site shows the tag it was released as (P16).
package_version="$(git show "$SHA:frontend/package.json" | jq --raw-output .version)" ||
    refuse "could not read frontend/package.json at $SHA."
[[ "v$package_version" == "$TAG" ]] ||
    refuse "$TAG does not match frontend/package.json at $SHA (version $package_version). Release with make release, which tags the version in that file."

# Rule 4: a redeploy or rollback of a commit that went live before (D16). A deployment's latest status turns `inactive`
# once a newer deployment succeeds, so any `success` status counts.
deployment_ids="$(gh api "$repo/deployments?environment=production&sha=$SHA&per_page=100" --jq '.[].id')" ||
    refuse "could not read the production deployments of $SHA from GitHub."
for id in $deployment_ids; do
    if [[ "$(gh api "$repo/deployments/$id/statuses?per_page=100" --jq 'any(.[]; .state == "success")')" == "true" ]]; then
        allow "$SHA was deployed to production successfully before (redeploy or rollback)."
    fi
done

# Rule 5: the main run for this exact commit passed every check, the staging deploy, and the staging smoke test (D15).
deadline=$((SECONDS + wait_seconds))
while true; do
    runs="$(gh api "$repo/actions/workflows/ci-cd.yml/runs?head_sha=$SHA&branch=main&per_page=20" \
        --jq '[.workflow_runs[] | select(.event == "push" or .event == "workflow_dispatch") | {status, conclusion}]')" ||
        refuse "could not read the ci-cd runs of $SHA from GitHub."
    if jq -e 'any(.[]; .conclusion == "success")' <<<"$runs" >/dev/null; then
        allow "the main run for $SHA passed every check and the staging smoke test."
    fi
    if jq -e 'any(.[]; .status != "completed")' <<<"$runs" >/dev/null; then
        if ((SECONDS + poll_seconds > deadline)); then
            refuse "the main run for $SHA did not finish within $((wait_seconds / 60)) minutes. Run the release again once it has passed."
        fi
        echo "Waiting for the main run for $SHA to finish."
        sleep "$poll_seconds"
        continue
    fi
    refuse "$SHA has no successful main run: it failed, was cancelled, was skipped, or never ran. Tag a newer commit whose main run passed."
done
