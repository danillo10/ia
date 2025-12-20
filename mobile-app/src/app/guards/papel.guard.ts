import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../servicos/auth.service';
import { map, take } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PapelGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const papelRequerido = route.data['papel'];
    
    return this.authService.obterUsuario().pipe(
      take(1),
      map(usuario => {
        if (!usuario) {
          this.router.navigate(['/login']);
          return false;
        }
        if (papelRequerido && usuario.papel !== papelRequerido && usuario.papel !== 'admin') {
          this.router.navigate(['/acesso-negado']);
          return false;
        }
        return true;
      })
    );
  }
}
