import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';

export interface Coordenadas {
  lat: number;
  lon: number;
  precision?: number;
}

@Injectable({
  providedIn: 'root'
})
export class LocalizacaoService {
  private rastreamentoId?: string;

  constructor() {}

  async solicitarPermissoes(): Promise<boolean> {
    try {
      const permissoes = await Geolocation.requestPermissions();
      return permissoes.location === 'granted';
    } catch (erro) {
      console.error('Erro ao solicitar permissões:', erro);
      return false;
    }
  }

  async obterPosicaoUnica(): Promise<Coordenadas> {
    try {
      console.log('📍 Obtendo posição GPS única...');
      const posicao = await Geolocation.getCurrentPosition({
        enableHighAccuracy: false, // Desabilita alta precisão para ser mais rápido
        timeout: 5000, // Reduz timeout para 5s
        maximumAge: 60000 // Aceita cache de até 1 minuto
      });

      const coords = {
        lat: posicao.coords.latitude,
        lon: posicao.coords.longitude,
        precision: posicao.coords.accuracy
      };
      
      console.log('✅ Posição obtida:', coords);
      return coords;
    } catch (erro) {
      console.warn('⚠️ Erro ao obter posição GPS, usando coordenadas padrão (Recife):', erro);
      // Retorna coordenadas padrão de Recife, PE ao invés de falhar
      return {
        lat: -8.05428,
        lon: -34.88111,
        precision: 0
      };
    }
  }

  async iniciarRastreamento(callback: (coords: Coordenadas) => void): Promise<void> {
    try {
      console.log('🔄 Iniciando rastreamento GPS...');
      
      const watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        },
        (posicao, erro) => {
          if (erro) {
            console.error('❌ Erro no rastreamento:', erro);
            return;
          }

          if (posicao) {
            const coords = {
              lat: posicao.coords.latitude,
              lon: posicao.coords.longitude,
              precision: posicao.coords.accuracy
            };
            console.log('📍 GPS atualizado:', coords);
            callback(coords);
          }
        }
      );
      
      this.rastreamentoId = watchId;
      console.log('✅ Rastreamento iniciado com ID:', watchId);
    } catch (erro) {
      console.error('❌ Erro ao iniciar rastreamento:', erro);
      throw erro;
    }
  }

  async pararRastreamento(): Promise<void> {
    if (this.rastreamentoId) {
      console.log('🛑 Parando rastreamento GPS...');
      await Geolocation.clearWatch({ id: this.rastreamentoId });
      this.rastreamentoId = undefined;
      console.log('✅ Rastreamento GPS parado');
    }
  }
}