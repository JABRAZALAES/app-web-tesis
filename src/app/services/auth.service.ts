// ================== AUTH SERVICE CON DEBUG COMPLETO ==================
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface AuthUsuario {
  id: number;
  correo: string;
  nombre: string;
  rol: string;
  activo: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiLoginUrl = 'http://10.3.1.112:3000/api/usuarios/login';
  private apiUsuariosUrl = 'http://10.3.1.112:3000/api/usuarios';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  login(correo: string, contrasena: string): Observable<any> {
    console.log('🔍 Iniciando login para:', correo);

    return this.http.post(this.apiLoginUrl, { correo, contrasena }).pipe(
      tap(response => {
        console.log('🔍 Respuesta completa del login:', response);
      }),
      map((response: any) => {
        const rolesPermitidos = ['jefe', 'tecnico', 'normal'];
        if (!rolesPermitidos.includes(response.usuario.rol)) {
          throw new Error('Acceso restringido: Solo personal autorizado');
        }

        console.log('🔍 Usuario del login:', {
          id: response.usuario.id,
          nombre: response.usuario.nombre,
          rol: response.usuario.rol,
          activo: response.usuario.activo,
          tipo_activo: typeof response.usuario.activo
        });

        localStorage.setItem('token', response.token);
        localStorage.setItem('usuario', JSON.stringify(response.usuario));
        return response;
      }),
      catchError((error) => {
        console.error('❌ Error en login:', error);
        return throwError(() => ({
          message: error.error?.message || 'Error en el login',
          status: error.status
        }));
      })
    );
  }

  // 🔍 MÉTODO PARA FORZAR RECARGA DE USUARIOS DESPUÉS DEL LOGIN
listarUsuarios(q: string = ''): Observable<AuthUsuario[]> {
  let params: HttpParams | undefined = undefined;
  if (q) {
    params = new HttpParams().set('q', q);
  }
  const url = 'http://10.3.1.112:3000/api/auth/usuarios';
  return this.http.get<any>(url, {
    params,
    headers: this.getAuthHeaders()
  }).pipe(
      tap(response => {
        console.log('🔍 RESPUESTA COMPLETA del backend:', response);
        console.log('🔍 USUARIOS RAW desde BD:', response.data);

        // Log detallado de cada usuario
        response.data?.forEach((user: any, index: number) => {
          console.log(`🔍 Usuario ${index + 1}:`, {
            id: user.id,
            nombre: user.nombre,
            activo: user.activo,
            tipo_activo: typeof user.activo,
            activo_raw: JSON.stringify(user.activo)
          });
        });
      }),
      map(resp => resp.data as AuthUsuario[]),
      catchError((error) => {
        console.error('❌ Error al listar usuarios:', error);
        return throwError(() => error);
      })
    );
  }

cambiarEstadoUsuario(id: number, activo: number): Observable<any> {
  // Usa la ruta correcta con /auth/usuarios/
  const url = `http://10.3.1.112:3000/api/auth/usuarios/${id}/estado`;
  return this.http.put<any>(url, { activo }, { headers: this.getAuthHeaders() })
    .pipe(
      tap(response => {
        console.log('✅ Estado cambiado en backend:', response);
      }),
      catchError((error) => {
        console.error('❌ Error al cambiar estado:', error);
        return throwError(() => error);
      })
    );
}

  cambiarRolUsuario(id: number, rol: string): Observable<any> {
    const url = `${this.apiUsuariosUrl}/${id}/rol`;

    return this.http.put<any>(url, { rol }, { headers: this.getAuthHeaders() })
      .pipe(
        tap(response => {
          console.log('✅ Rol cambiado:', response);
        }),
        catchError((error) => {
          console.error('❌ Error al cambiar rol:', error);
          return throwError(() => error);
        })
      );
  }

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

  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    const usuario = this.getCurrentUser();
    return !!(token && usuario);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.router.navigate(['/login']);
  }
}
