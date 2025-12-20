# 🗺️ Teste de Geocodificação - Busca de Endereços

## ✅ Implementação Completa

### APIs Utilizadas (com fallback automático)
1. **Photon** (https://photon.komoot.io) - Primeira tentativa
   - ✅ Mais rápida
   - ✅ Sem rate limiting agressivo
   - ✅ Gratuita e open-source
   
2. **Nominatim** (https://nominatim.openstreetmap.org) - Fallback
   - ✅ Dados completos do OpenStreetMap
   - ✅ Busca reversa (coordenadas → endereço)
   - ⚠️ Rate limit: 1 requisição/segundo

### Filtros Aplicados
- ✅ **Apenas Brasil**: Todos os resultados são filtrados para BR
- ✅ **Mínimo 3 caracteres**: Evita requisições desnecessárias
- ✅ **Debounce 500ms**: Aguarda usuário parar de digitar
- ✅ **User-Agent header**: Requisito da API Nominatim

## 🧪 Como Testar

### 1. Iniciar o app
```powershell
cd mobile-app
ionic serve --port=8100
```

### 2. Abrir no navegador
- URL: http://localhost:8100
- Login: Clicar em "Entrar Agora" (passageiro1)

### 3. Testar Busca de Endereços

#### Exemplos de Busca - Recife, PE:
| Digite | Resultados Esperados |
|--------|---------------------|
| `boa viagem` | Av. Boa Viagem, Praia de Boa Viagem, Bairro Boa Viagem |
| `shopping recife` | Shopping Recife, Shopping RioMar Recife |
| `marco zero` | Praça Rio Branco (Marco Zero), Recife Antigo |
| `rua da união` | Rua da União (várias), com bairros diferentes |
| `aeroporto` | Aeroporto Internacional do Recife |
| `praia pina` | Praia do Pina, Bairro do Pina |

#### Exemplos de Busca - Outras Cidades:
| Digite | Resultados Esperados |
|--------|---------------------|
| `av paulista` | Avenida Paulista - São Paulo |
| `copacabana` | Praia de Copacabana - Rio de Janeiro |
| `pelourinho` | Centro Histórico - Salvador |

### 4. Verificar Funcionalidades

#### ✅ Autocomplete
1. Digite "boa" → Aguarde → Veja sugestões aparecerem
2. Digite mais letras → Veja lista sendo refinada
3. Clique em uma sugestão → Campo preenche automaticamente

#### ✅ Busca GPS
1. Clique em "Usar Minha Localização"
2. Permita acesso (navegador pedirá)
3. Veja endereço ser preenchido automaticamente

#### ✅ Limpar Campo
1. Digite qualquer coisa
2. Clique no "X" à direita → Campo limpa

#### ✅ Calcular Estimativa
1. Preencha origem: "boa viagem"
2. Preencha destino: "marco zero"
3. Clique "Calcular Estimativa"
4. Veja: Distância, Tempo, Preço

## 🔍 Monitorar no Console do Navegador

Abra DevTools (F12) e veja os logs:

```
Console:
- "Resultados Photon: [...]" → Busca via Photon funcionou
- "Photon sem resultados, tentando Nominatim..." → Fallback acionado
- "Resultados Nominatim: [...]" → Busca via Nominatim funcionou
```

## 🐛 Troubleshooting

### Problema: Nenhum resultado aparece
**Solução:**
1. Verifique console do navegador (F12)
2. Veja se há erros CORS
3. Teste diretamente no navegador:
   ```
   https://photon.komoot.io/api?q=boa%20viagem&limit=5&lang=pt
   ```

### Problema: "HTTP 403 Forbidden" no Nominatim
**Causa:** Rate limiting (máx 1 req/segundo)
**Solução:** O sistema usa Photon primeiro, Nominatim só como fallback

### Problema: Resultados fora do Brasil
**Solução:** Já implementado! Código filtra apenas `countrycodes: 'br'`

### Problema: GPS não funciona
**Causa:** Navegador bloqueou permissão
**Solução:**
1. Chrome: Ícone de cadeado na barra → Localização → Permitir
2. Firefox: Ícone de informação → Permissões → Localização → Permitir

## 📊 Performance Esperada

| Métrica | Valor |
|---------|-------|
| Tempo de resposta (Photon) | 200-500ms |
| Tempo de resposta (Nominatim) | 500-1000ms |
| Debounce | 500ms após parar de digitar |
| Resultados por busca | Até 5 sugestões |

## ✨ Melhorias Futuras (Opcional)

1. **Cache local**: Salvar buscas recentes
2. **Histórico de endereços**: Mostrar últimos 5 endereços usados
3. **Favoritos**: Permitir salvar "Casa" e "Trabalho"
4. **Clique no mapa**: Permitir escolher origem/destino clicando no mapa
5. **ViaCEP**: Adicionar busca por CEP brasileiro (API nacional)

## 🎯 Checklist de Testes

- [ ] Digite "boa viagem" → Aparecem sugestões
- [ ] Clique em uma sugestão → Preenche o campo
- [ ] Clique no X → Limpa o campo
- [ ] Digite menos de 3 caracteres → Mostra hint "Digite pelo menos 3 caracteres"
- [ ] Preencha origem e destino → Calcule estimativa
- [ ] Use GPS → Preenche origem automaticamente
- [ ] Abra DevTools → Veja logs de "Resultados Photon"
- [ ] Digite "xyzabc123" → Sem resultados, sem erro
- [ ] Digite endereço de outra cidade → Funciona (ex: "av paulista")
- [ ] Digite caracteres especiais "são joão" → Funciona com acentos

## 📝 Notas Técnicas

### Diferenças entre APIs

**Photon:**
- Formato: GeoJSON (`features` array)
- Coordenadas: `[longitude, latitude]` (invertido!)
- Filtro Brasil: `properties.countrycode === 'BR'`
- Campos: `street`, `city`, `district`, `state`

**Nominatim:**
- Formato: JSON array direto
- Coordenadas: `lat`, `lon` separados
- Filtro Brasil: Parâmetro `countrycodes=br`
- Campos: `address.road`, `address.city`, `address.suburb`

### Headers Obrigatórios
```typescript
headers: {
  'User-Agent': 'MotoTaxiApp/1.0'
}
```
**Por quê?** Nominatim rejeita requisições sem User-Agent (política anti-abuse)

---

**Desenvolvido em:** Dezembro 2025  
**Tecnologias:** Ionic 7, Angular 17, Photon API, Nominatim API
