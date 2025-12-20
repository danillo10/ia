import { Component, OnInit, OnDestroy, Input, AfterViewInit, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { environment } from '../../../environments/environment';

declare var google: any;

@Component({
  selector: 'app-mapa-google-selector',
  templateUrl: './mapa-google-selector.component.html',
  styleUrls: ['./mapa-google-selector.component.scss']
})
export class MapaGoogleSelectorComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() centralizarLat: number = -8.0476;
  @Input() centralizarLon: number = -34.877;
  @Input() precisaoGps: number = 0;
  @Input() corMarcador: string = 'success';
  
  @Output() mapaCentralizado = new EventEmitter<{lat: number, lon: number}>();

  private mapa?: any;
  private circuloPrecisao?: any;
  private scriptCarregado = false;
  private ultimaEmissao = { lat: 0, lon: 0 };

  ngOnInit() {}

  ngAfterViewInit() {
    this.carregarGoogleMaps();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.mapa) {
      if (changes['centralizarLat'] || changes['centralizarLon']) {
        this.centralizarMapa();
      }
      
      if (changes['precisaoGps']) {
        this.atualizarCirculoPrecisao();
      }
    }
  }

  ngOnDestroy() {
    if (this.circuloPrecisao) {
      this.circuloPrecisao.setMap(null);
    }
  }

  private async carregarGoogleMaps() {
    if (typeof google !== 'undefined' && google.maps) {
      this.scriptCarregado = true;
      this.inicializarMapa();
      return;
    }

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

    const opcoesMapa = {
      center: { lat: this.centralizarLat, lng: this.centralizarLon },
      zoom: 17, // Zoom alto para seleção precisa
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: true,
      rotateControl: false,
      fullscreenControl: false,
      gestureHandling: 'cooperative',
      // Estilos para melhor visualização
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels.text',
          stylers: [{ visibility: 'on' }]
        },
        {
          featureType: 'poi.business',
          elementType: 'labels',
          stylers: [{ visibility: 'on' }]
        }
      ]
    };

    this.mapa = new google.maps.Map(document.getElementById('mapa-google-selector'), opcoesMapa);

    // Evento quando mapa para de se mover
    this.mapa.addListener('idle', () => {
      this.onMapaParouDeMover();
    });

    // Evento de arrasto
    this.mapa.addListener('dragend', () => {
      this.onMapaParouDeMover();
    });

    // Emite posição inicial
    this.emitirCentroMapa();
    
    // Configura círculo de precisão inicial
    this.atualizarCirculoPrecisao();
  }

  private onMapaParouDeMover() {
    // Pequeno delay para garantir que o mapa parou completamente
    setTimeout(() => {
      this.emitirCentroMapa();
    }, 100);
  }

  private emitirCentroMapa() {
    if (!this.mapa) return;
    
    const centro = this.mapa.getCenter();
    const lat = centro.lat();
    const lon = centro.lng();
    
    // Evita emitir se a posição não mudou significativamente
    const distancia = this.calcularDistancia(
      this.ultimaEmissao.lat, this.ultimaEmissao.lon,
      lat, lon
    );
    
    if (distancia > 0.00001) { // ~1 metro
      this.ultimaEmissao = { lat, lon };
      this.mapaCentralizado.emit({ lat, lon });
    }
  }

  private calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    return Math.sqrt(dLat * dLat + dLon * dLon);
  }

  private centralizarMapa() {
    if (this.mapa) {
      const novocentro = { lat: this.centralizarLat, lng: this.centralizarLon };
      this.mapa.panTo(novocentro);
      
      // Ajusta zoom se necessário
      if (this.mapa.getZoom() < 16) {
        this.mapa.setZoom(17);
      }
    }
  }

  private atualizarCirculoPrecisao() {
    // Remove círculo anterior
    if (this.circuloPrecisao) {
      this.circuloPrecisao.setMap(null);
    }

    // Cria novo círculo se há precisão GPS
    if (this.precisaoGps > 0 && this.mapa) {
      this.circuloPrecisao = new google.maps.Circle({
        strokeColor: this.corMarcador === 'success' ? '#2dd36f' : '#eb445a',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: this.corMarcador === 'success' ? '#2dd36f' : '#eb445a',
        fillOpacity: 0.15,
        map: this.mapa,
        center: { lat: this.centralizarLat, lng: this.centralizarLon },
        radius: this.precisaoGps // raio em metros
      });
      
      // Faz círculo acompanhar o centro do mapa
      this.mapa.addListener('center_changed', () => {
        if (this.circuloPrecisao) {
          this.circuloPrecisao.setCenter(this.mapa.getCenter());
        }
      });
    }
  }

  // Métodos públicos para controle externo
  public centralizarEm(lat: number, lon: number, zoom: number = 17) {
    if (this.mapa) {
      this.mapa.setCenter({ lat, lng: lon });
      this.mapa.setZoom(zoom);
    }
  }

  public obterZoom(): number {
    return this.mapa ? this.mapa.getZoom() : 17;
  }

  public aumentarZoom() {
    if (this.mapa) {
      const zoomAtual = this.mapa.getZoom();
      this.mapa.setZoom(Math.min(zoomAtual + 1, 21));
    }
  }

  public diminuirZoom() {
    if (this.mapa) {
      const zoomAtual = this.mapa.getZoom();
      this.mapa.setZoom(Math.max(zoomAtual - 1, 10));
    }
  }
}