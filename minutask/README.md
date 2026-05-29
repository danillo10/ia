# Minutask — Microjobs urgentes

Plataforma de serviços informais no modelo **Uber**: contratante publica uma tarefa, todos os trabalhadores online recebem a oferta, podem **aceitar** ou **recusar**; quando **um** aceita, as notificações daquela tarefa param para os demais.

O **Moto Táxi** (`mobile-app/`, `motorista-app/`, `backend/` raiz) permanece intacto. O Minutask vive só em `minutask/`.

## Produto

| Papel | App | Função |
|-------|-----|--------|
| Contratante | Flutter `app-contratante/` | Publica tarefa, descreve o que precisa, acompanha status |
| Trabalhador | Flutter `app-trabalhador/` | Fica online, recebe ofertas, aceita/recusa |
| Web | `web/` | Cadastro de tarefa pelo navegador (mesma API) |
| Admin | futuro | Moderação, categorias, tarifas |

## Fluxo (espelho do Moto Táxi)

```
Contratante cria tarefa (descrição + local)
    → estado: buscando
    → RabbitMQ fila jobs_pendentes + broadcast
Trabalhadores online recebem push / polling
    → Aceitar: primeira transação ganha (409 se já aceita)
    → Recusar: registrado; não recebe de novo essa tarefa
Tarefa aceita → fila encerra broadcast; WebSocket atualiza contratante
Trabalhador inicia → em_andamento → finalizada
```

## Estrutura

```
minutask/
  backend/           # API FastAPI (porta 8001)
  app-contratante/   # Flutter
  app-trabalhador/   # Flutter
  web/               # Site cadastro de jobs
  docker-compose.yml
```

## Subir (dev)

```bash
cd minutask
cp ../.env.exemplo .env.minutask   # ou copie variáveis MINUTASK_* no .env da raiz
docker compose up -d
```

- API: http://localhost:8001/docs  
- Web: http://localhost:8080  
- RabbitMQ: http://localhost:15673 (guest/guest)

## Apps Flutter

Requer [Flutter SDK](https://docs.flutter.dev/get-started/install). Na pasta de cada app:

```bash
cd minutask/app-contratante   # ou app-trabalhador
flutter pub get
flutter run
```

Configure `lib/core/config.dart` com a URL da API (`http://10.0.2.2:8001` no emulador Android).

## Cadastro com análise de imagem

`POST /api/v1/auth/cadastro` envia foto do documento (multipart). O serviço `verificacao_imagem` valida formato, dimensões e heurísticas básicas; em produção plugar OCR/ML (ex.: Google Vision, AWS Rekognition).

Estados de verificação: `pendente` | `aprovado` | `rejeitado`.

## Variáveis de ambiente

Copie o exemplo e ajuste:

```bash
cp .env.exemplo .env
```

O `.env` na raiz de `minutask/` é usado pelo **Docker Compose** e pelo backend. Reutiliza o `JWT_SEGREDO` e `GOOGLE_MAPS_API_KEY` do Moto Táxi em dev.

| Variável | Uso |
|----------|-----|
| `DATABASE_URL` | MySQL no Docker (`minutask-mysql`) |
| `DATABASE_URL_MYSQL` | MySQL no host (`localhost:3308`) |
| `RABBITMQ_URL` | Fila de novas tarefas |
| `JWT_SEGREDO` | Tokens da API |
| `GOOGLE_MAPS_API_KEY` | Mapas (futuro / apps) |
| `MINUTASK_API_BASE` | URL para apps Flutter |

Apps Flutter (opcional, sobrescreve padrão):

```bash
flutter run -d web-server --dart-define=MINUTASK_API_BASE=http://localhost:8001/api/v1
```

## Próximos passos

- [ ] FCM/APNs para push em tempo real
- [ ] Categorias de serviço (limpeza, entrega, reforma…)
- [ ] Pagamentos (reutilizar padrão `PagamentoProvider` do moto táxi)
- [ ] Painel admin Minutask
