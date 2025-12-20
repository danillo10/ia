import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, 
  IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonButton,
  IonIcon
} from '@ionic/angular/standalone';
import { LoadingController, ToastController } from '@ionic/angular';
import { AuthService } from '../../servicos/auth.service';
import { addIcons } from 'ionicons';
import { logInOutline, personOutline, lockClosedOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonButton, IonIcon, CommonModule, FormsModule]
})
export class LoginPage implements OnInit {
  email = 'moto1@mototaxi.local';
  senha = '123456';

  constructor(
    private authService: AuthService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
    addIcons({ logInOutline, personOutline, lockClosedOutline });
  }

  async ngOnInit() {
    // Verifica se já está logado
    if (this.authService.estaLogado()) {
      this.router.navigate(['/principal']);
    }
  }

  async entrar() {
    if (!this.email || !this.senha) {
      const toast = await this.toastCtrl.create({
        message: 'Preencha email e senha',
        duration: 3000,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Entrando...'
    });
    await loading.present();

    try {
      await this.authService.entrar(this.email, this.senha);
      await loading.dismiss();
      
      const toast = await this.toastCtrl.create({
        message: 'Login realizado com sucesso!',
        duration: 2000,
        color: 'success'
      });
      await toast.present();

      this.router.navigate(['/principal']);
    } catch (erro: any) {
      await loading.dismiss();
      const toast = await this.toastCtrl.create({
        message: erro.message || 'Erro ao fazer login',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }
}
