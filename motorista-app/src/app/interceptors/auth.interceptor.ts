import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../servicos/auth.service';
import { switchMap, take } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // Obtém o token do AuthService
  return authService.token$.pipe(
    take(1),
    switchMap(token => {
      // Se houver token, clona a requisição e adiciona o header Authorization
      if (token) {
        const clonedReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        return next(clonedReq);
      }
      
      // Se não houver token, envia a requisição original
      return next(req);
    })
  );
};
