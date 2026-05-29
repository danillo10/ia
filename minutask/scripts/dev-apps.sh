#!/usr/bin/env bash
# Sobe os dois apps em terminais separados (hot reload em cada um)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT_DIR="$(dirname "$0")"

echo "Iniciando contratante e trabalhador (dois processos)..."
echo "Feche com Ctrl+C neste script ou mate os processos flutter."
echo ""

chmod +x "$SCRIPT_DIR/dev-app-contratante.sh" "$SCRIPT_DIR/dev-app-trabalhador.sh"

"$SCRIPT_DIR/dev-app-contratante.sh" &
PID_C=$!

sleep 2

"$SCRIPT_DIR/dev-app-trabalhador.sh" &
PID_T=$!

trap 'kill $PID_C $PID_T 2>/dev/null; exit 0' INT TERM
wait
