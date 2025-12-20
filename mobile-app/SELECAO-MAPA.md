# Seleção de Origem/Destino no Mapa

## ✨ Funcionalidade Adicionada

Agora o usuário pode **definir origem e destino clicando diretamente no mapa**, além das opções existentes de busca por texto e GPS.

## 🎯 Como Usar

### Definir Origem
1. Na tela "Solicitar Corrida", role até o card **"📍 De onde você está?"**
2. Clique no botão **"Selecionar no Mapa"** (ícone de pin)
3. O mapa ficará destacado com borda azul e cursor em cruz
4. Clique em **qualquer ponto do mapa**
5. O app buscará o endereço das coordenadas automaticamente
6. Origem definida! ✅

### Definir Destino
1. Role até o card **"🎯 Para onde você vai?"**
2. Clique no botão **"Selecionar no Mapa"** (ícone de pin vermelho)
3. Clique no ponto desejado no mapa
4. Destino definido! ✅

## 🔧 Implementação Técnica

### Arquivos Modificados

#### `mapa-leaflet.component.ts`
- **Novos Inputs**:
  - `@Input() modoSelecao: 'origem' | 'destino' | null` - Controla qual ponto será selecionado
  
- **Novo Output**:
  - `@Output() pontoSelecionado = new EventEmitter<{lat, lon, tipo}>()` - Emite coordenadas ao clicar
  
- **Evento de Clique**:
  ```typescript
  this.mapa.on('click', (e: L.LeafletMouseEvent) => {
    if (this.modoSelecao) {
      this.pontoSelecionado.emit({
        lat: e.latlng.lat,
        lon: e.latlng.lng,
        tipo: this.modoSelecao
      });
    }
  });
  ```

- **Feedback Visual**:
  - Borda azul quando em modo seleção
  - Cursor muda para crosshair (mira)

#### `mapa.page.ts`
- **Nova Variável**:
  - `modoSelecaoMapa: 'origem' | 'destino' | null` - Estado do modo de seleção
  
- **Novos Métodos**:
  ```typescript
  selecionarOrigemNoMapa()  // Ativa modo seleção origem
  selecionarDestinoNoMapa() // Ativa modo seleção destino
  onPontoSelecionadoMapa()  // Processa coordenadas + busca reversa
  ```

#### `mapa.page.html`
- **Novos Botões**:
  - "Selecionar no Mapa" (origem) - cor primary
  - "Selecionar no Mapa" (destino) - cor danger
  
- **Binding do Mapa**:
  ```html
  <app-mapa-leaflet
    [modoSelecao]="modoSelecaoMapa"
    (pontoSelecionado)="onPontoSelecionadoMapa($event)"
  >
  ```

## 🎨 Estilo Visual

### Estado Normal
- Mapa com borda suave cinza
- Cursor padrão (mão aberta)

### Modo Seleção Ativo
- **Borda azul** pulsante (`box-shadow: 0 0 0 3px var(--ion-color-primary)`)
- **Cursor crosshair** (mira de precisão)
- **Toast informativo**: "Clique no mapa para definir a origem/destino"

### Marcadores
- **Origem**: Círculo verde 🟢 (25px)
- **Destino**: Círculo vermelho 🔴 (25px)
- **Sugestões**: Círculos cinza 🔘 (15px, semi-transparentes)

## 📱 Fluxo do Usuário

```
┌─────────────────────────────┐
│ Usuário clica "Selecionar   │
│ no Mapa" (origem)            │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Toast: "Clique no mapa..."  │
│ Mapa: borda azul + crosshair│
│ modoSelecaoMapa = 'origem'  │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Usuário clica em ponto (X,Y)│
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Evento pontoSelecionado     │
│ emitido com {lat, lon, tipo}│
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Loading: "Buscando endereço"│
│ API: Geocoding Reverso      │
│ (Google Maps ou OSM)        │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Origem/Destino definido     │
│ Input preenchido com endereço│
│ Marcador aparece no mapa    │
│ modoSelecaoMapa = null      │
│ Toast: "Origem definida!"   │
└─────────────────────────────┘
```

## 🌍 Geocodificação Reversa

Quando o usuário clica no mapa, o app:

1. **Captura coordenadas**: `{lat: -8.047562, lon: -34.877034}`
2. **Chama API**: `geocodificacaoService.buscarEnderecoPorCoordenadas(lat, lon)`
3. **Formata endereço**: "Av. Boa Viagem, 1234 - Pina, Recife - PE, Brasil"
4. **Fallback**: Se API falhar, exibe coordenadas: "-8.047562, -34.877034"

### APIs Suportadas
- **Google Maps Geocoding API** (principal, se configurada)
- **Nominatim OSM** (fallback gratuito)

## ✅ Vantagens

- 🎯 **Precisão**: Usuário escolhe ponto exato (útil em áreas sem endereço definido)
- 🚀 **Rapidez**: 1 clique vs digitar/buscar endereço
- 🗺️ **Visual**: Intuitivo para usuários que conhecem o local
- 📍 **Flexibilidade**: 3 formas de definir origem/destino:
  1. Busca por texto
  2. GPS (Usar Minha Localização)
  3. **Clique no mapa** (NOVO!)

## 🧪 Como Testar

1. Inicie o app: `ionic serve`
2. Vá para "Solicitar Corrida"
3. Clique em **"Selecionar no Mapa"** (origem)
4. Observe:
   - ✅ Toast aparece
   - ✅ Mapa ganha borda azul
   - ✅ Cursor vira crosshair
5. Clique em qualquer ponto do mapa
6. Observe:
   - ✅ Loading "Buscando endereço..."
   - ✅ Input de origem preenchido
   - ✅ Marcador verde aparece
   - ✅ Toast "Origem definida!"
   - ✅ Borda azul desaparece

## 🔮 Melhorias Futuras

- [ ] Arrastar marcadores após definir (drag & drop)
- [ ] Tooltip com endereço ao passar mouse sobre o mapa
- [ ] Marcador temporário enquanto busca endereço
- [ ] Cancelar seleção (botão "Cancelar" quando em modo seleção)
- [ ] Histórico de locais recentes com sugestão no mapa
