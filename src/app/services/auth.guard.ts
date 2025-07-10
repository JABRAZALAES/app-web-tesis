// auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    // 1. Verificar si hay token
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    // 2. Verificar rol (opcional)
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const rolesPermitidos = ['jefe', 'tecnico'];
    if (!rolesPermitidos.includes(usuario.rol)) {
      this.router.navigate(['/acceso-denegado']);
      return false;
    }

    return true;
  }
}
