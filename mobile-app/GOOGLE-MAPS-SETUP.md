# 🗺️ Configuração Google Maps API

## 📋 Passo a Passo

### 1. Criar/Acessar Projeto no Google Cloud

1. Acesse: https://console.cloud.google.com/
2. Faça login com sua conta Google
3. Crie um novo projeto ou selecione um existente
   - Clique em "Select a project" → "New Project"
   - Nome: "Moto Taxi App"
   - Clique em "Create"

### 2. Ativar APIs Necessárias

No menu lateral, vá em **APIs & Services** → **Library**

Ative estas 3 APIs:
- ✅ **Places API** (busca de endereços)
- ✅ **Geocoding API** (conversão coordenadas ↔ endereço)
- ✅ **Directions API** (rotas e trajetos)

Para cada uma:
1. Busque o nome na barra de pesquisa
2. Clique na API
3. Clique em "Enable"

### 3. Criar API Key

1. Menu **APIs & Services** → **Credentials**
2. Clique em **"+ CREATE CREDENTIALS"** → **API key**
3. Copie a chave gerada (ex: `AIzaSyB...`)

### 4. Restringir API Key (IMPORTANTE!)

**Segurança:** Restrinja para evitar uso indevido

1. Clique na chave recém-criada
2. Em **Application restrictions**:
   - Desenvolvimento: Selecione "None" (temporário)
   - Produção: Selecione "HTTP referrers" e adicione seus domínios
     ```
     localhost:8100/*
     localhost:4200/*
     seu-dominio.com.br/*
     ```

3. Em **API restrictions**:
   - Selecione "Restrict key"
   - Marque apenas:
     - ✅ Places API
     - ✅ Geocoding API
     - ✅ Directions API

4. Clique em **Save**

### 5. Configurar no App

Edite: `mobile-app/src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  useMock: true,
  apiUrl: 'http://localhost:8000/api/v1',
  
  // Cole sua API Key aqui
  googleMapsApiKey: 'AIzaSyB...SUA_CHAVE_AQUI',
  
  wsUrl: 'ws://localhost:8000'
};
```

E também em: `mobile-app/src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  useMock: false,
  apiUrl: 'https://api.mototaxi.com.br/api/v1',
  
  // Chave de produção (pode ser a mesma ou diferente)
  googleMapsApiKey: 'AIzaSyB...SUA_CHAVE_PRODUCAO',
  
  wsUrl: 'wss://api.mototaxi.com.br'
};
```

### 6. Habilitar Faturamento (Necessário para Produção)

⚠️ **IMPORTANTE**: Google Maps APIs exigem conta de faturamento

**Crédito Gratuito:**
- US$ 200/mês de uso gratuito
- Suficiente para ~28.000 requisições de Places API/mês
- Não cobra automaticamente após limite (apenas bloqueia)

**Como habilitar:**
1. Menu **Billing** → **Link a billing account**
2. Adicione cartão de crédito (não cobra se dentro do limite)
3. Defina alertas de orçamento

**Cálculo de Uso Estimado:**
```
Places Autocomplete: $2.83 por 1000 requisições
Geocoding: $5.00 por 1000 requisições
Directions: $5.00 por 1000 requisições

Crédito: $200/mês
Exemplo: ~70.000 buscas de autocomplete grátis/mês
```

### 7. CORS (Problema no Navegador)

⚠️ **Google Maps APIs bloqueiam CORS no browser!**

**Solução 1: Proxy CORS (Desenvolvimento)**
```typescript
// Já configurado no código
const url = `https://cors-anywhere.herokuapp.com/${this.GOOGLE_PLACES_URL}`;
```

**Ative o proxy:**
1. Acesse: https://cors-anywhere.herokuapp.com/corsdemo
2. Clique em "Request temporary access"

**Solução 2: Backend Proxy (Produção)**
Crie endpoint no backend que chama Google Maps e retorna para o app.

**Solução 3: App Mobile**
No app compilado (Android/iOS), CORS não existe! Só afeta `ionic serve`.

### 8. Testar Integração

```powershell
cd mobile-app
ionic serve
```

**Teste:**
1. Abra F12 (DevTools) → Console
2. Digite no campo de origem: "av boa viagem"
3. Veja no console:
   ```
   Buscando endereços: av boa viagem
   Google Places retornou: OK
   Sugestões encontradas: 5
   ```

## 🔍 Troubleshooting

### Erro: "API Key not configured"
- Verifique `environment.ts`
- Certifique-se de substituir `'SUA_CHAVE_API_AQUI'`

### Erro: "This API project is not authorized"
- Vá em Google Cloud Console
- Ative as APIs mencionadas no passo 2

### Erro: "CORS blocked"
- Use proxy CORS (passo 7)
- Ou teste no app mobile compilado

### Erro: "REQUEST_DENIED"
- Habilite faturamento (passo 6)
- Verifique restrições da API Key

### Nenhum resultado retorna
- Verifique console do navegador
- Teste API Key diretamente:
  ```
  https://maps.googleapis.com/maps/api/geocode/json?address=recife&key=SUA_CHAVE
  ```

## 📊 Monitoramento de Uso

**Ver uso em tempo real:**
1. Google Cloud Console
2. Menu **APIs & Services** → **Dashboard**
3. Veja gráficos de requisições por API

**Definir alertas:**
1. Menu **Billing** → **Budgets & alerts**
2. Crie alerta para avisar quando atingir % do crédito

## 💡 Dicas

✅ **Use em Produção:** Google Maps tem melhor precisão no Brasil
✅ **Desenvolvimento:** Pode usar OSM/Photon (gratuito, sem chave)
✅ **Híbrido:** OSM para dev, Google para prod
⚠️ **Nunca exponha** API Key em repositório público
🔒 **Sempre restrinja** API Key por domínio e APIs

## 🚀 Próximos Passos

Após configurar:
1. [ ] Substituir chave em `environment.ts`
2. [ ] Ativar proxy CORS
3. [ ] Testar busca de endereços
4. [ ] Verificar uso no dashboard Google Cloud
5. [ ] Configurar alertas de orçamento

---

**Documentação Oficial:**
- https://developers.google.com/maps/documentation/places/web-service
- https://developers.google.com/maps/documentation/geocoding
- https://developers.google.com/maps/documentation/directions
