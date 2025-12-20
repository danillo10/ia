import { Component, OnInit, OnDestroy, Input, AfterViewInit, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-mapa-leaflet',
  templateUrl: './mapa-leaflet.component.html',
  styleUrls: ['./mapa-leaflet.component.scss']
})
export class MapaLeafletComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() altura: string = '400px';
  @Input() origemLat?: number;
  @Input() origemLon?: number;
  @Input() destinoLat?: number;
  @Input() destinoLon?: number;
  @Input() motoristaLat?: number;
  @Input() motoristaLon?: number;
  @Input() rastreamentoAtivo: boolean = false;
  @Input() sugestoes: Array<{lat: number, lon: number}> = [];
  @Input() modoSelecao: 'origem' | 'destino' | null = null; // Define qual ponto será selecionado no clique
  
  @Output() pontoSelecionado = new EventEmitter<{lat: number, lon: number, tipo: 'origem' | 'destino'}>();

  private mapa?: L.Map;
  private marcadorOrigem?: L.Marker;
  private marcadorDestino?: L.Marker;
  private marcadorMotorista?: L.Marker;
  private marcadoresSugestoes: L.Marker[] = [];
  private rota?: L.Polyline;

  // Ícones personalizados
  private iconeOrigem = L.icon({
    iconUrl: 'assets/icons/marker-origem.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    // Fallback para ícone padrão se imagem não existir
    className: 'marcador-origem'
  });

  private iconeDestino = L.icon({
    iconUrl: 'assets/icons/marker-destino.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    className: 'marcador-destino'
  });

  private iconeMotorista = L.icon({
    iconUrl: 'assets/icons/marker-motorista.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    className: 'marcador-motorista'
  });

  ngOnInit() {}

  ngAfterViewInit() {
    setTimeout(() => this.inicializarMapa(), 100);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.mapa) {
      if (changes['origemLat'] || changes['origemLon'] || 
          changes['destinoLat'] || changes['destinoLon'] ||
          changes['motoristaLat'] || changes['motoristaLon']) {
        this.atualizarMarcadores();
      }
      
      if (changes['sugestoes']) {
        this.atualizarMarcadoresSugestoes();
      }

      if (changes['modoSelecao']) {
        this.atualizarCursorMapa();
      }
    }
  }

  ngOnDestroy() {
    if (this.mapa) {
      this.mapa.remove();
    }
  }

  private inicializarMapa() {
    // Centro padrão: Recife, PE
    const centroLat = this.origemLat || -8.0476;
    const centroLon = this.origemLon || -34.877;

    this.mapa = L.map('mapa-leaflet', {
      center: [centroLat, centroLon],
      zoom: 13,
      zoomControl: true,
      attributionControl: true
    });

    // Camada de tiles do OpenStreetMap (gratuito!)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(this.mapa);

    // Adiciona evento de clique no mapa
    this.mapa.on('click', (e: L.LeafletMouseEvent) => {
      if (this.modoSelecao) {
        this.pontoSelecionado.emit({
          lat: e.latlng.lat,
          lon: e.latlng.lng,
          tipo: this.modoSelecao
        });
      }
    });

    // Fix para ícones não aparecendo (problema conhecido do Leaflet com Webpack)
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    this.atualizarMarcadores();
  }

  atualizarMarcadores() {
    if (!this.mapa) return;

    // Remove marcadores anteriores
    if (this.marcadorOrigem) this.marcadorOrigem.remove();
    if (this.marcadorDestino) this.marcadorDestino.remove();
    if (this.marcadorMotorista) this.marcadorMotorista.remove();
    if (this.rota) this.rota.remove();

    const marcadores: L.LatLngExpression[] = [];

    // Origem (verde)
    if (this.origemLat && this.origemLon) {
      this.marcadorOrigem = L.marker([this.origemLat, this.origemLon], {
        icon: L.divIcon({
          className: 'custom-marker origem',
          html: '<div style="background-color: #10dc60; width: 25px; height: 25px; border-radius: 50%; border: 3px solid white;"></div>',
          iconSize: [25, 25],
          iconAnchor: [12, 12]
        })
      }).addTo(this.mapa);
      this.marcadorOrigem.bindPopup('<b>Origem</b>');
      marcadores.push([this.origemLat, this.origemLon]);
    }

    // Destino (vermelho)
    if (this.destinoLat && this.destinoLon) {
      this.marcadorDestino = L.marker([this.destinoLat, this.destinoLon], {
        icon: L.divIcon({
          className: 'custom-marker destino',
          html: '<div style="background-color: #f04141; width: 25px; height: 25px; border-radius: 50%; border: 3px solid white;"></div>',
          iconSize: [25, 25],
          iconAnchor: [12, 12]
        })
      }).addTo(this.mapa);
      this.marcadorDestino.bindPopup('<b>Destino</b>');
      marcadores.push([this.destinoLat, this.destinoLon]);
    }

    // Motorista (azul)
    if (this.motoristaLat && this.motoristaLon) {
      this.marcadorMotorista = L.marker([this.motoristaLat, this.motoristaLon], {
        icon: L.divIcon({
          className: 'custom-marker motorista',
          html: '<div style="background-color: #3880ff; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"><ion-icon name="bicycle" style="color: white; font-size: 18px; margin-left: 3px; margin-top: 3px;"></ion-icon></div>',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        })
      }).addTo(this.mapa);
      this.marcadorMotorista.bindPopup('<b>Motorista</b>');
      marcadores.push([this.motoristaLat, this.motoristaLon]);
    }

    // Desenhar rota se tiver origem e destino
    if (this.origemLat && this.origemLon && this.destinoLat && this.destinoLon) {
      this.rota = L.polyline([
        [this.origemLat, this.origemLon],
        [this.destinoLat, this.destinoLon]
      ], {
        color: '#3880ff',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10'
      }).addTo(this.mapa);
    }

    // Ajustar zoom para mostrar todos os marcadores
    if (marcadores.length > 0) {
      const bounds = L.latLngBounds(marcadores);
      this.mapa.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  /**
   * Atualiza marcadores de sugestões de busca
   */
  private atualizarMarcadoresSugestoes() {
    // Remove marcadores antigos
    this.marcadoresSugestoes.forEach(m => m.remove());
    this.marcadoresSugestoes = [];

    if (!this.mapa || !this.sugestoes || this.sugestoes.length === 0) {
      return;
    }

    // Ícone para sugestões (cinza)
    const iconeSugestao = L.divIcon({
      className: 'custom-marker sugestao',
      html: '<div style="background-color: #9E9E9E; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white; opacity: 0.8;"></div>',
      iconSize: [15, 15],
      iconAnchor: [7, 7]
    });

    // Adiciona marcador para cada sugestão
    this.sugestoes.forEach((sugestao, index) => {
      const marcador = L.marker([sugestao.lat, sugestao.lon], {
        icon: iconeSugestao
      }).addTo(this.mapa!);

      marcador.bindPopup(`Opção ${index + 1}`);
      this.marcadoresSugestoes.push(marcador);
    });

    // Ajusta zoom para incluir sugestões
    this.ajustarZoomComSugestoes();
  }

  /**
   * Ajusta zoom para incluir sugestões
   */
  private ajustarZoomComSugestoes() {
    if (!this.mapa) return;

    const pontos: L.LatLngExpression[] = [];

    // Adiciona sugestões
    this.sugestoes.forEach(s => {
      pontos.push([s.lat, s.lon]);
    });

    // Adiciona origem/destino se existirem
    if (this.origemLat !== undefined && this.origemLon !== undefined) {
      pontos.push([this.origemLat, this.origemLon]);
    }
    if (this.destinoLat !== undefined && this.destinoLon !== undefined) {
      pontos.push([this.destinoLat, this.destinoLon]);
    }

    if (pontos.length > 0) {
      const bounds = L.latLngBounds(pontos);
      this.mapa.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }

  atualizarPosicaoMotorista(lat: number, lon: number) {
    this.motoristaLat = lat;
    this.motoristaLon = lon;
    
    if (this.marcadorMotorista && this.mapa) {
      this.marcadorMotorista.setLatLng([lat, lon]);
    } else {
      this.atualizarMarcadores();
    }
  }

  centralizar(lat: number, lon: number, zoom: number = 15) {
    if (this.mapa) {
      this.mapa.setView([lat, lon], zoom);
    }
  }

  /**
   * Atualiza cursor do mapa quando entra/sai do modo de seleção
   */
  private atualizarCursorMapa() {
    const container = document.getElementById('mapa-leaflet');
    if (!container) return;

    if (this.modoSelecao) {
      container.classList.add('modo-selecao');
      container.style.cursor = 'crosshair';
    } else {
      container.classList.remove('modo-selecao');
      container.style.cursor = '';
    }
  }
}
