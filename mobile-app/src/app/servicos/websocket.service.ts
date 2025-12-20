import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private ws: WebSocket | null = null;
  private mensagens$ = new BehaviorSubject<any>(null);
  private conectado$ = new BehaviorSubject<boolean>(false);

  constructor() {}

  conectar(corridaId: number): void {
    if (this.ws) {
      this.desconectar();
    }

    const wsUrl = `ws://localhost:8000/ws/corridas/${corridaId}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket conectado');
      this.conectado$.next(true);
    };

    this.ws.onmessage = (evento) => {
      try {
        const dados = JSON.parse(evento.data);
        this.mensagens$.next(dados);
      } catch {
        this.mensagens$.next(evento.data);
      }
    };

    this.ws.onerror = (erro) => {
      console.error('Erro no WebSocket:', erro);
    };

    this.ws.onclose = () => {
      console.log('WebSocket desconectado');
      this.conectado$.next(false);
    };
  }

  desconectar(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.conectado$.next(false);
    }
  }

  enviar(mensagem: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(mensagem));
    }
  }

  obterMensagens(): Observable<any> {
    return this.mensagens$.asObservable();
  }

  estaConectado(): Observable<boolean> {
    return this.conectado$.asObservable();
  }
}
