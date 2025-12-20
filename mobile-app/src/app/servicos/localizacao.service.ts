import { Injectable } from '@angular/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Coordenadas {
  lat: number;
  lon: number;
  precision?: number; // Precisão em metros (opcional)
}

@Injectable({
  providedIn: 'root'
})
export class LocalizacaoService {
  private localizacaoAtual$ = new BehaviorSubject<Coordenadas | null>(null);
  private rastreando = false;
  private watchId: string | null = null;

  constructor() {}

  obterLocalizacaoAtual(): Observable<Coordenadas | null> {
    return this.localizacaoAtual$.asObservable();
  }

  async solicitarPermissoes(): Promise<boolean> {
    try {
      // Tenta primeiro com Capacitor (mobile)
      const permissao = await Geolocation.requestPermissions();
      return permissao.location === 'granted';
    } catch (erro) {
      console.warn('Capacitor Geolocation não disponível, tentando browser API...', erro);
      
      // Fallback: Browser Geolocation API
      if ('geolocation' in navigator) {
        return true; // Browser já tem permissão implícita
      }
      
      console.error('Geolocalização não suportada');
      return false;
    }
  }

  async obterPosicaoUnica(): Promise<Coordenadas> {
    try {
      // Tenta primeiro com Capacitor (mobile) com alta precisão
      const posicao: Position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000, // Aumentado para 15s para permitir GPS mais preciso
        maximumAge: 0 // Força obter nova posição, não usa cache
      });
      
      const coords = {
        lat: posicao.coords.latitude,
        lon: posicao.coords.longitude,
        precision: posicao.coords.accuracy // Precisão em metros
      };
      
      console.log('Posição obtida (Capacitor):', coords, `Precisão: ${coords.precision}m`);
      this.localizacaoAtual$.next(coords);
      return coords;
      
    } catch (erro) {
      console.warn('Erro Capacitor, tentando Browser API...', erro);
      
      // Fallback: Browser Geolocation API com alta precisão
      if ('geolocation' in navigator) {
        return new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const coords = {
                lat: position.coords.latitude,
                lon: position.coords.longitude,
                precision: position.coords.accuracy // Precisão em metros
              };
              console.log('Posição obtida (Browser):', coords, `Precisão: ${coords.precision}m`);
              this.localizacaoAtual$.next(coords);
              resolve(coords);
            },
            (error) => {
              console.error('Erro Browser Geolocation:', error);
              let mensagem = 'Erro ao obter localização';
              
              switch(error.code) {
                case error.PERMISSION_DENIED:
                  mensagem = 'Permissão de localização negada. Habilite nas configurações do navegador.';
                  break;
                case error.POSITION_UNAVAILABLE:
                  mensagem = 'Localização não disponível no momento.';
                  break;
                case error.TIMEOUT:
                  mensagem = 'Tempo esgotado ao buscar localização.';
                  break;
              }
              
              reject(new Error(mensagem));
            },
            {
              enableHighAccuracy: true,
              timeout: 15000, // Aumentado para 15s
              maximumAge: 0 // Força nova posição
            }
          );
        });
      }
      
      throw new Error('Geolocalização não suportada neste dispositivo/navegador');
    }
  }

  async iniciarRastreamento(callback?: (coords: Coordenadas) => void): Promise<void> {
    if (this.rastreando) return;
    
    try {
      this.watchId = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
        (posicao, erro) => {
          if (erro) {
            console.error('Erro no rastreamento:', erro);
            return;
          }
          if (posicao) {
            const coords = {
              lat: posicao.coords.latitude,
              lon: posicao.coords.longitude
            };
            this.localizacaoAtual$.next(coords);
            if (callback) callback(coords);
          }
        }
      );
      this.rastreando = true;
    } catch (erro) {
      console.error('Erro ao iniciar rastreamento:', erro);
    }
  }

  async pararRastreamento(): Promise<void> {
    if (this.watchId) {
      await Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
      this.rastreando = false;
    }
  }
}
