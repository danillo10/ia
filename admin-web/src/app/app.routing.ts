import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardPage } from './paginas/dashboard/dashboard.page';
import { CorridasPage } from './paginas/corridas/corridas.page';

const rotas: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: DashboardPage
  },
  {
    path: 'corridas',
    component: CorridasPage
  }
];

@NgModule({
  imports: [RouterModule.forRoot(rotas)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
