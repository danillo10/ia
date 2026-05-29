# Deploy Minutask (produção)

## Status atual

| Componente | URL / ID | Estado |
|------------|----------|--------|
| GitHub (privado) | https://github.com/danillo10/minutask | OK |
| Frontend Vercel | https://minutask-web.vercel.app | OK |
| MySQL Railway | projeto `minutask` | OK |
| API Railway | https://minutask-backend-production.up.railway.app | Pendente (ver abaixo) |

## Desbloquear o backend (escolha uma opção)

### Opção A — Conectar GitHub ao Railway (recomendado)

1. Abra https://railway.com/account/integrations  
2. Conecte o GitHub e autorize o repositório **danillo10/minutask**  
3. No serviço **minutask-backend**, confirme source: repo `danillo10/minutask`, branch `main`, root `backend`  
4. Clique em **Deploy**

### Opção B — Token no GitHub Actions

1. Crie um token em https://railway.com/account/tokens  
2. No repo GitHub: **Settings → Secrets → Actions** → `RAILWAY_TOKEN`  
3. Execute o workflow **Deploy backend (Railway CLI)** em Actions  

### Opção C — Imagem GHCR privada

1. Crie um PAT GitHub com `read:packages`  
2. No serviço **minutask-backend** no Railway: **Registry Credentials** → usuário `danillo10`, senha = PAT  
3. Imagem: `ghcr.io/danillo10/minutask-backend:latest` → **Redeploy**

## Vercel

O site usa proxy `/api/*` → backend Railway. Quando a API estiver no ar, teste:

```bash
curl https://minutask-backend-production.up.railway.app/saude
curl https://minutask-web.vercel.app/
```

## IDs Railway

- Projeto: `12495c1b-2ba9-4829-981a-79ed72ba7b2a`
- Ambiente production: `cb371eab-ec12-4189-b8a8-2b35b1dea8d6`
- MySQL: `d91d75e4-f222-4ff9-98b0-f8a42381d5ed`
- Backend: `b00f1f12-67b3-4d16-b699-15f0d9cbbbbf`
