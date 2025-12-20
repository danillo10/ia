import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./paginas/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'principal',
    loadComponent: () => import('./paginas/principal/principal.page').then( m => m.PrincipalPage)
  },
  {
    path: 'corrida/:id',
    loadComponent: () => import('./paginas/corrida/corrida.page').then( m => m.CorridaPage)
  }
];
