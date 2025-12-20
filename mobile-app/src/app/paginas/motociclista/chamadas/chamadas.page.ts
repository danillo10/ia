import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController, LoadingController } from '@ionic/angular';
import { LocalizacaoService, Coordenadas } from '../../../servicos/localizacao.service';
import { ApiService } from '../../../servicos/api.service';
import { ApiMockService } from '../../../servicos/api-mock.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-chamadas',
  templateUrl: './chamadas.page.html',
  styleUrls: ['./chamadas.page.scss'],
})
export class ChamadasPage implements OnInit, OnDestroy {
  online = false;
  chamadas: any[] = [];
  intervaloId: any;

  constructor(
    private localizacaoService: LocalizacaoService,
    private apiService: ApiService,
    private mockApi: ApiMockService,
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  async ngOnInit() {
    await this.localizacaoService.solicitarPermissoes();
  }

  ngOnDestroy() {
    if (this.online) {
      this.alternarStatus();
    }
  }

  async alternarStatus() {
    this.online = !this.online;

    if (this.online) {
      try {
        const coords = await this.localizacaoService.obterPosicaoUnica();
        
        if (environment.useMock) {
          await this.mockApi.statusOnline(true).toPromise();
        } else {
          await this.apiService.put('/motoristas/status-online', { online: true }).toPromise();
        }
        
        await this.localizacaoService.iniciarRastreamento(async (coords: Coordenadas) => {
          if (environment.useMock) {
            await this.mockApi.atualizarLocalizacao(coords).toPromise();
          } else {
            await this.apiService.post('/motoristas/localizacao', coords).toPromise();
          }
        });
        
        this.iniciarBuscaChamadas(coords);
        
        const toast = await this.toastCtrl.create({
          message: 'Você está online! Aguardando chamadas...',
          duration: 3000,
          color: 'success'
        });
        await toast.present();
      } catch (erro) {
        this.online = false;
        const toast = await this.toastCtrl.create({
          message: 'Erro ao ficar online',
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      }
    } else {
      if (environment.useMock) {
        await this.mockApi.statusOnline(false).toPromise();
      } else {
        await this.apiService.put('/motoristas/status-online', { online: false }).toPromise();
      }
      await this.localizacaoService.pararRastreamento();
      this.pararBuscaChamadas();
      
      const toast = await this.toastCtrl.create({
        message: 'Você está offline',
        duration: 2000,
        color: 'medium'
      });
      await toast.present();
    }
  }

  async iniciarBuscaChamadas(coords: Coordenadas) {
    // Busca inicial
    await this.buscarNovasChamadas(coords);
    
    // Atualiza a cada 5 segundos
    this.intervaloId = setInterval(async () => {
      const coordsAtuais = await this.localizacaoService.obterPosicaoUnica();
      await this.buscarNovasChamadas(coordsAtuais);
    }, 5000);
  }

  async buscarNovasChamadas(coords: Coordenadas) {
    try {
      if (environment.useMock) {
        this.chamadas = await this.mockApi.buscarChamadasProximas(coords.lat, coords.lon, 10).toPromise() || [];
      } else {
        // Implementar busca real da API
        this.chamadas = [];
      }
    } catch (erro) {
      console.error('Erro ao buscar chamadas:', erro);
    }
  }

  pararBuscaChamadas() {
    this.chamadas = [];
    if (this.intervaloId) {
      clearInterval(this.intervaloId);
    }
  }

  async aceitarChamada(corridaId: number) {
    const loading = await this.loadingCtrl.create({ message: 'Aceitando...' });
    await loading.present();

    try {
      if (environment.useMock) {
        await this.mockApi.aceitarCorrida(corridaId).toPromise();
      } else {
        await this.apiService.post(`/corridas/${corridaId}/aceitar`, {}).toPromise();
      }
      
      await loading.dismiss();
      
      // Remove da lista de chamadas
      this.chamadas = this.chamadas.filter(c => c.id !== corridaId);
      
      const toast = await this.toastCtrl.create({
        message: 'Corrida aceita! Navegue até o passageiro.',
        duration: 3000,
        color: 'success'
      });
      await toast.present();

      this.router.navigate(['/motociclista/executar', corridaId]);
    } catch (erro: any) {
      await loading.dismiss();
      const toast = await this.toastCtrl.create({
        message: erro?.error?.detail || erro?.message || 'Erro ao aceitar corrida',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }
}
