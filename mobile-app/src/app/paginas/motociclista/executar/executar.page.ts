import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController, LoadingController } from '@ionic/angular';
import { CorridaService, Corrida } from '../../../servicos/corrida.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-executar',
  templateUrl: './executar.page.html',
  styleUrls: ['./executar.page.scss'],
})
export class ExecutarPage implements OnInit {
  corridaId: number = 0;
  corrida: Corrida | null = null;
  fotoCapacete: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private corridaService: CorridaService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {
    this.corridaId = parseInt(this.route.snapshot.paramMap.get('id') || '0');
    this.carregarCorrida();
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

  async tirarFotoCapacete() {
    try {
      const imagem = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });
      
      this.fotoCapacete = imagem.dataUrl || null;
      
      const toast = await this.toastCtrl.create({
        message: 'Foto capturada!',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
    } catch (erro) {
      console.error('Erro ao tirar foto:', erro);
    }
  }

  async iniciarCorrida() {
    if (!this.fotoCapacete) {
      const toast = await this.toastCtrl.create({
        message: 'Tire uma foto do capacete antes de iniciar',
        duration: 3000,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Iniciando...' });
    await loading.present();

    try {
      await this.corridaService.iniciar(this.corridaId).toPromise();
      await this.carregarCorrida();
      await loading.dismiss();
      
      const toast = await this.toastCtrl.create({
        message: 'Corrida iniciada! Navegue até o destino.',
        duration: 3000,
        color: 'success'
      });
      await toast.present();
    } catch (erro) {
      await loading.dismiss();
      const toast = await this.toastCtrl.create({
        message: 'Erro ao iniciar corrida',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  async finalizarCorrida() {
    const alert = await this.alertCtrl.create({
      header: 'Finalizar Corrida',
      message: 'Confirma a finalização desta corrida?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Finalizar',
          handler: async () => {
            const loading = await this.loadingCtrl.create({ message: 'Finalizando...' });
            await loading.present();

            try {
              const resultado = await this.corridaService.finalizar(this.corridaId).toPromise();
              await loading.dismiss();
              
              const alert2 = await this.alertCtrl.create({
                header: 'Corrida Finalizada',
                message: `Valor: R$ ${resultado.preco_final?.toFixed(2)}`,
                buttons: [
                  {
                    text: 'OK',
                    handler: () => {
                      this.router.navigate(['/motociclista/chamadas']);
                    }
                  }
                ]
              });
              await alert2.present();
            } catch (erro) {
              await loading.dismiss();
              const toast = await this.toastCtrl.create({
                message: 'Erro ao finalizar corrida',
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

  obterTextoEstado(): string {
    const estados: any = {
      aceita: 'Navegando até o passageiro',
      em_andamento: 'Em andamento - Navegando até o destino',
      finalizada: 'Corrida finalizada'
    };
    return estados[this.corrida?.estado || 'aceita'] || 'Aguardando...';
  }
}
