import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../servicos/auth.service';
import { LoadingController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  formulario: FormGroup;
  modoRegistro = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
    this.formulario = this.fb.group({
      email: ['passageiro1@mototaxi.local', [Validators.required, Validators.email]],
      senha: ['123456', [Validators.required, Validators.minLength(6)]],
      nome: [''],
      papel: ['passageiro']
    });
  }

  ngOnInit() {}

  async entrarComoPassageiro() {
    await this.fazerLoginRapido('passageiro1@mototaxi.local', '123456', 'passageiro');
  }

  async entrarComoMotorista() {
    await this.fazerLoginRapido('moto1@mototaxi.local', '123456', 'motociclista');
  }

  async fazerLoginRapido(email: string, senha: string, papel: string) {
    const loading = await this.loadingCtrl.create({
      message: 'Entrando...'
    });
    await loading.present();

    try {
      await this.authService.entrar(email, senha).toPromise();
      
      if (papel === 'passageiro') {
        this.router.navigate(['/passageiro/mapa']);
      } else if (papel === 'motociclista') {
        this.router.navigate(['/motociclista/chamadas']);
      }
    } catch (erro: any) {
      const toast = await this.toastCtrl.create({
        message: erro?.message || 'Erro ao fazer login',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      await loading.dismiss();
    }
  }

  alternarModo() {
    this.modoRegistro = !this.modoRegistro;
    if (this.modoRegistro) {
      this.formulario.get('nome')?.setValidators([Validators.required]);
    } else {
      this.formulario.get('nome')?.clearValidators();
    }
    this.formulario.get('nome')?.updateValueAndValidity();
  }

  async enviar() {
    if (this.formulario.invalid) {
      const toast = await this.toastCtrl.create({
        message: 'Preencha todos os campos corretamente',
        duration: 3000,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: this.modoRegistro ? 'Criando conta...' : 'Entrando...'
    });
    await loading.present();

    const { email, senha, nome, papel } = this.formulario.value;

    try {
      if (this.modoRegistro) {
        await this.authService.registrar({ email, senha, nome, papel }).toPromise();
        const toast = await this.toastCtrl.create({
          message: 'Conta criada com sucesso! Faça login.',
          duration: 3000,
          color: 'success'
        });
        await toast.present();
        this.alternarModo();
      } else {
        const resposta = await this.authService.entrar(email, senha).toPromise();
        
        if (resposta?.usuario?.papel === 'passageiro') {
          this.router.navigate(['/passageiro/mapa']);
        } else if (resposta?.usuario?.papel === 'motociclista') {
          this.router.navigate(['/motociclista/chamadas']);
        } else {
          this.router.navigate(['/selecionar-perfil']);
        }
      }
    } catch (erro: any) {
      const toast = await this.toastCtrl.create({
        message: erro?.error?.detail || 'Erro ao processar solicitação',
        duration: 4000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      await loading.dismiss();
    }
  }
}
