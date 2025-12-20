param(
  [Parameter(Position=0)][ValidateSet('up','rebuild','pull','down','seed','test','logs')][string]$acao = 'up'
)

$ErrorActionPreference = 'Stop'

function Up {
  # Garante arquivo .env presente
  if (-not (Test-Path .env)) { Copy-Item .env.exemplo .env -Force }
  # Sobe serviços sem recriar containers existentes
  docker compose up -d --no-recreate
}

function Rebuild {
  # Recompila imagens e força recriação
  docker compose up -d --build --force-recreate
}

function Pull {
  docker compose pull
}

function Down {
  docker compose down -v
}

function Seed {
  docker compose exec -T backend python -m app.sementes
}

function Teste {
  docker compose exec -T backend pytest -q
}

function Logs {
  docker compose logs -f --tail=200 backend
}

switch ($acao) {
  'up' { Up }
  'rebuild' { Rebuild }
  'pull' { Pull }
  'down' { Down }
  'seed' { Seed }
  'test' { Teste }
  'logs' { Logs }
}
