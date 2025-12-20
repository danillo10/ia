import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { SelecionarLocalizacaoPage } from './selecionar-localizacao.page';
import { MapaGoogleSelectorModule } from '../../../componentes/mapa-google-selector/mapa-google-selector.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([{ path: '', component: SelecionarLocalizacaoPage }]),
    MapaGoogleSelectorModule
  ],
  declarations: [SelecionarLocalizacaoPage]
})
export class SelecionarLocalizacaoPageModule {}