import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ApiMockService } from './api-mock.service';
import { environment } from '../../environments/environment';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  papel: 'passageiro' | 'motociclista' | 'admin';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private usuarioAtual$ = new BehaviorSubject<Usuario | null>(null);
  private autenticado$ = new BehaviorSubject<boolean>(false);

  constructor(private api: ApiService, private mockApi: ApiMockService) {
    this.verificarToken();
  }

  obterUsuario(): Observable<Usuario | null> {
    return this.usuarioAtual$.asObservable();
  }

  estaAutenticado(): Observable<boolean> {
    return this.autenticado$.asObservable();
  }

  private verificarToken() {
    const token = localStorage.getItem('token');
    if (token) {
      this.autenticado$.next(true);
      const usuarioStr = localStorage.getItem('usuario');
      if (usuarioStr) {
        this.usuarioAtual$.next(JSON.parse(usuarioStr));
      }
    }
  }

  entrar(email: string, senha: string): Observable<any> {
    const requisicao = environment.useMock 
      ? this.mockApi.entrar(email, senha)
      : this.api.post('/auth/entrar', { email, senha });
    
    return requisicao.pipe(
      tap((resposta: any) => {
        if (resposta.token) {
          localStorage.setItem('token', resposta.token);
          localStorage.setItem('usuario', JSON.stringify(resposta.usuario));
          this.usuarioAtual$.next(resposta.usuario);
          this.autenticado$.next(true);
        }
      })
    );
  }

  registrar(dados: any): Observable<any> {
    return environment.useMock 
      ? this.mockApi.registrar(dados)
      : this.api.post('/auth/registrar', dados);
  }

  sair() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.usuarioAtual$.next(null);
    this.autenticado$.next(false);
  }

  obterPapel(): string | null {
    const usuario = this.usuarioAtual$.value;
    return usuario ? usuario.papel : null;
  }
}
