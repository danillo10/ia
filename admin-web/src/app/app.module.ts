import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app.routing';
import { DashboardPage } from './paginas/dashboard/dashboard.page';
import { CorridasPage } from './paginas/corridas/corridas.page';
import { ApiService } from './servicos/api.service';

@NgModule({
  declarations: [AppComponent, DashboardPage, CorridasPage],
  imports: [
    BrowserModule,
    CommonModule,
    HttpClientModule,
    AppRoutingModule,
    RouterModule
  ],
  providers: [ApiService],
  bootstrap: [AppComponent]
})
export class AppModule {}
