import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/usuarios/login';

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

  // Método para cerrar sesión
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.router.navigate(['/login']);
  }
}
