import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './servicos/auth.service';

@Component({
  selector: 'app-root',
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `,
  styles: []
})
export class AppComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.estaAutenticado().subscribe(autenticado => {
      if (!autenticado) {
        this.router.navigate(['/login']);
      }
    });
  }
}
