#!/usr/bin/env bash
# API Minutask no PC — SQLite, sem Docker
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"

if ! command -v python3 >/dev/null; then
  echo "Instale python3"
  exit 1
fi

if [[ ! -d .venv ]]; then
  echo "Criando venv..."
  python3 -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate

pip install -q -r requirements.txt

export DB_TIPO=sqlite
export DATABASE_URL=
export RABBITMQ_URL=
export API_PORT=8001
export JWT_SEGREDO="${JWT_SEGREDO:-segredo_super_secreto_trocar}"

# Carrega resto do .env da raiz (sem sobrescrever o que já exportamos)
if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source <(grep -v '^#' "$ROOT/.env" | grep -v '^DB_TIPO=' | grep -v '^DATABASE_URL=' | grep -v '^RABBITMQ_URL=' || true)
  set +a
fi

echo "Semeando usuários demo..."
python -m app.semente_dados || true

echo ""
echo "API: http://localhost:${API_PORT:-8001}"
echo "Docs: http://localhost:${API_PORT:-8001}/docs"
echo "Login demo: contratante1@minutask.local / 123456"
echo ""

exec uvicorn app.main:api --host 0.0.0.0 --port "${API_PORT:-8001}" --reload
