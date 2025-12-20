import { Injectable } from '@angular/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

@Injectable({
  providedIn: 'root'
})
export class NotificacaoService {
  private audioContext?: AudioContext;
  private somNovaCorrida?: HTMLAudioElement;

  constructor() {
    this.inicializarSons();
  }

  private inicializarSons() {
    try {
      // Cria elemento de áudio para notificação
      this.somNovaCorrida = new Audio();
      this.somNovaCorrida.preload = 'auto';
      this.somNovaCorrida.loop = true;
      
      // Som de notificação usando Web Audio API como fallback
      this.inicializarWebAudio();
    } catch (erro) {
      console.log('Áudio não suportado:', erro);
    }
  }

  private inicializarWebAudio() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (erro) {
      console.log('Web Audio API não suportada:', erro);
    }
  }

  async tocarSomNovaCorrida(): Promise<void> {
    try {
      // Vibração para chamar atenção
      await this.vibrar();
      
      // Tenta tocar som usando diferentes métodos
      if (this.somNovaCorrida) {
        // Som personalizado se disponível
        this.somNovaCorrida.currentTime = 0;
        await this.somNovaCorrida.play();
      } else {
        // Fallback: som sintético
        this.tocarSomSintetico();
      }
    } catch (erro) {
      console.error('Erro ao tocar som:', erro);
      // Apenas vibra se o som falhar
      await this.vibrar();
    }
  }

  async pararSomNovaCorrida(): Promise<void> {
    try {
      if (this.somNovaCorrida && !this.somNovaCorrida.paused) {
        this.somNovaCorrida.pause();
        this.somNovaCorrida.currentTime = 0;
      }
    } catch (erro) {
      console.error('Erro ao parar som:', erro);
    }
  }

  private tocarSomSintetico() {
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Configuração do som (frequência alta para chamar atenção)
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
      oscillator.type = 'sine';

      // Envelope do som
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.5);

      // Repetir o som 3 vezes
      setTimeout(() => this.tocarSomSintetico(), 600);
      setTimeout(() => this.tocarSomSintetico(), 1200);
    } catch (erro) {
      console.error('Erro no som sintético:', erro);
    }
  }

  async vibrar(): Promise<void> {
    try {
      // Padrão de vibração: longo-curto-longo
      await Haptics.impact({ style: ImpactStyle.Heavy });
      
      setTimeout(async () => {
        await Haptics.impact({ style: ImpactStyle.Medium });
      }, 200);
      
      setTimeout(async () => {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      }, 400);
    } catch (erro) {
      console.error('Erro na vibração:', erro);
    }
  }

  async configurarSomPersonalizado(url: string): Promise<void> {
    try {
      if (this.somNovaCorrida) {
        this.somNovaCorrida.src = url;
        await this.somNovaCorrida.load();
      }
    } catch (erro) {
      console.error('Erro ao configurar som:', erro);
    }
  }
}