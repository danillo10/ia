# Variáveis compartilhadas pelos scripts Flutter (source, não execute direto)
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FLUTTER="${FLUTTER_ROOT:-$HOME/flutter}/bin/flutter"
if [[ ! -x "$FLUTTER" ]]; then
  FLUTTER="$(command -v flutter || true)"
fi

API_BASE="${MINUTASK_API_BASE:-http://localhost:8001/api/v1}"
API_WS="${MINUTASK_API_WS:-ws://localhost:8001}"
API_ORIGIN="${MINUTASK_API_ORIGIN:-http://localhost:8001}"

DART_DEFINES=(
  "--dart-define=MINUTASK_API_BASE=$API_BASE"
  "--dart-define=MINUTASK_API_WS=$API_WS"
  "--dart-define=MINUTASK_API_ORIGIN=$API_ORIGIN"
)
