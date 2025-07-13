import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    try {
      // 1. Verificar si hay token
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No hay token, redirigiendo a login');
        this.router.navigate(['/login']);
        return false;
      }

      // 2. Verificar rol
      const usuarioStr = localStorage.getItem('usuario');
      if (!usuarioStr) {
        console.log('No hay información de usuario, redirigiendo a login');
        this.router.navigate(['/login']);
        return false;
      }

      const usuario = JSON.parse(usuarioStr);
      const rolesPermitidos = ['jefe', 'tecnico'];
      
      if (!usuario.rol || !rolesPermitidos.includes(usuario.rol)) {
        console.log('Rol no permitido:', usuario.rol);
        // Redirigir a login en lugar de una página que no existe
        this.router.navigate(['/login']);
        return false;
      }

      console.log('Acceso autorizado para usuario:', usuario.nombre);
      return true;
    } catch (error) {
      console.error('Error en AuthGuard:', error);
      this.router.navigate(['/login']);
      return false;
    }
  }
}
