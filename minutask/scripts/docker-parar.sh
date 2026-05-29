#!/usr/bin/env bash
# Para containers Minutask e libera RAM/CPU
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
docker compose --profile docker down 2>/dev/null || docker compose down 2>/dev/null || true
docker compose down --remove-orphans 2>/dev/null || true
echo "Containers Minutask parados."
