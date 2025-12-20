import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, Usuario } from '../../../servicos/auth.service';

@Component({
  selector: 'app-selecionar-perfil',
  templateUrl: './selecionar-perfil.page.html',
  styleUrls: ['./selecionar-perfil.page.scss'],
})
export class SelecionarPerfilPage implements OnInit {
  usuario: Usuario | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.obterUsuario().subscribe(u => this.usuario = u);
  }

  selecionarPassageiro() {
    this.router.navigate(['/passageiro/mapa']);
  }

  selecionarMotociclista() {
    this.router.navigate(['/motociclista/chamadas']);
  }

  sair() {
    this.authService.sair();
    this.router.navigate(['/login']);
  }
}
