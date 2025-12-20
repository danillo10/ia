import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { ApiService, MotoristaOnline } from '../../servicos/api.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false
})
export class DashboardPage implements OnInit, AfterViewInit, OnDestroy {
  motoristas: MotoristaOnline[] = [];
  carregando = true;
  erro: string | null = null;
  
  // Estatísticas
  totalMotoristas = 0;
  totalOnline = 0;
  totalCorridas = 0;
  
  // Mapa Leaflet
  mapa: any;
  marcadores: any[] = [];
  
  private atualizacaoSubscription?: Subscription;

  constructor(private apiService: ApiService) {}

  async ngOnInit() {
    await this.carregarMotoristas();

    // Atualiza a cada 5 segundos
    this.atualizacaoSubscription = interval(5000).subscribe(() => {
      this.carregarMotoristas();
    });
  }

  async ngAfterViewInit() {
    console.log('🗺️ ngAfterViewInit - iniciando mapa...');
    
    // Aguarda um ciclo para o DOM estar pronto
    setTimeout(async () => {
      await this.inicializarMapa();
      
      // Garante que o Leaflet calcule o tamanho correto do container
      setTimeout(() => {
        if (this.mapa) {
          console.log('✅ Mapa inicializado, chamando invalidateSize');
          this.mapa.invalidateSize?.();
        }
      }, 250);
    }, 100);
  }

  ngOnDestroy() {
    if (this.atualizacaoSubscription) {
      this.atualizacaoSubscription.unsubscribe();
    }
    if (this.mapa) {
      this.mapa.remove();
    }
  }

  async inicializarMapa() {
    try {
      const elemento = document.getElementById('mapa');
      console.log('🔍 Elemento #mapa:', elemento);
      
      if (!elemento) {
        console.warn('⚠️ Elemento #mapa não encontrado ainda.');
        return;
      }

      console.log('📏 Dimensões do elemento:', {
        width: elemento.offsetWidth,
        height: elemento.offsetHeight,
        clientWidth: elemento.clientWidth,
        clientHeight: elemento.clientHeight
      });

      if (this.mapa) {
        console.log('♻️ Mapa já existe, apenas invalidando tamanho');
        this.mapa.invalidateSize?.();
        return;
      }

      // Importa Leaflet dinamicamente
      console.log('📦 Importando Leaflet...');
      const L = await import('leaflet');
      console.log('✅ Leaflet importado');

      // Centro do mapa em Recife, PE
      console.log('🗺️ Criando mapa em Recife...');
      this.mapa = L.map(elemento).setView([-8.05, -34.9], 12);
      console.log('✅ Mapa criado');

      // Tiles do OpenStreetMap
      console.log('🌍 Adicionando tiles OSM...');
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.mapa);
      console.log('✅ Tiles adicionados');

      // Garante render após criação
      setTimeout(() => {
        this.mapa?.invalidateSize?.();
        console.log('✅ invalidateSize chamado');
      }, 0);
    } catch (error: any) {
      console.error('❌ Erro ao inicializar mapa:', error);
      this.erro = 'Erro ao inicializar o mapa: ' + error.message;
    }
  }

  async carregarMotoristas() {
    try {
      const lista = await this.apiService.listarMotoristasOnline().toPromise() || [];
      const online = (lista || []).filter(m => m.online);

      this.motoristas = online;
      this.totalOnline = online.length;
      this.totalMotoristas = online.length;
      
      this.atualizarMarcadores();
      this.carregando = false;
      this.erro = null;
    } catch (error: any) {
      console.error('Erro ao carregar motoristas:', error);
      this.erro = 'Erro ao carregar dados dos motoristas';
      this.carregando = false;
    }
  }

  async atualizarMarcadores() {
    if (!this.mapa) return;
    
    const L = await import('leaflet');
    
    // Remove marcadores antigos
    this.marcadores.forEach(m => m.remove());
    this.marcadores = [];
    
    // Adiciona novos marcadores
    this.motoristas
      .filter(m => m.online && m.lat && m.lon)
      .forEach(motorista => {
        // Ícone personalizado usando emoji ou SVG inline
        const iconeHtml = `
          <div style="
            background-color: #10dc60;
            border: 3px solid white;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ">🏍️</div>
        `;
        
        const icone = L.divIcon({
          html: iconeHtml,
          className: 'custom-moto-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16]
        });
        
        const marcador = L.marker([motorista.lat, motorista.lon], { icon: icone })
          .bindPopup(`
            <div style="min-width: 200px;">
              <strong style="font-size: 16px; color: #333;">${motorista.nome}</strong><br>
              <div style="margin-top: 8px; color: #666;">
                ${motorista.placa ? `<div>📋 Placa: <strong>${motorista.placa}</strong></div>` : ''}
                <div>📞 ${motorista.telefone}</div>
                <div style="margin-top: 8px;">
                  <span style="color: #10dc60; font-weight: bold;">● Online</span>
                </div>
              </div>
            </div>
          `)
          .addTo(this.mapa);
        
        this.marcadores.push(marcador);
      });

    // Recalcula o tamanho (importante quando o container muda)
    setTimeout(() => {
      if (this.mapa) {
        this.mapa.invalidateSize?.();
      }
    }, 0);
  }

  centralizarMotorista(motorista: MotoristaOnline) {
    if (this.mapa && motorista.lat && motorista.lon) {
      // Zoom alto (17) para visualizar bem a localização
      this.mapa.setView([motorista.lat, motorista.lon], 17, {
        animate: true,
        duration: 0.5
      });
      
      // Abre o popup do marcador
      const marcador = this.marcadores.find((m: any) => {
        const pos = m.getLatLng();
        return pos.lat === motorista.lat && pos.lng === motorista.lon;
      });
      
      if (marcador) {
        // Pequeno delay para abrir popup após animação do zoom
        setTimeout(() => {
          marcador.openPopup();
        }, 300);
      }
    }
  }

  obterTempoDesdeUltimaAtualizacao(dataStr: string): string {
    const agora = new Date();
    const data = new Date(dataStr);
    const diffMs = agora.getTime() - data.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    
    if (diffMin < 1) return 'Agora mesmo';
    if (diffMin === 1) return 'Há 1 minuto';
    if (diffMin < 60) return `Há ${diffMin} minutos`;
    
    const diffHoras = Math.floor(diffMin / 60);
    if (diffHoras === 1) return 'Há 1 hora';
    return `Há ${diffHoras} horas`;
  }
}
