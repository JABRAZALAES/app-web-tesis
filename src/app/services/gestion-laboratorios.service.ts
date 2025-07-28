  import { Injectable } from '@angular/core';
  import { HttpClient } from '@angular/common/http';
  import { map, Observable } from 'rxjs';
  import { environment } from '../../environments/environment';
  import { HttpHeaders } from '@angular/common/http';

export interface PeriodoAcademico {
  id?: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado_periodo?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PeriodoResponse {
  success: boolean;
  data: PeriodoAcademico[];
  metadata?: {
    total_periodos: number;
    periodo_activo: PeriodoAcademico | null;
    periodos_futuros: number;
    periodos_pasados: number;
  };
}

export interface Computadora {
  id?: number;
  nombre: string;
  laboratorio_id: number;
  especificaciones?: string;
  estado?: string;
  numero_serie?: string;
  created_at?: string;
  updated_at?: string;
  laboratorio_nombre?: string;
  laboratorio_ubicacion?: string;
}

export interface ComputadoraResponse {
  success: boolean;
  data: Computadora[];
  metadata?: {
    total_computadoras: number;
    computadoras_activas: number;
    computadoras_inactivas: number;
    computadoras_mantenimiento: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class GestionLaboratoriosService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ===== PERÍODOS ACADÉMICOS =====

  obtenerPeriodos(): Observable<PeriodoResponse> {
    return this.http.get<PeriodoResponse>(`${this.apiUrl}/reportes/periodos-academicos`);
  }

  obtenerPeriodoPorId(id: number): Observable<{ success: boolean; data: PeriodoAcademico }> {
    return this.http.get<{ success: boolean; data: PeriodoAcademico }>(`${this.apiUrl}/periodos/${id}`);
  }

  crearPeriodo(periodo: PeriodoAcademico): Observable<{ success: boolean; message: string; data: PeriodoAcademico }> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No hay token de autenticación');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token.trim()}`
    });

    return this.http.post<{ success: boolean; message: string; data: PeriodoAcademico }>(
      `${this.apiUrl}/periodos`,
      periodo,
      { headers }
    );
  }

    actualizarPeriodo(id: number, periodo: Partial<PeriodoAcademico>): Observable<{ success: boolean; message: string; data: PeriodoAcademico }> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No hay token de autenticación');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token.trim()}`
    });
    return this.http.put<{ success: boolean; message: string; data: PeriodoAcademico }>(
      `${this.apiUrl}/periodos/${id}`,
      periodo,
      { headers }
    );
  }
  eliminarPeriodo(id: number): Observable<{ success: boolean; message: string; data: any }> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No hay token de autenticación');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token.trim()}`
    });

    return this.http.delete<{ success: boolean; message: string; data: any }>(
      `${this.apiUrl}/periodos/${id}`,
      { headers }
    );
  }


  // ===== COMPUTADORAS =====

  // Crear computadora (requiere token)
  crearComputadora(computadora: Computadora): Observable<{ success: boolean; message: string; data: Computadora }> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No hay token de autenticación');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token.trim()}`
    });

    return this.http.post<{ success: boolean; message: string; data: Computadora }>(
      `${this.apiUrl}/computadoras`,
      computadora,
      { headers }
    );
  }

  // Obtener computadoras por laboratorio (no requiere token)
obtenerComputadorasPorLaboratorio(laboratorio_id: number): Observable<Computadora[]> {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No hay token de autenticación');

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token.trim()}`
  });

  return this.http.get<any>(`${this.apiUrl}/computadoras?laboratorio_id=${laboratorio_id}`, { headers })
    .pipe(map(resp => resp.data));
} 
obtenerTodasComputadoras(): Observable<Computadora[]> {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No hay token de autenticación');
  const headers = new HttpHeaders({
    Authorization: `Bearer ${token.trim()}`
  });
  return this.http.get<{ success: boolean; data: Computadora[] }>(
    `${this.apiUrl}/computadoras`,
    { headers }
  ).pipe(
    // Extrae solo el array de computadoras
    map(resp => resp.data)
  );
}
actualizarComputadora(id: number, computadora: Computadora): Observable<any> {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No hay token de autenticación');
  const headers = new HttpHeaders({
    Authorization: `Bearer ${token.trim()}`
  });
  return this.http.put(`${this.apiUrl}/computadoras/${id}`, computadora, { headers });
}
  // Eliminar computadora (requiere token)
  eliminarComputadora(id: number): Observable<{ success: boolean; message: string; data: any }> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No hay token de autenticación');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token.trim()}`
    });

    return this.http.delete<{ success: boolean; message: string; data: any }>(
      `${this.apiUrl}/computadoras/${id}`,
      { headers }
    );
  }

// ===== LABORATORIOS ACADÉMICOS =====

// Obtener todos los laboratorios
obtenerLaboratorios(): Observable<{ success: boolean; data: any[] }> {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No hay token de autenticación');
  const headers = new HttpHeaders({
    Authorization: `Bearer ${token.trim()}`
  });
  return this.http.get<{ success: boolean; data: any[] }>(
    `${this.apiUrl}/laboratorios`,
    { headers }
  );
}

// Obtener laboratorio por ID
obtenerLaboratorioPorId(id: number): Observable<{ success: boolean; data: any }> {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No hay token de autenticación');
  const headers = new HttpHeaders({
    Authorization: `Bearer ${token.trim()}`
  });
  return this.http.get<{ success: boolean; data: any }>(
    `${this.apiUrl}/laboratorios/${id}`,
    { headers }
  );
}

// Crear laboratorio
crearLaboratorio(laboratorio: any): Observable<{ success: boolean; message: string; data: any }> {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No hay token de autenticación');
  const headers = new HttpHeaders({
    Authorization: `Bearer ${token.trim()}`
  });
  return this.http.post<{ success: boolean; message: string; data: any }>(
    `${this.apiUrl}/laboratorios`,
    laboratorio,
    { headers }
  );
}

// Actualizar laboratorio
actualizarLaboratorio(id: number, laboratorio: Partial<any>): Observable<{ success: boolean; message: string; data: any }> {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No hay token de autenticación');
  const headers = new HttpHeaders({
    Authorization: `Bearer ${token.trim()}`
  });
  return this.http.put<{ success: boolean; message: string; data: any }>(
    `${this.apiUrl}/laboratorios/${id}`,
    laboratorio,
    { headers }
  );
}

// Eliminar laboratorio
eliminarLaboratorio(id: number): Observable<{ success: boolean; message: string; data: any }> {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No hay token de autenticación');
  const headers = new HttpHeaders({
    Authorization: `Bearer ${token.trim()}`
  });
  return this.http.delete<{ success: boolean; message: string; data: any }>(
    `${this.apiUrl}/laboratorios/${id}`,
    { headers }
  );
}
}
