import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LoadingController, ToastController, AlertController } from '@ionic/angular';
import { LocalizacaoService, Coordenadas } from '../../../servicos/localizacao.service';
import { CorridaService } from '../../../servicos/corrida.service';
import { GeocodificacaoService, EnderecoSugestao } from '../../../servicos/geocodificacao.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.page.html',
  styleUrls: ['./mapa.page.scss'],
})
export class MapaPage implements OnInit, AfterViewInit {
  @ViewChild('mapaGoogle', { static: false }) mapaGoogle: any;
  
  origem: Coordenadas | null = null;
  destino: Coordenadas | null = null;
  estimativa: any = null;
  exibirEstimativa = false;
  
  // Busca de endereços
  buscaOrigemTexto = '';
  buscaDestinoTexto = '';
  sugestoesOrigem: EnderecoSugestao[] = [];
  sugestoesDestino: EnderecoSugestao[] = [];
  
  // Controla qual campo está ativo para mostrar sugestões
  mostrarSugestoesOrigem = false;
  mostrarSugestoesDestino = false;
  
  // Modo de seleção no mapa
  modoSelecionarOrigem = false;
  
  // Posição do motorista (para exibir no mapa se disponível)
  motoristaLat?: number;
  motoristaLon?: number;
  
  private buscaOrigemSubject = new Subject<string>();
  private buscaDestinoSubject = new Subject<string>();

  constructor(
    private localizacaoService: LocalizacaoService,
    private corridaService: CorridaService,
    private geocodificacaoService: GeocodificacaoService,
    private router: Router,
    private route: ActivatedRoute,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    // Processa parâmetros de retorno da seleção de localização
    this.processarRetornoSelecao();
    
    // Tenta obter localização do usuário para busca por proximidade
    this.obterLocalizacaoParaProximidade();
    
    // Configura debounce para busca de endereços (aguarda 500ms após parar de digitar)
    this.buscaOrigemSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(texto => this.geocodificacaoService.buscarEnderecos(texto))
    ).subscribe(sugestoes => {
      this.sugestoesOrigem = sugestoes;
      this.mostrarSugestoesOrigem = sugestoes.length > 0;
    });
    
    this.buscaDestinoSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(texto => this.geocodificacaoService.buscarEnderecos(texto))
    ).subscribe(sugestoes => {
      this.sugestoesDestino = sugestoes;
      this.mostrarSugestoesDestino = sugestoes.length > 0;
    });
  }

  ngAfterViewInit() {
    // Aguarda o mapa carregar para aplicar zoom se necessário
    setTimeout(() => {
      this.aplicarZoomSeNecessario();
      
      // Se não há origem definida, obtém localização atual automaticamente
      if (!this.origem && !this.buscaOrigemTexto) {
        this.obterLocalizacaoAtualAutomatico();
      }
    }, 1000);
  }

  /**
   * Obtém localização do usuário em background para melhorar busca por proximidade
   */
  private async obterLocalizacaoParaProximidade() {
    try {
      const permissao = await this.localizacaoService.solicitarPermissoes();
      if (permissao) {
        const coords = await this.localizacaoService.obterPosicaoUnica();
        // Define localização no serviço de geocodificação
        this.geocodificacaoService.definirLocalizacaoUsuario(coords.lat, coords.lon);
        console.log('Busca por proximidade ativada:', coords);
      }
    } catch (erro) {
      console.log('Localização não disponível, busca será sem proximidade');
    }
  }

  onBuscaOrigemChange(event: any) {
    const texto = event.detail.value || '';
    this.buscaOrigemTexto = texto;
    
    if (texto.trim().length >= 3) {
      this.buscaOrigemSubject.next(texto);
    } else {
      this.sugestoesOrigem = [];
      this.mostrarSugestoesOrigem = false;
    }
  }
  
  onBuscaDestinoChange(event: any) {
    const texto = event.detail.value || '';
    this.buscaDestinoTexto = texto;
    
    if (texto.trim().length >= 3) {
      this.buscaDestinoSubject.next(texto);
    } else {
      this.sugestoesDestino = [];
      this.mostrarSugestoesDestino = false;
    }
  }
  
  selecionarOrigem(sugestao: EnderecoSugestao) {
    this.origem = { lat: sugestao.lat, lon: sugestao.lon };
    this.buscaOrigemTexto = sugestao.nome;
    this.sugestoesOrigem = [];
    this.mostrarSugestoesOrigem = false;
    this.exibirEstimativa = false;
    
    // Calcula automaticamente se destino já estiver definido
    if (this.destino) {
      this.calcularEstimativa();
    }
  }
  
  selecionarDestino(sugestao: EnderecoSugestao) {
    this.destino = { lat: sugestao.lat, lon: sugestao.lon };
    this.buscaDestinoTexto = sugestao.nome;
    this.sugestoesDestino = [];
    this.mostrarSugestoesDestino = false;
    this.exibirEstimativa = false;
    
    // Calcula automaticamente se origem já estiver definida
    if (this.origem) {
      this.calcularEstimativa();
    }
  }
  
  obterIconeSugestao(tipo: string): string {
    return this.geocodificacaoService.obterIconePorTipo(tipo);
  }

  /**
   * Callback quando origem é arrastada no mapa
   */
  async onOrigemArrastada(novaPosicao: {lat: number, lon: number}) {
    const loading = await this.loadingCtrl.create({ message: 'Buscando endereço...' });
    await loading.present();

    try {
      // Atualiza coordenadas
      this.origem = { lat: novaPosicao.lat, lon: novaPosicao.lon };
      
      // Busca o endereço das novas coordenadas
      const endereco = await this.geocodificacaoService.buscarEnderecoPorCoordenadas(
        novaPosicao.lat, 
        novaPosicao.lon
      ).toPromise() || null;
      
      if (endereco) {
        this.buscaOrigemTexto = endereco;
      } else {
        // Se não conseguir o endereço, tenta novamente
        this.buscaOrigemTexto = 'Buscando endereço...';
        setTimeout(async () => {
          const enderecoRetry = await this.geocodificacaoService.buscarEnderecoPorCoordenadas(
            novaPosicao.lat,
            novaPosicao.lon
          ).toPromise() || null;
          this.buscaOrigemTexto = enderecoRetry || 'Endereço não disponível';
        }, 1000);
      }

      // Reset estimativa e recalcula automaticamente
      this.exibirEstimativa = false;
      
      // Calcula automaticamente se destino já estiver definido
      if (this.destino) {
        this.calcularEstimativa();
      }

      const toast = await this.toastCtrl.create({
        message: 'Localização da origem atualizada!',
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();
    } catch (erro) {
      console.error('Erro ao buscar endereço:', erro);
      const toast = await this.toastCtrl.create({
        message: 'Erro ao buscar endereço. Coordenadas salvas.',
        duration: 3000,
        color: 'warning'
      });
      await toast.present();
    } finally {
      await loading.dismiss();
    }
  }

  /**
   * Callback quando mapa é clicado
   * Se modo de seleção estiver ativo, marca a origem
   */
  async onMapaClicado(coordenadas: {lat: number, lon: number}) {
    console.log('Mapa clicado:', coordenadas);
    
    if (this.modoSelecionarOrigem) {
      // Define a origem com as coordenadas clicadas
      this.origem = { lat: coordenadas.lat, lon: coordenadas.lon };
      
      // Busca o endereço das coordenadas
      const loading = await this.loadingCtrl.create({
        message: 'Buscando endereço...'
      });
      await loading.present();
      
      try {
        const endereco = await this.geocodificacaoService.buscarEnderecoPorCoordenadas(
          coordenadas.lat,
          coordenadas.lon
        ).toPromise() || null;
        
        if (endereco) {
          this.buscaOrigemTexto = endereco;
        } else {
          // Se não conseguir o endereço, tenta novamente
          this.buscaOrigemTexto = 'Buscando endereço...';
          setTimeout(async () => {
            const enderecoRetry = await this.geocodificacaoService.buscarEnderecoPorCoordenadas(
              coordenadas.lat,
              coordenadas.lon
            ).toPromise() || null;
            this.buscaOrigemTexto = enderecoRetry || 'Endereço não disponível';
          }, 1000);
        }
        
        const toast = await this.toastCtrl.create({
          message: 'Origem marcada no mapa!',
          duration: 2000,
          color: 'success',
          position: 'bottom'
        });
        await toast.present();
      } catch (erro) {
        console.error('Erro ao buscar endereço:', erro);
        this.buscaOrigemTexto = 'Buscando endereço...';
        // Tenta novamente após erro
        setTimeout(async () => {
          try {
            const enderecoRetry = await this.geocodificacaoService.buscarEnderecoPorCoordenadas(
              coordenadas.lat,
              coordenadas.lon
            ).toPromise() || null;
            this.buscaOrigemTexto = enderecoRetry || 'Endereço não disponível';
          } catch {
            this.buscaOrigemTexto = 'Endereço não disponível';
          }
        }, 1000);
      } finally {
        await loading.dismiss();
        this.modoSelecionarOrigem = false;
      }
    }
  }

  /**
   * Obtém localização atual do GPS e marca no mapa
   */
  async ativarModoSelecionarOrigem() {
    const loading = await this.loadingCtrl.create({
      message: 'Obtendo sua localização...'
    });
    await loading.present();

    try {
      const posicao = await this.localizacaoService.obterPosicaoUnica();
      
      if (posicao) {
        // Marca a origem com a localização atual
        this.origem = { lat: posicao.lat, lon: posicao.lon };
        
        // Centraliza e dá zoom no mapa
        if (this.mapaGoogle) {
          this.mapaGoogle.centralizarEm(posicao.lat, posicao.lon, 16);
        }
        
        // Busca o endereço das coordenadas
        try {
          const endereco = await this.geocodificacaoService.buscarEnderecoPorCoordenadas(
            posicao.lat,
            posicao.lon
          ).toPromise() || null;
          
          if (endereco) {
            this.buscaOrigemTexto = endereco;
          } else {
            // Se não conseguir o endereço, tenta novamente após 1 segundo
            this.buscaOrigemTexto = 'Buscando endereço...';
            setTimeout(async () => {
              const enderecoRetry = await this.geocodificacaoService.buscarEnderecoPorCoordenadas(
                posicao.lat,
                posicao.lon
              ).toPromise() || null;
              this.buscaOrigemTexto = enderecoRetry || 'Endereço não disponível';
            }, 1000);
          }
        } catch (erro) {
          console.error('Erro ao buscar endereço:', erro);
          this.buscaOrigemTexto = 'Buscando endereço...';
          // Tenta novamente após erro
          setTimeout(async () => {
            try {
              const enderecoRetry = await this.geocodificacaoService.buscarEnderecoPorCoordenadas(
                posicao.lat,
                posicao.lon
              ).toPromise() || null;
              this.buscaOrigemTexto = enderecoRetry || 'Endereço não disponível';
            } catch {
              this.buscaOrigemTexto = 'Endereço não disponível';
            }
          }, 1000);
        }
        
        const toast = await this.toastCtrl.create({
          message: 'Localização atual marcada!',
          duration: 2000,
          color: 'success',
          position: 'bottom'
        });
        await toast.present();
      } else {
        const toast = await this.toastCtrl.create({
          message: 'Não foi possível obter sua localização',
          duration: 3000,
          color: 'danger',
          position: 'bottom'
        });
        await toast.present();
      }
    } catch (erro) {
      console.error('Erro ao obter localização:', erro);
      const toast = await this.toastCtrl.create({
        message: 'Erro ao acessar GPS. Verifique as permissões.',
        duration: 3000,
        color: 'danger',
        position: 'bottom'
      });
      await toast.present();
    } finally {
      await loading.dismiss();
    }
  }

  /**
   * Cancela o modo de seleção de origem
   */
  cancelarSelecaoOrigem() {
    this.modoSelecionarOrigem = false;
  }

  /**
   * Obtém localização atual automaticamente ao carregar a página (sem loading)
   */
  async obterLocalizacaoAtualAutomatico() {
    try {
      const posicao = await this.localizacaoService.obterPosicaoUnica();
      
      if (posicao) {
        // Marca a origem com a localização atual
        this.origem = { lat: posicao.lat, lon: posicao.lon };
        
        // Log da precisão
        if (posicao.precision) {
          console.log(`📍 Localização obtida com precisão de ${posicao.precision.toFixed(1)}m`);
        }
        
        // Centraliza e dá zoom no mapa
        if (this.mapaGoogle) {
          this.mapaGoogle.centralizarEm(posicao.lat, posicao.lon, 16);
        }
        
        // Busca o endereço das coordenadas
        try {
          const endereco = await this.geocodificacaoService.buscarEnderecoPorCoordenadas(
            posicao.lat,
            posicao.lon
          ).toPromise() || null;
          
          if (endereco) {
            this.buscaOrigemTexto = endereco;
          } else {
            // Se não conseguir o endereço, tenta novamente após 1 segundo
            this.buscaOrigemTexto = 'Buscando endereço...';
            setTimeout(async () => {
              const enderecoRetry = await this.geocodificacaoService.buscarEnderecoPorCoordenadas(
                posicao.lat,
                posicao.lon
              ).toPromise() || null;
              this.buscaOrigemTexto = enderecoRetry || 'Endereço não disponível';
            }, 1000);
          }
        } catch (erro) {
          console.error('Erro ao buscar endereço:', erro);
          this.buscaOrigemTexto = 'Buscando endereço...';
          // Tenta novamente após erro
          setTimeout(async () => {
            try {
              const enderecoRetry = await this.geocodificacaoService.buscarEnderecoPorCoordenadas(
                posicao.lat,
                posicao.lon
              ).toPromise() || null;
              this.buscaOrigemTexto = enderecoRetry || 'Endereço não disponível';
            } catch {
              this.buscaOrigemTexto = 'Endereço não disponível';
            }
          }, 1000);
        }
      }
    } catch (erro) {
      console.log('Não foi possível obter localização automática:', erro);
      // Não mostra erro para não incomodar o usuário
    }
  }



  /**
   * Navega para tela de seleção de localização da origem
   */
  async selecionarLocalizacaoOrigem() {
    this.router.navigate(['/passageiro/selecionar-localizacao'], {
      queryParams: {
        tipo: 'origem',
        lat: this.origem?.lat,
        lon: this.origem?.lon
      }
    });
  }

  /**
   * Navega para tela de seleção de localização do destino
   */
  async selecionarLocalizacaoDestino() {
    this.router.navigate(['/passageiro/selecionar-localizacao'], {
      queryParams: {
        tipo: 'destino',
        lat: this.destino?.lat,
        lon: this.destino?.lon
      }
    });
  }

  /**
   * Processa retorno da tela de seleção de localização
   */
  private processarRetornoSelecao() {
    const params = this.route.snapshot.queryParams;
    
    // Verifica se voltou da tela de seleção
    if (params['tipo']) {
      const tipo = params['tipo'];
      const lat = parseFloat(params[`${tipo}Lat`]);
      const lon = parseFloat(params[`${tipo}Lon`]);
      const endereco = params[`${tipo}Endereco`];
      
      if (!isNaN(lat) && !isNaN(lon)) {
        if (tipo === 'origem') {
          this.origem = { lat, lon };
          this.buscaOrigemTexto = endereco || `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
        } else if (tipo === 'destino') {
          this.destino = { lat, lon };
          this.buscaDestinoTexto = endereco || `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
        }
        
        // Reset estimativa
        this.exibirEstimativa = false;
        
        // Limpa parâmetros da URL
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
        
        // Aplica zoom automático na localização selecionada
        setTimeout(() => {
          this.aplicarZoomSeNecessario();
        }, 500);
      }
    }
  }

  async calcularEstimativa() {
    if (!this.origem || !this.destino) {
      const toast = await this.toastCtrl.create({
        message: 'Defina origem e destino',
        duration: 3000,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Calculando...' });
    await loading.present();

    try {
      this.estimativa = await this.corridaService.estimar(this.origem, this.destino).toPromise();
      this.exibirEstimativa = true;
    } catch (erro) {
      const toast = await this.toastCtrl.create({
        message: 'Erro ao calcular estimativa',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      await loading.dismiss();
    }
  }

  async solicitarCorrida() {
    if (!this.origem || !this.destino) return;

    const loading = await this.loadingCtrl.create({ message: 'Solicitando corrida...' });
    await loading.present();

    try {
      // Inclui os endereços nos objetos origem e destino
      const origemCompleta = {
        ...this.origem,
        endereco: this.buscaOrigemTexto
      };
      
      const destinoCompleto = {
        ...this.destino,
        endereco: this.buscaDestinoTexto
      };
      
      const corrida = await this.corridaService.criar(origemCompleta, destinoCompleto).toPromise();
      await loading.dismiss();
      
      const toast = await this.toastCtrl.create({
        message: 'Corrida solicitada! Procurando motorista...',
        duration: 3000,
        color: 'success'
      });
      await toast.present();

      if (corrida && corrida.id) {
        this.router.navigate(['/passageiro/acompanhar', corrida.id]);
      }
    } catch (erro: any) {
      await loading.dismiss();
      const toast = await this.toastCtrl.create({
        message: erro?.error?.detail || 'Erro ao solicitar corrida',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  /**
   * Aplica zoom automático na localização selecionada
   */
  private aplicarZoomSeNecessario() {
    if (this.mapaGoogle && this.origem && 
        typeof this.origem.lat === 'number' && typeof this.origem.lon === 'number' &&
        !isNaN(this.origem.lat) && !isNaN(this.origem.lon)) {
      // Centraliza e faz zoom na origem selecionada
      console.log('Aplicando zoom automático:', this.origem);
      this.mapaGoogle.centralizarEm(this.origem.lat, this.origem.lon, 16);
    }
  }
}
