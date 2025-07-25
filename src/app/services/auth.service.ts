import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://10.3.1.112:3000/api/usuarios/login';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(correo: string, contrasena: string): Observable<any> {
    return this.http.post(this.apiUrl, { correo, contrasena }).pipe(
      map((response: any) => {
        // Validación de roles para la web
        const rolesPermitidos = ['jefe', 'tecnico'];
        if (!rolesPermitidos.includes(response.usuario.rol)) {
          throw new Error('Acceso restringido: Solo personal autorizado');
        }

        // Guardar datos en localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('usuario', JSON.stringify(response.usuario));

        return response;
      }),
      catchError((error) => {
        return throwError(() => ({
          message: error.error?.message || 'Error en el login',
          status: error.status
        }));
      })
    );
  }

  // Método para obtener el usuario actual
  getCurrentUser(): any {
    const usuarioStr = localStorage.getItem('usuario');
    if (usuarioStr) {
      try {
        return JSON.parse(usuarioStr);
      } catch (e) {
        console.error('Error al parsear usuario:', e);
        return null;
      }
    }
    return null;
  }

  // Método para verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    const usuario = this.getCurrentUser();
    return !!(token && usuario);
  }

  // Método para obtener el token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Método para cerrar sesión
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.router.navigate(['/login']);
  }
}
