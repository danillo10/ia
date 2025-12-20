import { Component, OnInit, OnDestroy, Input, AfterViewInit, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { environment } from '../../../environments/environment';

declare var google: any;

@Component({
  selector: 'app-mapa-google',
  templateUrl: './mapa-google.component.html',
  styleUrls: ['./mapa-google.component.scss']
})
export class MapaGoogleComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() altura: string = '400px';
  @Input() origemLat?: number;
  @Input() origemLon?: number;
  @Input() destinoLat?: number;
  @Input() destinoLon?: number;
  @Input() motoristaLat?: number;
  @Input() motoristaLon?: number;
  @Input() motoristasAtivos: any[] = []; // Lista de motoristas ativos para exibir
  @Input() rastreamentoAtivo: boolean = false;
  @Input() permiteArrastarOrigem: boolean = true; // Nova propriedade para controlar se permite arrastar
  
  @Output() origemAlterada = new EventEmitter<{lat: number, lon: number}>();
  @Output() mapaClicado = new EventEmitter<{lat: number, lon: number}>();

  private mapa?: any;
  private marcadorOrigem?: any;
  private marcadorDestino?: any;
  private marcadorMotorista?: any;
  private marcadoresMotoristas: any[] = []; // Array de marcadores de motoristas
  private directionsService?: any;
  private directionsRenderer?: any;
  private scriptCarregado = false;

  ngOnInit() {}

  ngAfterViewInit() {
    this.carregarGoogleMaps();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.mapa) {
      if (changes['origemLat'] || changes['origemLon'] || 
          changes['destinoLat'] || changes['destinoLon'] ||
          changes['motoristaLat'] || changes['motoristaLon']) {
        this.atualizarMarcadores();
      }
      
      if (changes['motoristasAtivos']) {
        this.atualizarMarcadoresMotoristas();
      }
      
      if (changes['permiteArrastarOrigem']) {
        this.configurarArrastoOrigem();
      }
    }
  }

  ngOnDestroy() {
    // Cleanup se necessário
  }

  private async carregarGoogleMaps() {
    if (typeof google !== 'undefined' && google.maps) {
      this.scriptCarregado = true;
      this.inicializarMapa();
      return;
    }

    // Carrega script do Google Maps
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=geometry&language=pt-BR&region=BR`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      this.scriptCarregado = true;
      this.inicializarMapa();
    };
    
    script.onerror = (erro) => {
      console.error('Erro ao carregar Google Maps:', erro);
    };

    document.head.appendChild(script);
  }

  private inicializarMapa() {
    if (!this.scriptCarregado || typeof google === 'undefined') {
      return;
    }

    // Centro padrão: Recife, PE
    const centroLat = this.origemLat || -8.0476;
    const centroLon = this.origemLon || -34.877;

    const opcoesMapa = {
      center: { lat: centroLat, lng: centroLon },
      zoom: 13,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: true,
      gestureHandling: 'cooperative',
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'on' }]
        }
      ]
    };

    this.mapa = new google.maps.Map(document.getElementById('mapa-google'), opcoesMapa);

    // Inicializa serviços de rota
    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true, // Não mostra marcadores padrão (usaremos customizados)
      polylineOptions: {
        strokeColor: '#4285F4',
        strokeWeight: 5,
        strokeOpacity: 0.8
      }
    });
    this.directionsRenderer.setMap(this.mapa);

    // Evento de clique no mapa
    this.mapa.addListener('click', (evento: any) => {
      this.mapaClicado.emit({
        lat: evento.latLng.lat(),
        lon: evento.latLng.lng()
      });
    });

    this.atualizarMarcadores();
  }

  private atualizarMarcadores() {
    if (!this.mapa || !google || !google.maps) return;

    // Remove marcadores existentes
    if (this.marcadorOrigem) this.marcadorOrigem.setMap(null);
    if (this.marcadorDestino) this.marcadorDestino.setMap(null);
    if (this.marcadorMotorista) this.marcadorMotorista.setMap(null);

    const bounds = new google.maps.LatLngBounds();
    let temMarcadores = false;

    // Marcador de Origem (Verde) - Arrastável
    if (this.origemLat !== undefined && this.origemLon !== undefined && 
        typeof this.origemLat === 'number' && typeof this.origemLon === 'number' &&
        !isNaN(this.origemLat) && !isNaN(this.origemLon)) {
      this.marcadorOrigem = new google.maps.Marker({
        position: { lat: this.origemLat, lng: this.origemLon },
        map: this.mapa,
        title: 'Origem (arraste para alterar)',
        draggable: this.permiteArrastarOrigem,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0C7.163 0 0 7.163 0 16c0 16 16 24 16 24s16-8 16-24C32 7.163 24.837 0 16 0z" fill="#34D399"/>
              <circle cx="16" cy="16" r="8" fill="white"/>
              <circle cx="16" cy="16" r="4" fill="#059669"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 40),
          anchor: new google.maps.Point(16, 40)
        }
      });

      // Evento de arrastar
      if (this.permiteArrastarOrigem) {
        this.marcadorOrigem.addListener('dragend', (evento: any) => {
          const novaPosicao = {
            lat: evento.latLng.lat(),
            lon: evento.latLng.lng()
          };
          this.origemAlterada.emit(novaPosicao);
        });
      }

      bounds.extend({ lat: this.origemLat, lng: this.origemLon });
      temMarcadores = true;
    }

    // Marcador de Destino (Vermelho) - Não arrastável
    if (this.destinoLat !== undefined && this.destinoLon !== undefined &&
        typeof this.destinoLat === 'number' && typeof this.destinoLon === 'number' &&
        !isNaN(this.destinoLat) && !isNaN(this.destinoLon)) {
      this.marcadorDestino = new google.maps.Marker({
        position: { lat: this.destinoLat, lng: this.destinoLon },
        map: this.mapa,
        title: 'Destino',
        draggable: false,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0C7.163 0 0 7.163 0 16c0 16 16 24 16 24s16-8 16-24C32 7.163 24.837 0 16 0z" fill="#EF4444"/>
              <circle cx="16" cy="16" r="8" fill="white"/>
              <circle cx="16" cy="16" r="4" fill="#DC2626"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 40),
          anchor: new google.maps.Point(16, 40)
        }
      });

      bounds.extend({ lat: this.destinoLat, lng: this.destinoLon });
      temMarcadores = true;
    }

    // Marcador do Motorista (Azul) - Não arrastável
    if (this.motoristaLat !== undefined && this.motoristaLon !== undefined &&
        typeof this.motoristaLat === 'number' && typeof this.motoristaLon === 'number' &&
        !isNaN(this.motoristaLat) && !isNaN(this.motoristaLon)) {
      this.marcadorMotorista = new google.maps.Marker({
        position: { lat: this.motoristaLat, lng: this.motoristaLon },
        map: this.mapa,
        title: 'Motorista',
        draggable: false,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
              <circle cx="18" cy="18" r="18" fill="#3B82F6"/>
              <circle cx="18" cy="18" r="14" fill="white"/>
              <path d="M18 8L22 12H20V20H24L18 28L12 20H16V12H14L18 8Z" fill="#1D4ED8"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(36, 36),
          anchor: new google.maps.Point(18, 18)
        }
      });

      bounds.extend({ lat: this.motoristaLat, lng: this.motoristaLon });
      temMarcadores = true;
    }

    // Desenhar rota se origem e destino estão definidos
    this.desenharRota();

    // Ajustar zoom para mostrar todos os marcadores
    if (temMarcadores) {
      this.mapa.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
      
      // Garante zoom mínimo
      google.maps.event.addListenerOnce(this.mapa, 'bounds_changed', () => {
        if (this.mapa.getZoom() > 16) {
          this.mapa.setZoom(16);
        }
      });
    }
  }

  private desenharRota() {
    if (!this.directionsService || !this.directionsRenderer) return;
    
    // Só desenha rota se origem e destino estão definidos e são números válidos
    if (this.origemLat !== undefined && this.origemLon !== undefined && 
        this.destinoLat !== undefined && this.destinoLon !== undefined &&
        typeof this.origemLat === 'number' && typeof this.origemLon === 'number' &&
        typeof this.destinoLat === 'number' && typeof this.destinoLon === 'number' &&
        !isNaN(this.origemLat) && !isNaN(this.origemLon) && 
        !isNaN(this.destinoLat) && !isNaN(this.destinoLon)) {
      
      const requisicao = {
        origin: { lat: this.origemLat, lng: this.origemLon },
        destination: { lat: this.destinoLat, lng: this.destinoLon },
        travelMode: google.maps.TravelMode.DRIVING,
        language: 'pt-BR',
        region: 'BR',
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: google.maps.TrafficModel.BEST_GUESS
        }
      };

      console.log('🗺️ Calculando rota via Google Maps Directions...', requisicao);

      this.directionsService.route(requisicao, (resultado: any, status: any) => {
        if (status === google.maps.DirectionsStatus.OK) {
          console.log('✅ Rota calculada com sucesso!', resultado);
          this.directionsRenderer.setDirections(resultado);
        } else {
          console.warn('⚠️ Erro ao calcular rota:', status);
          // Em caso de erro, desenha linha reta
          this.desenharLinhaReta();
        }
      });
    } else {
      // Limpa rota se não há origem/destino
      this.directionsRenderer.setDirections({ routes: [] });
    }
  }

  private desenharLinhaReta() {
    if (this.origemLat !== undefined && this.origemLon !== undefined && 
        this.destinoLat !== undefined && this.destinoLon !== undefined &&
        typeof this.origemLat === 'number' && typeof this.origemLon === 'number' &&
        typeof this.destinoLat === 'number' && typeof this.destinoLon === 'number' &&
        !isNaN(this.origemLat) && !isNaN(this.origemLon) && 
        !isNaN(this.destinoLat) && !isNaN(this.destinoLon)) {
      
      // Remove rota anterior
      this.directionsRenderer.setDirections({ routes: [] });
      
      // Desenha linha reta como fallback
      const linhaReta = new google.maps.Polyline({
        path: [
          { lat: this.origemLat, lng: this.origemLon },
          { lat: this.destinoLat, lng: this.destinoLon }
        ],
        geodesic: true,
        strokeColor: '#4285F4',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        icons: [{
          icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW },
          offset: '50%'
        }]
      });
      
      linhaReta.setMap(this.mapa);
    }
  }

  private configurarArrastoOrigem() {
    if (this.marcadorOrigem) {
      this.marcadorOrigem.setDraggable(this.permiteArrastarOrigem);
    }
  }

  // Métodos públicos para controle externo
  public atualizarPosicaoMotorista(lat: number, lon: number) {
    this.motoristaLat = lat;
    this.motoristaLon = lon;
    
    if (this.marcadorMotorista) {
      this.marcadorMotorista.setPosition({ lat, lng: lon });
    } else {
      this.atualizarMarcadores();
    }
  }

  private atualizarMarcadoresMotoristas() {
    if (!this.mapa || typeof google === 'undefined') return;

    // Remove marcadores antigos
    this.marcadoresMotoristas.forEach(marcador => marcador.setMap(null));
    this.marcadoresMotoristas = [];

    // Cria novos marcadores para motoristas ativos
    if (this.motoristasAtivos && this.motoristasAtivos.length > 0) {
      this.motoristasAtivos.forEach(motorista => {
        const marcador = new google.maps.Marker({
          position: { lat: motorista.lat, lng: motorista.lon },
          map: this.mapa,
          title: motorista.nome,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#4A90E2',
            fillOpacity: 0.9,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
          },
          animation: google.maps.Animation.DROP
        });

        // Info window com nome e distância
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <strong>${motorista.nome}</strong><br>
              ${motorista.distancia_km ? `${motorista.distancia_km.toFixed(1)} km de distância` : 'Disponível'}
            </div>
          `
        });

        marcador.addListener('click', () => {
          infoWindow.open(this.mapa, marcador);
        });

        this.marcadoresMotoristas.push(marcador);
      });
    }
  }

  public centralizarEm(lat: number, lon: number, zoom: number = 15) {
    if (this.mapa) {
      this.mapa.setCenter({ lat, lng: lon });
      this.mapa.setZoom(zoom);
    }
  }

  public obterCentroMapa(): {lat: number, lon: number} | null {
    if (this.mapa) {
      const centro = this.mapa.getCenter();
      return {
        lat: centro.lat(),
        lon: centro.lng()
      };
    }
    return null;
  }
}