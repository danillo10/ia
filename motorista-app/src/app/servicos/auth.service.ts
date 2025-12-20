import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Preferences } from '@capacitor/preferences';
import { ApiService } from './api.service';
import { ApiMockService, MotoristaUsuario as MotoristaUsuarioType } from './api-mock.service';
import { environment } from '../../environments/environment';

export type MotoristaUsuario = MotoristaUsuarioType;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private usuarioAtualSubject = new BehaviorSubject<MotoristaUsuario | null>(null);
  public usuarioAtual$ = this.usuarioAtualSubject.asObservable();
  
  private tokenSubject = new BehaviorSubject<string | null>(null);
  public token$ = this.tokenSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private mockApi: ApiMockService
  ) {
    this.carregarTokenSalvo();
  }

  async carregarTokenSalvo() {
    try {
      const { value: token } = await Preferences.get({ key: 'auth_token' });
      const { value: userData } = await Preferences.get({ key: 'user_data' });
      
      if (token && userData) {
        this.tokenSubject.next(token);
        this.usuarioAtualSubject.next(JSON.parse(userData));
      }
    } catch (erro) {
      console.error('Erro ao carregar dados salvos:', erro);
    }
  }

  async entrar(email: string, senha: string): Promise<any> {
    try {
      const resposta = environment.useMock 
        ? await this.mockApi.entrar(email, senha).toPromise()
        : await this.apiService.post('/auth/entrar', { email, senha }).toPromise();

      if (resposta && resposta.access_token) {
        await this.salvarDadosAutenticacao(resposta.access_token, resposta.usuario);
        return resposta;
      }
      
      throw new Error('Resposta inválida do servidor');
    } catch (erro) {
      console.error('Erro no login:', erro);
      throw erro;
    }
  }

  async salvarDadosAutenticacao(token: string, usuario: MotoristaUsuario) {
    try {
      await Preferences.set({ key: 'auth_token', value: token });
      await Preferences.set({ key: 'user_data', value: JSON.stringify(usuario) });
      
      this.tokenSubject.next(token);
      this.usuarioAtualSubject.next(usuario);
    } catch (erro) {
      console.error('Erro ao salvar dados:', erro);
    }
  }

  async sair() {
    try {
      await Preferences.remove({ key: 'auth_token' });
      await Preferences.remove({ key: 'user_data' });
      
      this.tokenSubject.next(null);
      this.usuarioAtualSubject.next(null);
    } catch (erro) {
      console.error('Erro ao limpar dados:', erro);
    }
  }

  obterUsuarioAtual(): MotoristaUsuario | null {
    return this.usuarioAtualSubject.value;
  }

  obterToken(): string | null {
    return this.tokenSubject.value;
  }

  estaLogado(): boolean {
    return !!this.obterToken() && !!this.obterUsuarioAtual();
  }
}