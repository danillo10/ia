import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { SelecionarPerfilPage } from './selecionar-perfil.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([{ path: '', component: SelecionarPerfilPage }])
  ],
  declarations: [SelecionarPerfilPage]
})
export class SelecionarPerfilPageModule {}
