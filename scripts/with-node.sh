#!/usr/bin/env bash
# Run a command with the Node.js version pinned in the repository's .nvmrc.
#
#   scripts/with-node.sh pnpm --dir frontend test --run
#   scripts/with-node.sh node --version
#
# Uses nvm when it is installed; otherwise the Node on PATH must already match the pin.
# It never installs anything: when the pinned version is missing it prints how to get it and exits.
set -euo pipefail

if [[ $# -eq 0 ]]; then
    echo "usage: scripts/with-node.sh <command> [args...]" >&2
    exit 64
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
nvmrc="$repo_root/.nvmrc"
if [[ ! -f "$nvmrc" ]]; then
    echo "with-node: $nvmrc not found" >&2
    exit 1
fi
required="$(tr -d '[:space:]' < "$nvmrc")"
required="${required#v}"

nvm_sh="${NVM_DIR:-$HOME/.nvm}/nvm.sh"
if [[ -s "$nvm_sh" ]]; then
    # nvm is not compatible with `set -eu`, so relax it while nvm runs.
    set +eu
    # shellcheck source=/dev/null
    . "$nvm_sh" --no-use
    nvm use --silent "$required" > /dev/null 2>&1
    nvm_status=$?
    set -eu
    if [[ $nvm_status -ne 0 ]]; then
        echo "with-node: Node $required is not installed. Run: nvm install $required" >&2
        exit 1
    fi
fi

actual="$(node --version 2> /dev/null || true)"
actual="${actual#v}"
if [[ "$actual" != "$required" ]]; then
    echo "with-node: need Node $required but found ${actual:-no node}. Install nvm, or put Node $required first on PATH." >&2
    exit 1
fi

exec "$@"
