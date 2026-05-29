# Minutask — desenvolvimento no PC (sem Docker)

O `docker-compose.yml` continua no repositório para deploy ou quem preferir Docker, mas **não sobe nada por padrão** (profile `docker`).

## 1. Parar Docker (se ainda estiver rodando)

```bash
cd minutask
./scripts/docker-parar.sh
```

## 2. Backend (SQLite local)

```bash
./scripts/dev-backend.sh
```

- API: http://localhost:8001  
- Docs: http://localhost:8001/docs  
- Banco: `backend/minutask_dev.sqlite3`  
- Demo: `contratante1@minutask.local` / `trabalhador1@minutask.local` — senha `123456`

## 3. Apps Flutter (hot reload)

**Um app:**

```bash
./scripts/dev-app-contratante.sh   # http://localhost:4200
./scripts/dev-app-trabalhador.sh   # http://localhost:4201
```

**Os dois juntos:**

```bash
./scripts/dev-apps.sh
```

### Live reload

- Flutter **web** já recarrega em debug ao salvar (Chrome).
- Os scripts usam `inotify` para enviar hot reload ao salvar em `lib/`:
  ```bash
  sudo apt install inotify-tools   # se ainda não tiver
  ```
- No terminal do `flutter run`: `r` = hot reload, `R` = restart completo.

### Cursor / VS Code

Abra a pasta `minutask/` no editor e use **Run and Debug** (F5):

- *Minutask — Contratante (Chrome)*
- *Minutask — Trabalhador (Chrome)*

Com `"dart.flutterHotReloadOnSave": "always"` (já em `.vscode/settings.json`), salvar `.dart` atualiza o app sozinho.

## Docker (opcional)

```bash
cp .env.docker.example .env   # ajuste se necessário
docker compose --profile docker up -d
```

## Menu no app

Toque no logo **Minutask** no topo → conta, ajuda, emergência (190/192/193), sobre e sair.

## Sessão persistente

Após o login, o token fica salvo no dispositivo. Ao reabrir o app, entra direto na home. Se o token expirar (padrão: 30 dias em dev), volta para a tela de login.
