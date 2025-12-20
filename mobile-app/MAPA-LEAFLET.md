# 🗺️ Integração de Mapas - Leaflet (Gratuito)

## ✅ Por que Leaflet?

- ✅ **100% Gratuito** - sem necessidade de API keys ou cartão de crédito
- ✅ **Open Source** - código aberto e mantido pela comunidade
- ✅ **Leve** - apenas ~40KB gzipped
- ✅ **Tiles do OpenStreetMap** - mapas mundiais gratuitos
- ✅ **Mobile-friendly** - funciona perfeitamente em dispositivos móveis
- ✅ **Extensível** - muitos plugins disponíveis

## 📦 Instalação

Já está instalado! Mas se precisar reinstalar:

```bash
npm install leaflet @types/leaflet --save
```

CSS já adicionado em `angular.json`:
```json
"styles": [
  "node_modules/leaflet/dist/leaflet.css"
]
```

## 🎯 Componente MapaLeafletComponent

### Localização
`src/app/componentes/mapa-leaflet/`

### Uso Básico

```html
<app-mapa-leaflet 
  altura="300px"
  [origemLat]="-8.0476"
  [origemLon]="-34.877"
  [destinoLat]="-8.0580"
  [destinoLon]="-34.890"
></app-mapa-leaflet>
```

### Inputs Disponíveis

| Input | Tipo | Descrição |
|-------|------|-----------|
| `altura` | `string` | Altura do mapa (ex: "400px") |
| `origemLat` | `number?` | Latitude da origem |
| `origemLon` | `number?` | Longitude da origem |
| `destinoLat` | `number?` | Latitude do destino |
| `destinoLon` | `number?` | Longitude do destino |
| `motoristaLat` | `number?` | Latitude do motorista |
| `motoristaLon` | `number?` | Longitude do motorista |
| `rastreamentoAtivo` | `boolean` | Ativa animação do motorista |

### Métodos Públicos

```typescript
// Atualizar posição do motorista em tempo real
mapaComponent.atualizarPosicaoMotorista(lat, lon);

// Centralizar mapa em uma coordenada
mapaComponent.centralizar(lat, lon, zoom);

// Atualizar todos os marcadores
mapaComponent.atualizarMarcadores();
```

## 🎨 Marcadores Customizados

### Origem (Verde 🟢)
- Círculo verde sólido
- Borda branca
- Popup: "Origem"

### Destino (Vermelho 🔴)
- Círculo vermelho sólido
- Borda branca
- Popup: "Destino"

### Motorista (Azul 🔵)
- Círculo azul com ícone de bicicleta
- Animação de pulso quando `rastreamentoAtivo=true`
- Sombra para destacar
- Popup: "Motorista"

## 🛣️ Rota

Quando origem e destino estão definidos:
- Linha azul tracejada conectando os pontos
- `dashArray: '10, 10'` para efeito pontilhado
- Opacity 0.7

## 📍 Fontes de Tiles Gratuitas

### OpenStreetMap (padrão)
```typescript
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap',
  maxZoom: 19
})
```

### Outras Opções Gratuitas

**Stamen Terrain (relevo)**
```typescript
L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg')
```

**CartoDB Dark Matter (noturno)**
```typescript
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png')
```

**CartoDB Voyager (limpo)**
```typescript
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png')
```

## 🔧 Exemplo Completo

### mapa.page.ts
```typescript
import { Component, ViewChild } from '@angular/core';
import { MapaLeafletComponent } from '../../componentes/mapa-leaflet/mapa-leaflet.component';

export class MapaPage {
  @ViewChild(MapaLeafletComponent) mapaRef!: MapaLeafletComponent;

  origem = { lat: -8.0476, lon: -34.877 };
  destino = { lat: -8.0580, lon: -34.890 };

  simularMovimentoMotorista() {
    // Simula motorista se movendo
    setInterval(() => {
      const novaLat = this.origem.lat + (Math.random() * 0.01);
      const novaLon = this.origem.lon + (Math.random() * 0.01);
      this.mapaRef.atualizarPosicaoMotorista(novaLat, novaLon);
    }, 2000);
  }
}
```

### mapa.page.html
```html
<app-mapa-leaflet 
  #mapaRef
  altura="400px"
  [origemLat]="origem.lat"
  [origemLon]="origem.lon"
  [destinoLat]="destino.lat"
  [destinoLon]="destino.lon"
  [rastreamentoAtivo]="true"
></app-mapa-leaflet>
```

## 📱 Integrações Atuais

### Página do Passageiro - Solicitar Corrida
- Mapa mostra origem e destino
- Atualiza quando usuário define coordenadas
- Rota desenhada após calcular estimativa

### Página do Passageiro - Acompanhar Corrida
- Mapa com 3 marcadores: origem, destino, motorista
- Atualização automática da posição do motorista a cada 2s
- Zoom automático para incluir todos os pontos
- Animação do marcador do motorista quando em movimento

### Página do Motorista - Executar Corrida
- Pode ser adicionada para mostrar rota até origem
- Depois rota até destino
- Posição em tempo real

## 🐛 Troubleshooting

### Ícones não aparecem
Já foi corrigido com:
```typescript
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/...',
  iconUrl: 'https://cdnjs.cloudflare.com/...',
  shadowUrl: 'https://cdnjs.cloudflare.com/...'
});
```

### Mapa não carrega
- Verifique se `angular.json` tem o CSS do Leaflet
- Confira se `#mapa-leaflet` existe no DOM
- Use `setTimeout()` no `ngAfterViewInit()`

### Marcadores desalinhados
- Confira `iconAnchor` do ícone
- Ajuste para metade do `iconSize`

## 🚀 Melhorias Futuras

### Clustering
```bash
npm install leaflet.markercluster
```
Agrupar motoristas próximos quando admin visualiza mapa geral

### Roteamento Real
```bash
npm install leaflet-routing-machine
```
Usar OSM para calcular rotas reais em vez de linha reta

### Geocoding
```bash
npm install leaflet-control-geocoder
```
Converter endereços em coordenadas

### Heatmap
```bash
npm install leaflet.heat
```
Mostrar zonas de alta demanda para motoristas

## 📚 Recursos

- **Docs Oficiais**: https://leafletjs.com/
- **Plugins**: https://leafletjs.com/plugins.html
- **OpenStreetMap**: https://www.openstreetmap.org/
- **Tiles Providers**: https://leaflet-extras.github.io/leaflet-providers/preview/

---

**Mapas Gratuitos, Zero Custo, 100% Open Source! 🗺️🇧🇷**
