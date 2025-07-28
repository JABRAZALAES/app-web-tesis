import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    try {
      // 1. Verificar token
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No hay token, redirigiendo a login');
        this.router.navigate(['/login']);
        return false;
      }

      // 2. Verificar usuario y rol
      const usuarioStr = localStorage.getItem('usuario');
      if (!usuarioStr) {
        console.log('No hay información de usuario, redirigiendo a login');
        this.router.navigate(['/login']);
        return false;
      }

      const usuario = JSON.parse(usuarioStr);
      const rolUsuario = usuario?.rol;

      // 3. Verificar roles permitidos en la ruta
      const rolesPermitidos = route.data['roles'] as string[] | undefined;

      if (rolesPermitidos && !rolesPermitidos.includes(rolUsuario)) {
        console.log(`Rol "${rolUsuario}" no autorizado para esta ruta`);
        this.router.navigate(['/login']);
        return false;
      }

      // 4. Si pasa todas las validaciones
      return true;

    } catch (error) {
      console.error('Error en AuthGuard:', error);
      this.router.navigate(['/login']);
      return false;
    }
  }
}
