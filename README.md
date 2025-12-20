# Moto Táxi – Plataforma Completa (Ionic + FastAPI)

Monorepo 100% em português do Brasil com Backend FastAPI, Admin Web (Ionic/Angular) e base para App Mobile.

## Subir com Docker (dev)

1) Copie o env de exemplo:

```powershell
Copy-Item .env.exemplo .env -Force
```

2) Suba os serviços:

```powershell
./scripts/make.ps1 up
```

- API: http://localhost:8000 (Swagger em /docs)
- Admin: http://localhost:4200

3) Seeds iniciais:

```powershell
./scripts/make.ps1 seed
```

4) Testes backend:

```powershell
./scripts/make.ps1 test
```

## Estrutura
- backend/: FastAPI, modelos, serviços, Alembic, testes e seeds
- admin-web/: Painel Admin (Ionic/Angular)
- mobile-app/: App mobile (placeholder)
- scripts/: utilitários

Tudo em PT-BR: código, mensagens, comentários e docs.
