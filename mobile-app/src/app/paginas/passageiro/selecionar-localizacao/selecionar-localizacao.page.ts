import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LoadingController, ToastController, NavController } from '@ionic/angular';
import { LocalizacaoService, Coordenadas } from '../../../servicos/localizacao.service';
import { GeocodificacaoService, EnderecoSugestao } from '../../../servicos/geocodificacao.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-selecionar-localizacao',
  templateUrl: './selecionar-localizacao.page.html',
  styleUrls: ['./selecionar-localizacao.page.scss'],
})
export class SelecionarLocalizacaoPage implements OnInit, OnDestroy {
  // Coordenadas centrais do mapa
  centroPontaLat: number = -8.0476; // Recife como padrão
  centroPontaLon: number = -34.877;
  
  // Localização selecionada (sempre no centro)
  localizacaoSelecionada: Coordenadas | null = null;
  enderecoSelecionado = '';
  
  // Pontos de referência próximos
  pontosReferencia: EnderecoSugestao[] = [];
  
  // Estado da tela
  carregandoPontos = false;
  precisaoGps = 0; // Precisão em metros
  
  // Controles
  private buscaPontosSubject = new Subject<{lat: number, lon: number}>();
  
  // Parâmetros da rota
  tipo: 'origem' | 'destino' = 'origem';
  
  // Math para usar no template
  Math = Math;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private localizacaoService: LocalizacaoService,
    private geocodificacaoService: GeocodificacaoService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  async ngOnInit() {
    // Obtém parâmetros da rota
    this.tipo = this.route.snapshot.queryParams['tipo'] || 'origem';
    const lat = parseFloat(this.route.snapshot.queryParams['lat']);
    const lon = parseFloat(this.route.snapshot.queryParams['lon']);
    
    // Se veio com coordenadas, usa como centro
    if (!isNaN(lat) && !isNaN(lon)) {
      this.centroPontaLat = lat;
      this.centroPontaLon = lon;
      this.localizacaoSelecionada = { lat, lon };
    } else {
      // Tenta obter localização atual do usuário
      await this.obterLocalizacaoAtual();
    }
    
    // Configura busca de pontos com debounce
    this.buscaPontosSubject.pipe(
      debounceTime(800), // Aguarda 800ms após parar de mover
      distinctUntilChanged((prev, curr) => 
        Math.abs(prev.lat - curr.lat) < 0.0001 && Math.abs(prev.lon - curr.lon) < 0.0001
      ),
      switchMap(coords => this.buscarPontosReferencia(coords.lat, coords.lon))
    ).subscribe(pontos => {
      this.pontosReferencia = pontos;
      this.carregandoPontos = false;
    });
    
    // Busca pontos iniciais
    this.onMapaCentralizado({ lat: this.centroPontaLat, lon: this.centroPontaLon });
  }

  ngOnDestroy() {
    this.buscaPontosSubject.unsubscribe();
  }

  /**
   * Obtém localização atual do GPS
   */
  async obterLocalizacaoAtual() {
    let loading: HTMLIonLoadingElement | null = null;
    
    try {
      loading = await this.loadingCtrl.create({
        message: 'Obtendo sua localização...',
        duration: 10000
      });
      await loading.present();
      
      const permissao = await this.localizacaoService.solicitarPermissoes();
      if (permissao) {
        const coords = await this.localizacaoService.obterPosicaoUnica();
        this.centroPontaLat = coords.lat;
        this.centroPontaLon = coords.lon;
        this.localizacaoSelecionada = coords;
        this.precisaoGps = (coords as any).precision || 0;
        
        const toast = await this.toastCtrl.create({
          message: 'Localização obtida com sucesso!',
          duration: 2000,
          color: 'success',
          position: 'top'
        });
        await toast.present();
      }
    } catch (erro: any) {
      console.error('Erro ao obter localização:', erro);
      try {
        const toast = await this.toastCtrl.create({
          message: 'Não foi possível obter sua localização. Use o mapa para selecionar.',
          duration: 4000,
          color: 'warning',
          position: 'top'
        });
        await toast.present();
      } catch (toastError) {
        console.error('Erro ao exibir toast:', toastError);
      }
    } finally {
      if (loading) {
        try {
          await loading.dismiss();
        } catch (dismissError) {
          console.error('Erro ao fechar loading:', dismissError);
        }
      }
    }
  }

  /**
   * Callback quando o mapa é centralizado em uma nova posição
   */
  onMapaCentralizado(coordenadas: { lat: number, lon: number }) {
    // Validação de coordenadas
    if (!coordenadas || typeof coordenadas.lat !== 'number' || typeof coordenadas.lon !== 'number') {
      console.error('Coordenadas inválidas recebidas:', coordenadas);
      return;
    }

    this.centroPontaLat = coordenadas.lat;
    this.centroPontaLon = coordenadas.lon;
    this.localizacaoSelecionada = coordenadas;
    
    // Marca como carregando e busca pontos próximos
    this.carregandoPontos = true;
    this.buscaPontosSubject.next(coordenadas);
    
    // Busca endereço do centro
    this.buscarEnderecoDocentro();
  }

  /**
   * Busca endereço das coordenadas centrais
   */
  private async buscarEnderecoDocentro() {
    if (!this.localizacaoSelecionada) return;
    
    try {
      const endereco = await this.geocodificacaoService.buscarEnderecoPorCoordenadas(
        this.localizacaoSelecionada.lat,
        this.localizacaoSelecionada.lon
      ).toPromise();
      
      this.enderecoSelecionado = endereco || `${this.localizacaoSelecionada.lat.toFixed(6)}, ${this.localizacaoSelecionada.lon.toFixed(6)}`;
    } catch (erro) {
      console.error('Erro ao buscar endereço:', erro);
      this.enderecoSelecionado = `${this.localizacaoSelecionada.lat.toFixed(6)}, ${this.localizacaoSelecionada.lon.toFixed(6)}`;
    }
  }

  /**
   * Busca pontos de referência próximos
   */
  private async buscarPontosReferencia(lat: number, lon: number): Promise<EnderecoSugestao[]> {
    try {
      // Busca estabelecimentos próximos usando texto genérico
      // Define localização para busca por proximidade
      this.geocodificacaoService.definirLocalizacaoUsuario(lat, lon);
      const estabelecimentos = await this.geocodificacaoService.buscarEnderecos(
        'estabelecimentos comerciais farmacia supermercado banco'
      ).toPromise() || [];
      
      // Filtra apenas os que estão realmente próximos (raio ~500m)
      const pontosProximos = estabelecimentos.filter(ponto => {
        const distancia = this.calcularDistancia(lat, lon, ponto.lat, ponto.lon);
        return distancia <= 0.5; // 500 metros
      });
      
      // Limita a 8 pontos e ordena por relevância
      return pontosProximos
        .slice(0, 8)
        .sort((a, b) => {
          const distA = this.calcularDistancia(lat, lon, a.lat, a.lon);
          const distB = this.calcularDistancia(lat, lon, b.lat, b.lon);
          return distA - distB;
        });
    } catch (erro) {
      console.error('Erro ao buscar pontos de referência:', erro);
      return [];
    }
  }

  /**
   * Calcula distância entre duas coordenadas em km
   */
  calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Seleciona um ponto de referência próximo
   */
  selecionarPontoReferencia(ponto: EnderecoSugestao) {
    this.centroPontaLat = ponto.lat;
    this.centroPontaLon = ponto.lon;
    this.localizacaoSelecionada = { lat: ponto.lat, lon: ponto.lon };
    this.enderecoSelecionado = ponto.nome;
  }

  /**
   * Confirma a localização selecionada
   */
  confirmarLocalizacao() {
    if (!this.localizacaoSelecionada) {
      return;
    }

    // Retorna para a página anterior com os dados
    this.router.navigate(['/passageiro/mapa'], {
      queryParams: {
        [`${this.tipo}Lat`]: this.localizacaoSelecionada.lat,
        [`${this.tipo}Lon`]: this.localizacaoSelecionada.lon,
        [`${this.tipo}Endereco`]: this.enderecoSelecionado,
        tipo: this.tipo
      }
    });
  }

  /**
   * Volta sem selecionar
   */
  voltar() {
    this.navCtrl.back();
  }

  /**
   * Obtém texto do título baseado no tipo
   */
  obterTitulo(): string {
    return this.tipo === 'origem' ? 'Selecione sua localização' : 'Selecione o destino';
  }

  /**
   * Obtém cor do marcador baseado no tipo
   */
  obterCorMarcador(): string {
    return this.tipo === 'origem' ? 'success' : 'danger';
  }
}