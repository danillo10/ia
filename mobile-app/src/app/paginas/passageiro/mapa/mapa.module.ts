import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { MapaPage } from './mapa.page';
import { MapaGoogleModule } from '../../../componentes/mapa-google/mapa-google.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([{ path: '', component: MapaPage }]),
    MapaGoogleModule
  ],
  declarations: [MapaPage]
})
export class MapaPageModule {}
