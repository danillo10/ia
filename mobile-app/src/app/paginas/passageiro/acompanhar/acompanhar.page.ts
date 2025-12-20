import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { CorridaService, Corrida } from '../../../servicos/corrida.service';
import { WebsocketService } from '../../../servicos/websocket.service';
import { ApiMockService } from '../../../servicos/api-mock.service';
import { MotoristaService, MotoristaAtivo } from '../../../servicos/motorista.service';
import { environment } from '../../../../environments/environment';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-acompanhar',
  templateUrl: './acompanhar.page.html',
  styleUrls: ['./acompanhar.page.scss'],
})
export class AcompanharPage implements OnInit, OnDestroy {
  corridaId: number = 0;
  corrida: Corrida | null = null;
  motoristasAtivos: MotoristaAtivo[] = [];
  wsSubscription?: Subscription;
  corridasSubscription?: Subscription;
  atualizacaoInterval: any;
  motoristasInterval: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private corridaService: CorridaService,
    private wsService: WebsocketService,
    private mockApi: ApiMockService,
    private motoristaService: MotoristaService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.corridaId = parseInt(this.route.snapshot.paramMap.get('id') || '0');
    this.carregarCorrida();
    
    if (environment.useMock) {
      // No mock, escuta mudanças no BehaviorSubject
      this.corridasSubscription = this.mockApi.corridas$.subscribe(corridas => {
        const corridaAtualizada = corridas.find(c => c.id === this.corridaId);
        if (corridaAtualizada) {
          this.corrida = corridaAtualizada;
          this.verificarMudancaEstado(corridaAtualizada.estado);
        }
      });
      
      // Polling para garantir atualização
      this.atualizacaoInterval = setInterval(() => {
        this.carregarCorrida();
      }, 2000);
      
      // Busca motoristas próximos quando está buscando
      this.carregarMotoristasProximos();
      this.motoristasInterval = setInterval(() => {
        if (this.corrida?.estado === 'buscando') {
          this.carregarMotoristasProximos();
        }
      }, 5000);
    } else {
      this.conectarWebSocket();
      this.carregarMotoristasProximos();
    }
  }

  ngOnDestroy() {
    this.wsService.desconectar();
    this.wsSubscription?.unsubscribe();
    this.corridasSubscription?.unsubscribe();
    if (this.atualizacaoInterval) {
      clearInterval(this.atualizacaoInterval);
    }
    if (this.motoristasInterval) {
      clearInterval(this.motoristasInterval);
    }
  }

  async verificarMudancaEstado(novoEstado: string) {
    if (novoEstado === 'aceita' && this.corrida?.motorista) {
      const toast = await this.toastCtrl.create({
        message: `${this.corrida.motorista.nome} aceitou sua corrida!`,
        duration: 3000,
        color: 'success',
        position: 'top'
      });
      await toast.present();
    } else if (novoEstado === 'em_andamento') {
      const toast = await this.toastCtrl.create({
        message: 'Corrida iniciada! Boa viagem!',
        duration: 3000,
        color: 'primary',
        position: 'top'
      });
      await toast.present();
    } else if (novoEstado === 'finalizada') {
      const toast = await this.toastCtrl.create({
        message: `Corrida finalizada! Valor: R$ ${this.corrida?.preco_final?.toFixed(2)}`,
        duration: 4000,
        color: 'success',
        position: 'top'
      });
      await toast.present();
    }
  }

  async carregarCorrida() {
    try {
      this.corrida = await this.corridaService.obter(this.corridaId).toPromise() || null;
    } catch (erro) {
      const toast = await this.toastCtrl.create({
        message: 'Erro ao carregar corrida',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  async carregarMotoristasProximos() {
    if (!this.corrida) return;
    
    try {
      this.motoristasAtivos = await this.motoristaService.listarMotoristasAtivos(
        this.corrida.origem_lat,
        this.corrida.origem_lon,
        10 // 10km de raio
      ).toPromise() || [];
    } catch (erro) {
      console.error('Erro ao carregar motoristas:', erro);
      this.motoristasAtivos = [];
    }
  }

  conectarWebSocket() {
    this.wsService.conectar(this.corridaId);
    this.wsSubscription = this.wsService.obterMensagens().subscribe(async (msg) => {
      if (msg) {
        console.log('Atualização WS:', msg);
        await this.carregarCorrida();
      }
    });
  }

  obterTextoEstado(): string {
    const estados: any = {
      buscando: 'Procurando motorista...',
      aceita: 'Motorista a caminho',
      em_andamento: 'Corrida em andamento',
      finalizada: 'Corrida finalizada',
      cancelada: 'Corrida cancelada'
    };
    return estados[this.corrida?.estado || 'buscando'] || 'Aguardando...';
  }

  async cancelarCorrida() {
    const alert = await this.alertCtrl.create({
      header: 'Cancelar Corrida',
      message: 'Deseja realmente cancelar esta corrida?',
      buttons: [
        { text: 'Não', role: 'cancel' },
        {
          text: 'Sim',
          handler: async () => {
            try {
              await this.corridaService.cancelar(this.corridaId).toPromise();
              const toast = await this.toastCtrl.create({
                message: 'Corrida cancelada',
                duration: 2000,
                color: 'success'
              });
              await toast.present();
              this.router.navigate(['/passageiro/mapa']);
            } catch (erro) {
              const toast = await this.toastCtrl.create({
                message: 'Erro ao cancelar',
                duration: 3000,
                color: 'danger'
              });
              await toast.present();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async avaliar() {
    const alert = await this.alertCtrl.create({
      header: 'Avaliar Motorista',
      inputs: [
        { name: 'nota', type: 'number', min: 1, max: 5, placeholder: 'Nota (1-5)' },
        { name: 'comentario', type: 'textarea', placeholder: 'Comentário (opcional)' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Enviar',
          handler: async (data) => {
            const toast = await this.toastCtrl.create({
              message: 'Avaliação enviada!',
              duration: 2000,
              color: 'success'
            });
            await toast.present();
            this.router.navigate(['/passageiro/mapa']);
          }
        }
      ]
    });
    await alert.present();
  }
}
