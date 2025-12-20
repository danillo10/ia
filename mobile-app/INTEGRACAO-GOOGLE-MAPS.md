# Integração Google Maps APIs - Moto Táxi

## ✅ Status da Implementação

O serviço de geocodificação foi **completamente reescrito** para usar **Google Maps APIs** ao invés de OpenStreetMap/Nominatim/Photon.

### APIs Utilizadas

1. **Places Autocomplete API** - Busca de endereços com autocompletar
2. **Place Details API** - Obter coordenadas de um Place ID
3. **Geocoding API** - Busca reversa (coordenadas → endereço)

## 🔧 Configuração Necessária

### Passo 1: Obter Chave da API

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione existente
3. Ative as seguintes APIs:
   - **Places API**
   - **Geocoding API**  
   - **Directions API** (para uso futuro)

4. Vá em **APIs & Services > Credentials**
5. Clique em **Create Credentials > API Key**
6. **Restrinja a chave**:
   - **Application restrictions**: HTTP referrers (websites)
   - Adicione: `http://localhost:8100/*` (dev) e seu domínio de produção
   - **API restrictions**: Selecione apenas as 3 APIs acima

### Passo 2: Configurar no Projeto

Edite `mobile-app/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  useMock: true,
  apiUrl: 'http://localhost:8000/api/v1',
  wsUrl: 'ws://localhost:8000',
  
  googleMapsApiKey: 'AIzaSy...' // ← Cole sua chave AQUI
};
```

Edite `mobile-app/src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  useMock: false,
  apiUrl: 'https://api.mototaxi.com.br/api/v1',
  wsUrl: 'wss://api.mototaxi.com.br',
  
  googleMapsApiKey: 'AIzaSy...' // ← Chave de PRODUÇÃO
};
```

### Passo 3: Ativar Proxy CORS (Desenvolvimento)

**IMPORTANTE**: As APIs do Google bloqueiam requisições diretas do navegador (CORS).

**Solução temporária para desenvolvimento**:

1. Acesse: https://cors-anywhere.herokuapp.com/corsdemo
2. Clique em **"Request temporary access to the demo server"**
3. Aguarde aprovação (10-30 segundos)

**Solução definitiva (produção)**:

Configure um proxy no **backend FastAPI**:

```python
# backend/app/roteadores/google_maps_proxy.py
from fastapi import APIRouter, Query
import httpx
from app.core.config import settings

router = APIRouter(prefix="/api/google", tags=["Google Maps Proxy"])

@router.get("/places/autocomplete")
async def autocomplete(
    input: str = Query(...),
    components: str = "country:br",
    language: str = "pt-BR",
    location: str | None = None,
    radius: int = 50000
):
    params = {
        "input": input,
        "key": settings.GOOGLE_MAPS_API_KEY,
        "language": language,
        "components": components
    }
    if location:
        params["location"] = location
        params["radius"] = radius
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://maps.googleapis.com/maps/api/place/autocomplete/json",
            params=params
        )
    return response.json()

@router.get("/places/details")
async def details(
    place_id: str = Query(...),
    fields: str = "geometry,name,formatted_address,types",
    language: str = "pt-BR"
):
    params = {
        "place_id": place_id,
        "fields": fields,
        "key": settings.GOOGLE_MAPS_API_KEY,
        "language": language
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://maps.googleapis.com/maps/api/place/details/json",
            params=params
        )
    return response.json()

@router.get("/geocode")
async def geocode(
    latlng: str = Query(...),
    language: str = "pt-BR"
):
    params = {
        "latlng": latlng,
        "key": settings.GOOGLE_MAPS_API_KEY,
        "language": language
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://maps.googleapis.com/maps/api/geocode/json",
            params=params
        )
    return response.json()
```

Depois, atualize `geocodificacao.service.ts`:

```typescript
// Trocar:
const url = `https://cors-anywhere.herokuapp.com/...`;

// Por:
const url = `${environment.apiUrl}/google/places/autocomplete`;
```

## 💰 Custos

Google Maps oferece **$200/mês GRÁTIS** em créditos.

**Preços (após usar crédito grátis)**:
- **Autocomplete**: $2.83 / 1000 requisições
- **Place Details**: $17 / 1000 requisições  
- **Geocoding**: $5 / 1000 requisições

**Estimativa de uso:**
- 1 busca de autocomplete = 1 chamada Autocomplete
- 1 seleção de endereço = 1 chamada Place Details
- Total por solicitação: ~$0.0198 (~R$ 0.10)

Com $200 grátis/mês: **~10.000 corridas solicitadas SEM CUSTO**.

## 🧪 Testes

### Teste 1: Busca de Endereço

```typescript
import { GeocodificacaoService } from './servicos/geocodificacao.service';

// No componente
this.geocodificacao.buscarEnderecos('Av Boa Viagem, Recife')
  .subscribe(resultados => {
    console.log('Resultados:', resultados);
    // Deve retornar array com lat, lon, nome, nomeCompleto
  });
```

### Teste 2: Busca Reversa

```typescript
this.geocodificacao.buscarEnderecoPorCoordenadas(-8.0476, -34.8770)
  .subscribe(endereco => {
    console.log('Endereço:', endereco);
    // Deve retornar: "Av. Boa Viagem, Pina, Recife - PE, Brasil"
  });
```

## 🔍 Troubleshooting

### Erro: "API Key not configured"

✅ **Solução**: Substitua `'SUA_CHAVE_API_AQUI'` em `environment.ts`

### Erro: "CORS blocked"

✅ **Solução**: Ative proxy em https://cors-anywhere.herokuapp.com/corsdemo

### Erro: "REQUEST_DENIED"

✅ **Verificar**:
1. API Key está correta?
2. APIs estão ativas no Google Cloud?
3. Billing está configurado?
4. Restrições da chave permitem `localhost:8100`?

### Erro: "ZERO_RESULTS"

✅ **Normal**: Endereço não existe ou digitação incompleta.

### Resultados vazios mesmo com endereço correto

✅ **Verificar**: Proxy CORS foi ativado? API Key tem permissão para Autocomplete?

## 📊 Monitoramento de Uso

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Vá em **APIs & Services > Dashboard**
3. Clique em cada API para ver gráficos de uso
4. Configure alertas de cobrança em **Billing > Budgets & Alerts**

## 🎯 Próximos Passos

- [ ] Adicionar Directions API para rotas otimizadas
- [ ] Implementar proxy backend (remover cors-anywhere)
- [ ] Adicionar cache Redis para reduzir chamadas
- [ ] Implementar rate limiting no frontend (debounce já está ativo)
- [ ] Testar em dispositivo Android/iOS (Capacitor não tem CORS)

## 🔗 Documentação Oficial

- [Places Autocomplete](https://developers.google.com/maps/documentation/places/web-service/autocomplete)
- [Place Details](https://developers.google.com/maps/documentation/places/web-service/details)
- [Geocoding](https://developers.google.com/maps/documentation/geocoding/overview)
- [Pricing](https://mapsplatform.google.com/pricing/)
