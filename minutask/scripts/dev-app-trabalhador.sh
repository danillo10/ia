#!/usr/bin/env bash
# App trabalhador com hot reload (Chrome + reload ao salvar arquivos)
set -euo pipefail

# shellcheck source=flutter-dev-env.sh
source "$(dirname "$0")/flutter-dev-env.sh"

APP_DIR="$ROOT/app-trabalhador"
PORT="${MINUTASK_PORT_TRABALHADOR:-4201}"
PID_FILE="${TMPDIR:-/tmp}/minutask-trabalhador.pid"

if [[ ! -x "$FLUTTER" ]]; then
  echo "Flutter não encontrado. Defina FLUTTER_ROOT ou instale em ~/flutter"
  exit 1
fi

_iniciar_watcher() {
  if ! command -v inotifywait >/dev/null 2>&1; then
    echo "Dica: sudo apt install inotify-tools → reload automático ao salvar lib/"
    return
  fi
  (
    sleep 3
    echo "👀 Observando $APP_DIR/lib — salvar arquivo = hot reload"
    while inotifywait -r -q -e close_write,move,create,delete "$APP_DIR/lib" 2>/dev/null; do
      if [[ -f "$PID_FILE" ]]; then
        if kill -USR1 "$(cat "$PID_FILE")" 2>/dev/null; then
          echo "⟳ Hot reload trabalhador ($(date +%H:%M:%S))"
        fi
      fi
    done
  ) &
  WATCHER_PID=$!
  trap 'kill $WATCHER_PID 2>/dev/null' EXIT INT TERM
}

echo "Trabalhador → http://localhost:$PORT"
echo "API → $API_BASE"
echo "Terminal: r = hot reload | R = hot restart | q = sair"
echo ""

cd "$APP_DIR"
"$FLUTTER" pub get

_iniciar_watcher

exec "$FLUTTER" run -d chrome \
  --web-port="$PORT" \
  --web-hostname=localhost \
  --pid-file="$PID_FILE" \
  --hot \
  "${DART_DEFINES[@]}"
