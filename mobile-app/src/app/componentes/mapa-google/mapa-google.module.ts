import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { MapaGoogleComponent } from './mapa-google.component';

@NgModule({
  declarations: [MapaGoogleComponent],
  imports: [
    CommonModule,
    IonicModule
  ],
  exports: [MapaGoogleComponent]
})
export class MapaGoogleModule { }