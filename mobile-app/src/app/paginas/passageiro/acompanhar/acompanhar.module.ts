import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { AcompanharPage } from './acompanhar.page';
import { MapaGoogleModule } from '../../../componentes/mapa-google/mapa-google.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([{ path: '', component: AcompanharPage }]),
    MapaGoogleModule
  ],
  declarations: [AcompanharPage]
})
export class AcompanharPageModule {}
