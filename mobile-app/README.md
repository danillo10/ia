# Moto Táxi – Aplicativo Móvel (Ionic + Angular + Capacitor)

Aplicativo móvel híbrido 100% em português do Brasil para Android e iOS, com perfis de **Passageiro** e **Motociclista**.

## Funcionalidades

### Passageiro
- ✅ Login/Registro
- ✅ Solicitar corrida (origem/destino, estimativa de preço)
- ✅ Acompanhar corrida em tempo real (WebSocket)
- ✅ Cancelar corrida
- ✅ Avaliar motorista
- ✅ Histórico de corridas

### Motociclista
- ✅ Login/Registro
- ✅ Toggle online/offline com geolocalização em tempo real
- ✅ Receber chamadas próximas
- ✅ Aceitar corrida
- ✅ Verificação de segurança (foto do capacete antes de iniciar)
- ✅ Navegar até origem/destino
- ✅ Finalizar corrida
- ✅ Carteira com saldo e extrato

## Pré-requisitos

- Node.js 18+ e npm
- Ionic CLI: `npm install -g @ionic/cli`
- Android Studio (para Android) ou Xcode (para iOS)

## Instalação

```bash
cd mobile-app
npm install
```

## Desenvolvimento (Browser)

```bash
ionic serve
```

Acesse http://localhost:8100

**Importante**: Configure a URL da API em `src/environments/environment.ts` apontando para o backend rodando (ex: `http://localhost:8000/api/v1`).

## Build para Android

1. Adicionar plataforma Android:

```bash
ionic cap add android
```

2. Build do projeto:

```bash
ionic build
npx cap sync
```

3. Abrir no Android Studio:

```bash
npx cap open android
```

4. No Android Studio, conecte um dispositivo ou emulador e clique em **Run**.

## Build para iOS

1. Adicionar plataforma iOS (apenas no macOS):

```bash
ionic cap add ios
```

2. Build do projeto:

```bash
ionic build
npx cap sync
```

3. Abrir no Xcode:

```bash
npx cap open ios
```

4. No Xcode, selecione um dispositivo/simulador e clique em **Run**.

## Plugins Capacitor

O app utiliza os seguintes plugins Capacitor:

- **Geolocation**: Rastreamento de localização em tempo real (motorista)
- **Camera**: Foto do capacete (verificação de segurança)
- **Push Notifications**: Notificações de chamadas e eventos
- **Network**: Detectar conectividade
- **Storage**: Persistência local

### Permissões Android

Adicione ao `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.INTERNET" />
```

### Permissões iOS

Adicione ao `ios/App/App/Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Precisamos da sua localização para encontrar corridas próximas.</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>Precisamos da sua localização para rastreamento em tempo real.</string>
<key>NSCameraUsageDescription</key>
<string>Precisamos da câmera para verificação de segurança (foto do capacete).</string>
```

## Estrutura do Código

```
src/
├── app/
│   ├── paginas/
│   │   ├── compartilhadas/
│   │   │   ├── login/              # Tela de login/registro
│   │   │   └── selecionar-perfil/  # Escolher passageiro ou motociclista
│   │   ├── passageiro/
│   │   │   ├── mapa/               # Solicitar corrida
│   │   │   ├── acompanhar/         # Acompanhar corrida em tempo real
│   │   │   └── historico/          # Histórico de corridas
│   │   └── motociclista/
│   │       ├── chamadas/           # Lista de chamadas próximas
│   │       ├── executar/           # Executar corrida (navegação)
│   │       └── carteira/           # Saldo e extrato
│   ├── servicos/
│   │   ├── api.service.ts          # Cliente HTTP
│   │   ├── auth.service.ts         # Autenticação JWT
│   │   ├── corrida.service.ts      # Operações de corrida
│   │   ├── localizacao.service.ts  # Geolocalização
│   │   └── websocket.service.ts    # Tempo real
│   ├── guards/
│   │   ├── auth.guard.ts           # Proteção de rotas autenticadas
│   │   └── papel.guard.ts          # Proteção por papel (passageiro/motociclista)
│   └── app-routing.module.ts       # Configuração de rotas
├── environments/
│   ├── environment.ts              # Dev (apiUrl: http://localhost:8000/api/v1)
│   └── environment.prod.ts         # Produção
└── theme/
    ├── variables.scss              # Cores e tema
    └── global.scss                 # Estilos globais
```

## Variáveis de Ambiente

Edite `src/environments/environment.ts` para desenvolvimento:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api/v1' // Backend local
};
```

Para produção, edite `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.mototaxi.com.br/api/v1'
};
```

## Testes

```bash
npm run test
```

## Observações

- **Mapas**: As telas possuem placeholders para integração com Google Maps (via `@capacitor/google-maps`) ou Leaflet. A lógica de cálculo de rota usa Haversine no backend por padrão.
- **WebSocket**: A URL do WebSocket está hardcoded em `websocket.service.ts` como `ws://localhost:8000/ws/corridas/{id}`. Ajuste para produção.
- **Push**: A estrutura está preparada para FCM/APNs, mas não implementada (requer configuração de servidor de notificações).

## Licença

Uso educacional/demonstrativo.
