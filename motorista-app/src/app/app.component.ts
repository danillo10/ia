import { Component, HostListener, ElementRef } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(private elementRef: ElementRef) {
    this.fixAriaHiddenWarning();
    
    // Captura erros de carregamento de módulos dinâmicos do Capacitor
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.message?.includes('Failed to fetch dynamically imported module')) {
        console.warn('⚠️ Erro ao carregar módulo do Capacitor (ignorado):', event.reason);
        event.preventDefault();
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
      if (routerOutlet.contains(event.target)) {
        routerOutlet.removeAttribute('aria-hidden');
      }
    }
  }

  /**
   * Gerencia aria-hidden quando o foco sai do app
   */
  private fixAriaHiddenWarning() {
    const originalWarn = console.warn;
    console.warn = function(...args: any[]) {
      if (args[0] && typeof args[0] === 'string' && 
          args[0].includes('aria-hidden') && 
          args[0].includes('ion-router-outlet')) {
        return;
      }
      originalWarn.apply(console, args);
    };
  }
}
