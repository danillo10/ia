# Moto Táxi – Instruções para Agentes de IA

## Linguagem Obrigatória: 100% Português Brasileiro
**CRÍTICO**: Todo código, nomes de variáveis, funções, classes, comentários, mensagens, e documentação DEVEM estar em PT-BR. Nunca use inglês para identificadores.

Não rode o comando npm start ou ionic serve, apenas gere o código solicitado.

Exemplos corretos:
- ✅ `calcular_preco_estimado()`, `criar_corrida()`, `usuario_atual`
- ✅ Classes: `Corrida`, `Usuario`, `PagamentoProvider`
- ✅ Enums: `'buscando'`, `'aceita'`, `'finalizada'`
- ❌ `calculate_price()`, `create_ride()`, `current_user`

## Arquitetura do Monorepo

### Estrutura de 3 Camadas
```
backend/          → FastAPI + SQLAlchemy + Alembic (Python 3.11)
mobile-app/       → Ionic 7 + Angular 17 + Capacitor 5 (app híbrido)
admin-web/        → Ionic/Angular (painel administrativo - placeholder)
scripts/make.ps1  → Orquestração PowerShell (up/down/seed/test)
```

### Backend (FastAPI)
- **Modelos ORM** (`backend/app/modelos/`): SQLAlchemy com Base declarativa
  - `Usuario`: `papel` enum ('passageiro', 'motociclista', 'admin')
  - `Corrida`: `estado` enum ('buscando', 'aceita', 'iniciada', 'em_andamento', 'finalizada', 'cancelada')
  - `Pagamento`, `Avaliacao`, `CarteiraMotorista`, `DocumentoMotociclista`
  
- **Roteadores** (`backend/app/roteadores/`): Prefixo `/api/v1` configurado em `config.api_prefix`
  - `/auth`: `POST /entrar` (JWT com refresh tokens de 30 dias)
  - `/corridas`: `POST /estimar` (tarifa base 5.0 + 1.8/km + 0.5/min)
  - `/passageiro`: `POST /corridas` (criar), `GET /{id}`, `POST /{id}/cancelar`
  - `/motorista`: `PUT /status-online`, `POST /localizacao`, `POST /corridas/{id}/aceitar|iniciar|finalizar`
  - `/ws/corridas/{id}`: WebSocket para rastreamento em tempo real
  
- **Serviços** (`backend/app/servicos/`):
  - `tarifacao.py`: `calcular_preco_estimado()` com tarifa dinâmica e descontos
  - `roteamento.py`: Haversine para distância (`haversine_km()`)
  - `pagamentos/`: Arquitetura plugável com `PagamentoProvider` (Pix/Cartão/Dinheiro)
  
- **Configuração** (`backend/app/core/config.py`):
  - Pydantic Settings com `.env` support
  - Dual DB: SQLite dev (`sqlite+aiosqlite`) vs PostgreSQL prod (`postgresql+asyncpg`)
  - Timezone: `America/Recife`, formato BRL `R$ 1.234,56`

### Mobile App (Ionic/Angular)
- **Modo Mock**: `environment.useMock = true` desvia HTTP para `api-mock.service.ts`
  - Usuários mock: `passageiro1@mototaxi.local / 123456`, `moto1@mototaxi.local / 123456`
  - Auto-aceita corridas após 3s, simula WebSocket com delays
  
- **Guards**:
  - `AuthGuard`: Verifica JWT em localStorage
  - `PapelGuard`: Valida `data.papel` vs `usuario.papel` (RBAC client-side)
  
- **Serviços** (`mobile-app/src/app/servicos/`):
  - `auth.service.ts`: Persiste token/usuario com Capacitor Preferences (NÃO Storage)
  - `corrida.service.ts`: 7 métodos (estimar, criar, obter, cancelar, aceitar, iniciar, finalizar)
  - `localizacao.service.ts`: Wrapper @capacitor/geolocation com permissões iOS/Android
  - `websocket.service.ts`: Conecta `ws://localhost:8000/ws/corridas/{id}`
  
- **Rotas** (`app-routing.module.ts`):
  - `/passageiro/*`: mapa (solicitar), acompanhar (WebSocket), historico
  - `/motociclista/*`: chamadas (online/offline toggle), executar (foto capacete), carteira

- **Capacitor Plugins**:
  - Geolocation: Rastreamento em tempo real (motociclista)
  - Camera: Verificação segurança (foto do capacete obrigatória antes de iniciar)
  - Preferences: Substituiu Storage deprecado (Capacitor 5.x)
  - Network, Push Notifications (estrutura preparada)

- **Mapa Interativo**:
  - **Leaflet** (open-source e gratuito): `leaflet@1.9.4`
  - Componente reutilizável: `MapaLeafletComponent` em `app/componentes/mapa-leaflet/`
  - Tiles do OpenStreetMap (sem necessidade de API key)
  - Marcadores customizados: origem (verde), destino (vermelho), motorista (azul com animação)
  - Rota traçada com polyline
  - Auto-zoom para incluir todos os pontos
  - Atualização em tempo real da posição do motorista

## Fluxos Críticos de Dados

### Fluxo Passageiro (Solicitar Corrida)
1. `mapa.page.ts`: `definirOrigem()` → Geolocation ou input manual
2. `corridaService.estimar()` → `POST /corridas/estimar` (haversine + tarifacao)
3. `corridaService.criar()` → `POST /passageiro/corridas` (cria com `estado='buscando'`)
4. Backend: Publica em Redis pub/sub para motoristas próximos (TODO: implementar)
5. `acompanhar.page.ts`: `wsService.conectar()` → WebSocket `/ws/corridas/{id}`
6. Motorista aceita → estado muda para `'aceita'` → WebSocket notifica passageiro

### Fluxo Motorista (Executar Corrida)
1. `chamadas.page.ts`: `alternarStatus()` → `PUT /motorista/status-online` (true)
2. `iniciarBuscaChamadas()` → Mock simula, prod consulta Redis/DB
3. `aceitarChamada()` → `POST /motorista/corridas/{id}/aceitar` (estado → `'aceita'`)
4. `executar.page.ts`: `tirarFotoCapacete()` → Camera API (obrigatório)
5. `iniciarCorrida()` → Valida foto + `POST /corridas/{id}/iniciar` (estado → `'iniciada'`)
6. `finalizarCorrida()` → `POST /corridas/{id}/finalizar` (calcula `preco_final`)

### Fluxo Pagamento
1. `roteadores/pagamentos.py`: `POST /pagamentos/iniciar` (cria registro `estado='iniciado'`)
2. Provider: `PixProvider.processar()` / `CartaoProvider.processar()` / `DinheiroProvider.processar()`
3. Mock retorna sucesso imediato, prod integra gateways (TODO: Stripe/Mercado Pago)
4. `POST /pagamentos/{id}/capturar` ou `POST /pagamentos/{id}/estornar`

## Convenções de Desenvolvimento

### Backend Python
- **Async/Await obrigatório**: `async def`, `await db.execute()`, `asyncpg` driver
- **Dependency Injection**: `deps.py` fornece `obter_db()`, `obter_usuario_atual()`
- **Esquemas Pydantic**: `esquemas/*.py` para request/response validation
- **Alembic Migrations**: `alembic revision -m "mensagem"` → `alembic upgrade head`
- **Testes**: `pytest` em `backend/tests/`, asserts em PT-BR (`assert resultado.status == "ok"`)

### Frontend TypeScript
- **RxJS Patterns**: 
  - `toPromise()` retorna `T | undefined`, sempre adicionar `|| null` ou null check
  - Exemplo: `this.corrida = await this.corridaService.obter(id).toPromise() || null;`
- **Ionic Lifecycle**: `ionViewWillEnter()` para carregar dados (não `ngOnInit()` em lazy modules)
- **Loading/Toast**: Sempre usar `LoadingController` e `ToastController` para feedback
- **Capacitor Web Fallback**: Plugins podem falhar no browser, adicionar `try/catch` ou mock

### Docker & Deployment
- **PowerShell Script**: `.\scripts\make.ps1 <acao>` (up, rebuild, down, seed, test, logs)
- **Environment**: `.env.exemplo` → copiar para `.env` antes de `docker compose up`
- **Alembic Auto-run**: Container backend executa `alembic upgrade head` no startup
- **Volume Mounts**: `/app` montado para hot reload com `--reload` flag

## Comandos Essenciais

### Desenvolvimento Local
```powershell
# Backend + DB
.\scripts\make.ps1 up          # Sobe PostgreSQL, Redis, Backend (8000), Admin (4200)
.\scripts\make.ps1 seed        # Popula dados iniciais (usuarios, corridas exemplo)
.\scripts\make.ps1 test        # Roda pytest no container
.\scripts\make.ps1 logs        # Tail -f backend logs

# Mobile App (sem Docker)
cd mobile-app
npm install
ionic serve --port=8100        # Mock mode (useMock: true)

# Mobile Build Android
ionic build
npx cap sync
npx cap open android           # Abre Android Studio
```

### Migrações Backend
```bash
docker compose exec backend alembic revision -m "adicionar campo xyz"
docker compose exec backend alembic upgrade head
docker compose exec backend alembic downgrade -1
```

### Troubleshooting
- **Erro Capacitor Storage**: Projeto usa `@capacitor/preferences` (5.0.6), NÃO `@capacitor/storage`
- **Ionic Serve Loop**: Evitar `npm run ionic:serve`, usar diretamente `ionic serve`
- **TypeScript `undefined`**: RxJS `toPromise()` requer null coalescing (`|| null`)
- **WebSocket 404**: Verificar backend rodando e URL em `websocket.service.ts`

## Pontos de Atenção para Edição

### Ao Adicionar Novos Modelos
1. Criar em `backend/app/modelos/`
2. Importar em `backend/app/modelos/__init__.py`
3. Criar esquema Pydantic em `backend/app/esquemas/`
4. Gerar migração: `alembic revision --autogenerate -m "adicionar modelo X"`
5. Atualizar seeds em `backend/app/sementes.py` se necessário

### Ao Adicionar Rotas API
1. Criar roteador em `backend/app/roteadores/`
2. `APIRouter(prefix="/recurso", tags=["Nome"])` em PT-BR
3. Incluir em `backend/app/main.py`: `api.include_router(roteador, prefix=config.api_prefix)`
4. Atualizar serviço TypeScript correspondente em `mobile-app/src/app/servicos/`
5. Adicionar método mock em `api-mock.service.ts` se `useMock: true`

### Ao Adicionar Páginas Mobile
1. `ionic generate page paginas/<perfil>/<nome>` (gera module + routing + page)
2. Adicionar rota em `<perfil>-routing.module.ts` com guards apropriados
3. Injetar serviços necessários (`AuthService`, `CorridaService`, etc.)
4. Usar `ionViewWillEnter()` para carregar dados (não `ngOnInit()`)

## Contexto de Negócio

- **Papéis**: Sistema tri-role (passageiro, motociclista, admin) com JWT
- **Estados de Corrida**: Máquina de estados (`buscando` → `aceita` → `iniciada` → `em_andamento` → `finalizada/cancelada`)
- **Segurança Motorista**: Foto do capacete obrigatória via Camera API antes de iniciar corrida
- **Geolocalização**: Motorista envia coords a cada 5s quando online, passageiro rastreia via WebSocket
- **Pagamento**: Arquitetura plugável, mock retorna sucesso imediato
- **Localização**: BR (BRL, dd/MM/yyyy, America/Recife timezone)
