import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'chamadas', pathMatch: 'full' },
  { path: 'chamadas', loadChildren: () => import('./chamadas/chamadas.module').then(m => m.ChamadasPageModule) },
  { path: 'executar/:id', loadChildren: () => import('./executar/executar.module').then(m => m.ExecutarPageModule) },
  { path: 'carteira', loadChildren: () => import('./carteira/carteira.module').then(m => m.CarteiraPageModule) }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MotociclistaRoutingModule {}
