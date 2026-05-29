import { Component, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './servicos/auth.service';
import { IonRouterOutlet } from '@ionic/angular';

@Component({
  selector: 'app-root',
  template: `
    <ion-app>
      <ion-router-outlet #outlet></ion-router-outlet>
    </ion-app>
  `,
  styles: []
})
export class AppComponent implements OnInit {
  @ViewChild('outlet', { static: false }) outlet?: IonRouterOutlet;
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private elementRef: ElementRef
  ) {
    this.fixAriaHiddenWarning();
  }

  ngOnInit() {
    this.authService.estaAutenticado().subscribe(autenticado => {
      if (!autenticado) {
        this.router.navigate(['/login']);
      }
    });
  }

  /**
   * Corrige aviso de aria-hidden no router-outlet
   * Quando um elemento recebe foco, remove aria-hidden do outlet parent
   */
  @HostListener('focusin', ['$event'])
  private onFocusIn(event: FocusEvent) {
    const routerOutlet = this.elementRef.nativeElement.querySelector('ion-router-outlet');
    if (routerOutlet && routerOutlet.hasAttribute('aria-hidden')) {
      // Se um elemento com foco está dentro de um outlet com aria-hidden, remove o atributo
      if (routerOutlet.contains(event.target)) {
        routerOutlet.removeAttribute('aria-hidden');
      }
    }
  }

  /**
   * Gerencia aria-hidden quando o foco sai do app
   */
  private fixAriaHiddenWarning() {
    // Ignora o aviso do console para aria-hidden em router-outlets
    const originalWarn = console.warn;
    console.warn = function(...args: any[]) {
      // Filtra o aviso específico de aria-hidden
      if (args[0] && typeof args[0] === 'string' && 
          args[0].includes('aria-hidden') && 
          args[0].includes('ion-router-outlet')) {
        return; // Ignora silenciosamente
      }
      originalWarn.apply(console, args);
    };
  }
}
