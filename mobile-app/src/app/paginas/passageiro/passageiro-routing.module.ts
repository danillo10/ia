import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'mapa', pathMatch: 'full' },
  { path: 'mapa', loadChildren: () => import('./mapa/mapa.module').then(m => m.MapaPageModule) },
  { path: 'selecionar-localizacao', loadChildren: () => import('./selecionar-localizacao/selecionar-localizacao.module').then(m => m.SelecionarLocalizacaoPageModule) },
  { path: 'acompanhar/:id', loadChildren: () => import('./acompanhar/acompanhar.module').then(m => m.AcompanharPageModule) },
  { path: 'historico', loadChildren: () => import('./historico/historico.module').then(m => m.HistoricoPageModule) }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PassageiroRoutingModule {}
