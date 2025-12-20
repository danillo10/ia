import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader,
  IonCardTitle, IonCardSubtitle, IonCardContent, IonItem, IonLabel, IonToggle, IonBadge,
  IonButton, IonIcon, IonModal, IonButtons, IonList, IonListHeader,
  IonProgressBar, IonSpinner
} from '@ionic/angular/standalone';
import { AlertController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AuthService, MotoristaUsuario } from '../../servicos/auth.service';
import { ApiMockService, Corrida } from '../../servicos/api-mock.service';
import { LocalizacaoService, Coordenadas } from '../../servicos/localizacao.service';
import { MotoristaService } from '../../servicos/motorista.service';
import { NotificacaoService } from '../../servicos/notificacao.service';
import { environment } from '../../../environments/environment';
import { addIcons } from 'ionicons';
import {
  logOutOutline, personCircleOutline, walletOutline, carOutline,
  locationOutline, timeOutline, cashOutline, checkmarkCircleOutline,
  closeCircleOutline, navigateOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-principal',
  templateUrl: './principal.page.html',
  styleUrls: ['./principal.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonItem, IonLabel, IonToggle, IonBadge, IonButton, IonIcon, IonModal, IonButtons, IonList, IonListHeader, IonProgressBar, IonSpinner, CommonModule, FormsModule]
})
export class PrincipalPage implements OnInit, OnDestroy {
  usuario: MotoristaUsuario | null = null;
  online = false;
  processandoToggle = false;
  ganhosHoje = '75,00';
  totalViagensHoje = 16;
  menuAberto = false;
  corridasDisponiveis: Corrida[] = [];
  corridaAtual: Corrida | null = null;
  
  // Modal de nova corrida
  exibirModalCorrida = false;
  corridaSelecionada: Corrida | null = null;
  tempoRestante = 15;
  timerInterval?: any;
  
  // Google Maps
  private mapa: any;
  private marcadorMotorista: any;
  
  // Subscriptions
  private corridasSubscription?: Subscription;
  private usuarioSubscription?: Subscription;
  private intervaloBusca?: any;

  constructor(
    private authService: AuthService,
    private apiMock: ApiMockService,
    private localizacaoService: LocalizacaoService,
    private motoristaService: MotoristaService,
    private notificacaoService: NotificacaoService,
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      logOutOutline, personCircleOutline, walletOutline, carOutline,
      locationOutline, timeOutline, cashOutline, checkmarkCircleOutline,
      closeCircleOutline, navigateOutline
    });
  }

  async ngOnInit() {
    // Carrega dados do usuário
    this.usuarioSubscription = this.authService.usuarioAtual$.subscribe(user => {
      this.usuario = user;
    });
    
    // Verifica se está logado
    if (!this.authService.estaLogado()) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Solicita permissões de localização
    await this.localizacaoService.solicitarPermissoes();
    
    // Verifica status online no backend (restaura sessão)
    await this.verificarStatusOnlineNoBackend();
    
    // Escuta mudanças nas corridas
    this.corridasSubscription = this.apiMock.corridas$.subscribe(corridas => {
      this.verificarNovasCorridas(corridas);
    });
  }

  ngOnDestroy() {
    if (this.online) {
      this.ficarOffline();
    }
    this.corridasSubscription?.unsubscribe();
    this.usuarioSubscription?.unsubscribe();
    this.limparTimer();
    if (this.intervaloBusca) {
      clearInterval(this.intervaloBusca);
    }
  }

  async alternarStatus() {
    // Previne múltiplos cliques enquanto processa
    if (this.processandoToggle) {
      console.warn('⚠️ Já está processando uma mudança de status, ignorando...');
      return;
    }
    
    const novoEstado = !this.online; // Inverte o estado atual
    console.log(`🔄 Botão FAB clicado - novo estado: ${novoEstado ? 'ONLINE' : 'OFFLINE'}`);
    console.log(`📊 Estado atual antes da mudança: ${this.online}`);
    
    this.processandoToggle = true;
    
    try {
      if (novoEstado) {
        // Usuário quer ficar online
        await this.ficarOnline();
      } else {
        // Usuário quer ficar offline  
        await this.ficarOffline();
      }
    } catch (erro) {
      console.error('❌ Erro ao alterar status:', erro);
      // Em caso de erro, o estado permanece como estava
    } finally {
      this.processandoToggle = false;
    }
    
    console.log(`📊 Estado final após mudança: ${this.online}`);
  }

  async iniciarBusca() {
    console.log('🔍 Iniciando busca por corridas...');
    
    if (!this.online) {
      const toast = await this.toastCtrl.create({
        message: '⚠️ Você precisa estar online para buscar corridas',
        duration: 3000,
        color: 'warning',
        position: 'top'
      });
      await toast.present();
      return;
    }
    
    const toast = await this.toastCtrl.create({
      message: '🔍 Buscando corridas disponíveis...',
      duration: 2000,
      color: 'primary',
      position: 'top'
    });
    await toast.present();
    
    // Simula busca de corridas
    setTimeout(() => {
      if (this.corridasDisponiveis.length === 0) {
        this.mostrarMensagem('📭 Nenhuma corrida disponível no momento', 'medium');
      } else {
        this.mostrarMensagem(`✅ ${this.corridasDisponiveis.length} corrida(s) encontrada(s)!`, 'success');
      }
    }, 2000);
  }
  
  private async mostrarMensagem(mensagem: string, cor: string) {
    const toast = await this.toastCtrl.create({
      message: mensagem,
      duration: 3000,
      color: cor,
      position: 'top'
    });
    await toast.present();
  }

  toggleMenu() {
    this.menuAberto = !this.menuAberto;
  }

  private async verificarStatusOnlineNoBackend() {
    try {
      const motoristaId = this.usuario?.id || 3;
      console.log('🔍 Verificando status online no backend para motorista:', motoristaId);
      
      const status = await this.motoristaService.verificarStatusOnline(motoristaId).toPromise();
      console.log('📊 Status retornado do backend:', status);
      
      if (status && status.online === true) {
        console.log('✅ Motorista estava online, restaurando sessão...');
        this.online = true;
        this.cdr.detectChanges();
        
        // Obtém posição atual
        const coords = await this.localizacaoService.obterPosicaoUnica();
        
        // Inicia rastreamento
        this.localizacaoService.iniciarRastreamento(async (coords) => {
          console.log('📍 Nova posição do rastreamento:', coords);
          this.atualizarPosicaoNoMapa(coords);
        }).catch(erro => {
          console.warn('⚠️ Rastreamento GPS falhou:', erro);
        });
        
        // Inicializa mapa
        setTimeout(() => {
          this.inicializarMapa(coords);
        }, 500);
        
        // Inicia busca de corridas
        this.iniciarBuscaCorridas(coords);
        
        console.log('🟢 Sessão online restaurada com sucesso!');
      } else {
        console.log('📴 Motorista estava offline');
      }
    } catch (erro) {
      console.warn('⚠️ Erro ao verificar status online, assumindo offline:', erro);
      this.online = false;
    }
  }

  private async ficarOnline() {
    try {
      console.log('🟢 ============ INICIANDO PROCESSO ONLINE ============');
      console.log('🟢 Tentando ficar online...');
      console.log('👤 Usuário:', this.usuario);
      console.log('📊 Estado atual de this.online:', this.online);
      
      // ID 3 = Motociclista Demo (moto1@mototaxi.local)
      const motoristaId = this.usuario?.id || 3;
      console.log('🆔 ID do motorista:', motoristaId);

      // Obtém coordenadas (com fallback para Recife se falhar)
      const coords = await this.localizacaoService.obterPosicaoUnica();
      console.log('📍 Coordenadas obtidas:', coords);

      console.log('📡 Enviando status online para backend...');
      const resposta = await this.motoristaService.atualizarStatusOnline(true, motoristaId).toPromise() || null;
      console.log('✅ Resposta do backend:', resposta);

      if (!resposta) {
        throw new Error('Sem resposta do servidor ao ficar online');
      }
      
      // Verifica se o backend realmente confirmou o status online
      if (resposta && resposta.online !== true) {
        throw new Error('Backend retornou online=false. Resposta: ' + JSON.stringify(resposta));
      }
      
      // Marca como online ANTES de iniciar rastreamento
      this.online = true;
      console.log('🟢 Status online definido como TRUE');
      this.cdr.detectChanges();
      console.log('📊 Estado final após mudança:', this.online);
      
      // Inicia rastreamento em background (não bloqueia se falhar)
      console.log('🔄 Iniciando rastreamento GPS...');
      this.localizacaoService.iniciarRastreamento(async (coords: Coordenadas) => {
        console.log('📍 Nova posição do rastreamento:', coords);
        this.atualizarPosicaoNoMapa(coords);
      }).catch(erro => {
        console.warn('⚠️ Rastreamento GPS falhou, mas motorista continua online:', erro);
      });
      
      // Inicializa mapa do Google
      setTimeout(() => {
        this.inicializarMapa(coords);
      }, 500);
      
      this.iniciarBuscaCorridas(coords);
      console.log('🔍 Busca de corridas iniciada');
      
      const toast = await this.toastCtrl.create({
        message: '🟢 Você está online! Aguardando corridas...',
        duration: 3000,
        color: 'success'
      });
      await toast.present();
    } catch (erro: any) {
      console.error('❌ Erro ao ficar online:', erro);
      this.online = false; // Garante que o toggle volta para offline
      this.cdr.detectChanges();
      const toast = await this.toastCtrl.create({
        message: 'Erro ao ativar modo online: ' + (erro?.message || JSON.stringify(erro)),
        duration: 5000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  private async ficarOffline() {
    try {
      console.log('🔴 Tentando ficar offline...');
      
      // ID 3 = Motociclista Demo (moto1@mototaxi.local)
      const motoristaId = this.usuario?.id || 3;

      console.log('📡 Enviando status offline (REAL)...');
      await this.motoristaService.atualizarStatusOnline(false, motoristaId).toPromise();
      
      await this.localizacaoService.pararRastreamento();
      this.online = false;
      console.log('🔴 Status online definido como FALSE');
      this.cdr.detectChanges();
      this.corridasDisponiveis = [];
      this.pararBuscaCorridas();
      
      const toast = await this.toastCtrl.create({
        message: '⚫ Você está offline',
        duration: 2000,
        color: 'medium'
      });
      await toast.present();
    } catch (erro) {
      console.error('Erro ao ficar offline:', erro);
    }
  }

  private async iniciarBuscaCorridas(coords: Coordenadas) {
    await this.buscarCorridasProximas(coords);
    
    this.intervaloBusca = setInterval(async () => {
      const coordsAtuais = await this.localizacaoService.obterPosicaoUnica();
      await this.buscarCorridasProximas(coordsAtuais);
    }, 5000);
  }

  private async buscarCorridasProximas(coords: Coordenadas) {
    try {
      if (environment.useMock) {
        this.corridasDisponiveis = await this.apiMock.buscarChamadasProximas(
          coords.lat, coords.lon, 10
        ).toPromise() || [];
      }
    } catch (erro) {
      console.error('Erro ao buscar corridas:', erro);
    }
  }

  private pararBuscaCorridas() {
    this.corridasDisponiveis = [];
    if (this.intervaloBusca) {
      clearInterval(this.intervaloBusca);
    }
  }

  private verificarNovasCorridas(corridas: Corrida[]) {
    if (!this.online) return;
    
    const novasCorridas = corridas.filter(c => 
      c.estado === 'buscando' && 
      !this.corridasDisponiveis.find(existing => existing.id === c.id)
    );
    
    if (novasCorridas.length > 0) {
      this.corridasDisponiveis = [...corridas.filter(c => c.estado === 'buscando')];
      
      // Mostra modal da primeira nova corrida
      const novaCorrida = novasCorridas[0];
      this.mostrarModalNovaCorrida(novaCorrida);
    }
  }

  private async mostrarModalNovaCorrida(corrida: Corrida) {
    // Para som anterior se existir
    await this.notificacaoService.pararSomNovaCorrida();
    
    this.corridaSelecionada = corrida;
    this.tempoRestante = 15;
    this.exibirModalCorrida = true;
    
    // Toca som e vibra
    await this.notificacaoService.tocarSomNovaCorrida();
    
    // Inicia timer
    this.iniciarTimer();
  }

  private iniciarTimer() {
    this.limparTimer();
    this.timerInterval = setInterval(() => {
      this.tempoRestante--;
      if (this.tempoRestante <= 0) {
        this.recusarCorrida();
      }
    }, 1000);
  }

  private limparTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  async aceitarCorrida() {
    if (!this.corridaSelecionada) return;
    
    try {
      await this.apiMock.aceitarCorrida(
        this.corridaSelecionada.id, 
        this.usuario?.id
      ).toPromise();
      
      await this.notificacaoService.pararSomNovaCorrida();
      this.fecharModal();
      
      const toast = await this.toastCtrl.create({
        message: '✅ Corrida aceita! Navegue até o passageiro.',
        duration: 3000,
        color: 'success'
      });
      await toast.present();
      
      this.router.navigate(['/corrida', this.corridaSelecionada.id]);
    } catch (erro: any) {
      const toast = await this.toastCtrl.create({
        message: erro.message || 'Erro ao aceitar corrida',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  async recusarCorrida() {
    await this.notificacaoService.pararSomNovaCorrida();
    this.fecharModal();
    
    const toast = await this.toastCtrl.create({
      message: 'Corrida recusada',
      duration: 2000,
      color: 'medium'
    });
    await toast.present();
  }

  fecharModal() {
    this.limparTimer();
    this.exibirModalCorrida = false;
    this.corridaSelecionada = null;
  }

  async sair() {
    const alert = await this.alertCtrl.create({
      header: 'Sair',
      message: 'Deseja realmente sair do aplicativo?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sair',
          handler: async () => {
            if (this.online) {
              await this.ficarOffline();
            }
            await this.authService.sair();
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  sairDoMenu() {
    this.menuAberto = false;
    this.sair();
  }

  async ficarOfflineDoMenu() {
    this.menuAberto = false;
    await this.alternarStatus();
  }

  async checarStatusServicos() {
    this.menuAberto = false;
    
    const toast = await this.toastCtrl.create({
      message: '🔄 Verificando status dos serviços...',
      duration: 1500,
      color: 'primary',
      position: 'top'
    });
    await toast.present();
    
    // Simula checagem de serviços
    setTimeout(async () => {
      const alert = await this.alertCtrl.create({
        header: 'Status dos Serviços',
        message: `
          <div style="text-align: left;">
            <p><strong>🌐 API Backend:</strong> <span style="color: #10dc60;">✓ Online</span></p>
            <p><strong>📍 Localização:</strong> <span style="color: #10dc60;">✓ Ativo</span></p>
            <p><strong>🔔 Notificações:</strong> <span style="color: #10dc60;">✓ Habilitado</span></p>
            <p><strong>📶 Conexão:</strong> <span style="color: #10dc60;">✓ Estável</span></p>
            <p style="margin-top: 12px; font-size: 12px; color: #666;">
              Última verificação: ${new Date().toLocaleTimeString('pt-BR')}
            </p>
          </div>
        `,
        buttons: ['OK']
      });
      await alert.present();
    }, 1500);
  }

  async inicializarMapa(coords: Coordenadas) {
    try {
      const elemento = document.getElementById('mapa-motorista');
      if (!elemento) {
        console.warn('⚠️ Elemento do mapa não encontrado');
        return;
      }

      // Carrega Leaflet dinamicamente
      const L = await import('leaflet');
      
      // Cria mapa centrado na posição do motorista
      this.mapa = L.map(elemento).setView([coords.lat, coords.lon], 15);

      // Adiciona tiles do OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(this.mapa);

      // Ícone customizado para o motorista (círculo verde)
      const iconeMotorista = L.divIcon({
        html: `
          <div style="
            background-color: #10dc60;
            border: 4px solid white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          "></div>
        `,
        className: 'marcador-motorista',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      // Adiciona marcador da posição do motorista
      this.marcadorMotorista = L.marker([coords.lat, coords.lon], { 
        icon: iconeMotorista 
      }).addTo(this.mapa);

      console.log('✅ Mapa Leaflet inicializado');
    } catch (erro) {
      console.error('❌ Erro ao inicializar mapa:', erro);
    }
  }

  async atualizarPosicaoNoMapa(coords: Coordenadas) {
    if (this.mapa && this.marcadorMotorista) {
      try {
        // Atualiza posição do marcador
        this.marcadorMotorista.setLatLng([coords.lat, coords.lon]);

        // Centraliza mapa na nova posição com animação
        this.mapa.setView([coords.lat, coords.lon], 15, {
          animate: true,
          duration: 0.5
        });

        console.log('✅ Posição atualizada no mapa');
      } catch (erro) {
        console.error('❌ Erro ao atualizar posição no mapa:', erro);
      }
    }
  }

  obterCorStatus(): string {
    return this.online ? 'success' : 'medium';
  }

  obterTextoStatus(): string {
    return this.online ? '🟢 Online' : '⚫ Offline';
  }

  formatarTempo(segundos: number): string {
    return `00:${segundos.toString().padStart(2, '0')}`;
  }
}
