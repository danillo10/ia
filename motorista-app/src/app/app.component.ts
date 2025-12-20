import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {
    // Captura erros de carregamento de módulos dinâmicos do Capacitor
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.message?.includes('Failed to fetch dynamically imported module')) {
        console.warn('⚠️ Erro ao carregar módulo do Capacitor (ignorado):', event.reason);
        event.preventDefault(); // Previne que o erro seja propagado
      }
    });
  }
}
