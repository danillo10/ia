import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, Subscription, catchError, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { LocalizacaoService } from './localizacao.service';

@Injectable({
  providedIn: 'root'
})
export class MotoristaService {
  private apiUrl = environment.apiUrl;
  private localizacaoSubscription?: Subscription;
  private online = false;
  private motoristaId?: number;

  constructor(
    private http: HttpClient,
    private localizacaoService: LocalizacaoService
  ) {}

  /**
   * Atualiza status online do motorista
   */
  atualizarStatusOnline(online: boolean, motoristaId?: number): Observable<any> {
    console.log(`📤 [MotoristaService] Enviando status: online=${online}, motoristaId=${motoristaId}`);

    const payload = { 
      online,
      motorista_id: motoristaId 
    };
    
    console.log(`📦 [MotoristaService] Payload sendo enviado:`, payload);

    return this.http.put(`${this.apiUrl}/motoristas/status-online`, payload).pipe(
      tap((resposta: any) => {
        const onlineConfirmado = typeof resposta?.online === 'boolean' ? resposta.online : online;

        this.online = onlineConfirmado;
        this.motoristaId = motoristaId;

        if (this.online) {
          this.iniciarEnvioLocalizacao();
        } else {
          this.pararEnvioLocalizacao();
        }
      }),
      catchError((erro) => {
        this.online = false;
        this.pararEnvioLocalizacao();
        return throwError(() => erro);
      })
    );
  }

  /**
   * Verifica se motorista está online
   */
  estaOnline(): boolean {
    return this.online;
  }

  /**
   * Inicia envio periódico de localização (a cada 5 segundos)
   */
  private iniciarEnvioLocalizacao() {
    if (this.localizacaoSubscription) {
      this.localizacaoSubscription.unsubscribe();
    }

    // Envia localização a cada 5 segundos
    this.localizacaoSubscription = interval(5000).subscribe(async () => {
      if (this.online) {
        try {
          const posicao = await this.localizacaoService.obterPosicaoUnica();
          await this.enviarLocalizacao(posicao.lat, posicao.lon).toPromise();
          console.log('📍 Localização enviada:', posicao);
        } catch (erro) {
          console.error('Erro ao enviar localização:', erro);
        }
      }
    });
  }

  /**
   * Para envio de localização
   */
  private pararEnvioLocalizacao() {
    if (this.localizacaoSubscription) {
      this.localizacaoSubscription.unsubscribe();
      this.localizacaoSubscription = undefined;
    }
  }

  /**
   * Envia localização atual para o servidor
   */
  private enviarLocalizacao(lat: number, lon: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/motoristas/localizacao`, { 
      lat, 
      lon,
      motorista_id: this.motoristaId 
    });
  }

  /**
   * Verifica status online do motorista no backend
   */
  verificarStatusOnline(motoristaId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/motoristas/${motoristaId}/status`);
  }

  /**
   * Limpa recursos ao destruir serviço
   */
  ngOnDestroy() {
    this.pararEnvioLocalizacao();
  }
}
