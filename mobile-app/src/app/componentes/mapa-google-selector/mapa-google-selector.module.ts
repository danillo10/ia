import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { MapaGoogleSelectorComponent } from './mapa-google-selector.component';

@NgModule({
  declarations: [MapaGoogleSelectorComponent],
  imports: [
    CommonModule,
    IonicModule
  ],
  exports: [MapaGoogleSelectorComponent]
})
export class MapaGoogleSelectorModule { }