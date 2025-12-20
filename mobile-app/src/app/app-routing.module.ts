import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { PapelGuard } from './guards/papel.guard';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { 
    path: 'login', 
    loadChildren: () => import('./paginas/compartilhadas/login/login.module').then(m => m.LoginPageModule) 
  },
  { 
    path: 'selecionar-perfil', 
    loadChildren: () => import('./paginas/compartilhadas/selecionar-perfil/selecionar-perfil.module').then(m => m.SelecionarPerfilPageModule),
    canActivate: [AuthGuard]
  },
  { 
    path: 'passageiro', 
    loadChildren: () => import('./paginas/passageiro/passageiro-routing.module').then(m => m.PassageiroRoutingModule),
    canActivate: [AuthGuard, PapelGuard],
    data: { papel: 'passageiro' }
  },
  { 
    path: 'motociclista', 
    loadChildren: () => import('./paginas/motociclista/motociclista-routing.module').then(m => m.MotociclistaRoutingModule),
    canActivate: [AuthGuard, PapelGuard],
    data: { papel: 'motociclista' }
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
