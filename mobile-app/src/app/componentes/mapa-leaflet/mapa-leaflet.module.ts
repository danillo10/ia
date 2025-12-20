import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { MapaLeafletComponent } from './mapa-leaflet.component';

@NgModule({
  declarations: [MapaLeafletComponent],
  imports: [CommonModule, IonicModule],
  exports: [MapaLeafletComponent]
})
export class MapaLeafletModule {}
