import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FiltrosReporte {
  fechaInicio?: string;
  fechaFin?: string;
  periodoAcademico?: string;
  laboratorio?: string;
  estado?: string;
  usuario?: string;
  usuarioId?: string;
  limite?: number;
  formato?: 'json' | 'excel' | 'pdf';
  tipo?: string;
}

export interface Incidente {
  id: number;
  descripcion: string;
  fecha_reporte: string;
  hora_reporte: string;
  laboratorio_id: string;
  estadoId: string;
  estado_nombre: string;
  usuario_nombre: string;
  inconveniente_nombre: string;
  tiempo_transcurrido_horas: number;
  estado_categoria: string;
}

export interface ObjetoPerdido {
  id: number;
  nombre_objeto: string;
  descripcion: string;
  fecha_perdida: string;
  hora_perdida: string;
  lugar: string;
  laboratorio: string;
  estadoId: string;
  estado_nombre: string;
  dias_transcurridos: number;
  estado_categoria: string;
}

export interface RankingUsuario {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
  total_incidentes: number;
  incidentes_resueltos: number;
  incidentes_activos: number;
  primer_incidente: string;
  ultimo_incidente: string;
  porcentaje_resueltos: number;
}

export interface FiltrosReporte {
  fechaInicio?: string;
  fechaFin?: string;
  periodoAcademico?: string;
  laboratorio?: string;
  estado?: string;
  usuario?: string;
  usuarioId?: string;
  limite?: number;
  formato?: 'json' | 'excel' | 'pdf';
  tipo?: string;
  nombre?: string; // <-- agrega esta línea
}
@Injectable({
  providedIn: 'root'
})
export class ReportesService {
  private baseUrl = environment.apiUrl + '/reportes';

  constructor(private http: HttpClient) { }

  // ===== REPORTES DE INCIDENTES =====

  // 1. Incidentes por laboratorio
  getIncidentesPorLaboratorio(filtros: FiltrosReporte): Observable<any> {
    const params = this.buildParams(filtros);
    const url = `${this.baseUrl}/incidentes-por-laboratorio`;
    console.log('🌐 Llamando API:', url);
    console.log('📋 Parámetros:', params.toString());
    return this.http.get(url, { params });
  }

  // 2. Incidentes por estado
  getIncidentesPorEstado(filtros: FiltrosReporte): Observable<any> {
    const params = this.buildParams(filtros);
    const url = `${this.baseUrl}/incidentes-por-estado`;
    console.log('🌐 Llamando API:', url);
    console.log('📋 Parámetros:', params.toString());
    return this.http.get(url, { params });
  }

  // 3. Incidentes por período académico
  getIncidentesPorPeriodo(filtros: FiltrosReporte): Observable<any> {
    const params = this.buildParams(filtros);
    const url = `${this.baseUrl}/incidentes-por-periodo`;
    console.log('🌐 Llamando API:', url);
    console.log('📋 Parámetros:', params.toString());
    return this.http.get(url, { params });
  }

  // 4. Incidentes por inconveniente
  getIncidentesPorInconveniente(filtros: FiltrosReporte): Observable<any> {
    const params = this.buildParams(filtros);
    const url = `${this.baseUrl}/incidentes-por-inconveniente`;
    console.log('🌐 Llamando API:', url);
    console.log('📋 Parámetros:', params.toString());
    return this.http.get(url, { params });
  }
    /**
   * Exportar trazabilidad por usuario (Excel o PDF)
   * GET /api/reportes/trazabilidad-por-usuario?nombre=Juan&formato=excel|pdf
   */
  exportarTrazabilidadPorUsuario(nombre: string, formato: 'excel' | 'pdf' = 'excel'): Observable<Blob> {
    const params = new HttpParams()
      .set('nombre', nombre)
      .set('formato', formato);
    const url = `${this.baseUrl}/trazabilidad-por-usuario`;
    return this.http.get(url, { params, responseType: 'blob' });
  }

  // 5. Reporte general de incidentes
  getReporteIncidentes(filtros: FiltrosReporte): Observable<any> {
    const params = this.buildParams(filtros);
    const url = `${this.baseUrl}/incidentes`;
    console.log('🌐 Llamando API:', url);
    console.log('📋 Parámetros:', params.toString());
    return this.http.get(url, { params });
  }

  // ===== REPORTES DE OBJETOS PERDIDOS =====

  // 6. Objetos perdidos por laboratorio
  getObjetosPerdidosPorLaboratorio(filtros: FiltrosReporte): Observable<any> {
    const params = this.buildParams(filtros);
    const url = `${this.baseUrl}/objetos-perdidos-por-laboratorio`;
    console.log('🌐 Llamando API:', url);
    console.log('📋 Parámetros:', params.toString());
    return this.http.get(url, { params });
  }

  // 7. Objetos perdidos por estado
  getObjetosPerdidosPorEstado(filtros: FiltrosReporte): Observable<any> {
    const params = this.buildParams(filtros);
    const url = `${this.baseUrl}/objetos-perdidos-por-estado`;
    console.log('🌐 Llamando API:', url);
    console.log('📋 Parámetros:', params.toString());
    return this.http.get(url, { params });
  }

  // 8. Reporte general de objetos perdidos
  getReporteObjetosPerdidos(filtros: FiltrosReporte): Observable<any> {
    const params = this.buildParams(filtros);
    const url = `${this.baseUrl}/objetos-perdidos`;
    console.log('🌐 Llamando API:', url);
    console.log('📋 Parámetros:', params.toString());
    return this.http.get(url, { params });
  }

  // ===== REPORTES DE USUARIOS =====

  // 9. Ranking de usuarios
  getRankingUsuarios(filtros: FiltrosReporte): Observable<any> {
    const url = `${environment.apiUrl}/rankings/top10`;
    console.log('🌐 Llamando API:', url);
    return this.http.get(url);
  }
    laboratorios: any[] = [];

  // ===== TRAZABILIDAD =====

  /**
   * Historial global de cambios de estado (incidentes y objetos perdidos)
   * GET /api/reportes/trazabilidad-estados
   */
  getTrazabilidadEstados(filtros: any = {}): Observable<any> {
    const params = this.buildParams(filtros);
    const url = `${environment.apiUrl}/reportes/trazabilidad-estados`;
    return this.http.get(url, { params });
  }

  /**
   * Historial de acciones de un usuario específico
   * GET /api/reportes/trazabilidad-por-usuario?usuarioId=123
   */
  getTrazabilidadPorUsuario(usuarioId: string, filtros: any = {}): Observable<any> {
    const params = this.buildParams({ ...filtros, usuarioId });
    const url = `${environment.apiUrl}/reportes/trazabilidad-por-usuario`;
    return this.http.get(url, { params });
  }

  /**
   * Historial global de acciones (puede incluir cambios de estado, movimientos, etc.)
   * GET /api/reportes/trazabilidad-general
   */
  getTrazabilidadGeneral(filtros: any = {}): Observable<any> {
    const params = this.buildParams(filtros);
    const url = `${environment.apiUrl}/reportes/trazabilidad-general`;
    return this.http.get(url, { params });
  }

  /**
   * Detalle de actividad de un usuario específico
   * GET /api/reportes/actividad-detallada-usuario?usuarioId=123
   */
  getActividadDetalladaUsuario(usuarioId: string, filtros: any = {}): Observable<any> {
    const params = this.buildParams({ ...filtros, usuarioId });
    const url = `${environment.apiUrl}/reportes/actividad-detallada-usuario`;
    return this.http.get(url, { params });
  }

  /**
   * Buscar trazabilidad de un usuario por nombre
   * GET /api/reportes/trazabilidad-por-usuario?nombre=Juan
   */
  buscarTrazabilidadUsuario(nombre: string): Observable<any> {
    const params = new HttpParams().set('nombre', nombre);
    const url = `${environment.apiUrl}/reportes/trazabilidad-por-usuario`;
    console.log('🌐 Llamando API:', url);
    console.log('📋 Parámetros:', params.toString());
    return this.http.get(url, { params });
  }

  // ===== REPORTES GENERALES =====

  // 15. Reporte completo del sistema
  getReporteCompleto(filtros: FiltrosReporte): Observable<any> {
    const params = this.buildParams(filtros);
    const url = `${this.baseUrl}/completo`;
    console.log('🌐 Llamando API:', url);
    console.log('📋 Parámetros:', params.toString());
    return this.http.get(url, { params });
  }

  // ===== CONSULTAS ESPECÍFICAS =====

// 16. Consultar evidencia de objeto perdido por ID
consultarEvidenciaObjetoPerdido(id: number): Observable<any> {
    const url = `${environment.apiUrl}/reportes/objeto-perdido-evidencia/${id}`;
  console.log('🌐 Llamando API:', url);
  return this.http.get(url);
}
  // ===== DATOS DE FILTROS =====

  // 17. Obtener períodos académicos
  getPeriodosAcademicos(): Observable<any> {
    const url = `${environment.apiUrl}/reportes/periodos-academicos`;
    console.log('🌐 Llamando API:', url);
    return this.http.get(url);
  }

  // 18. Obtener período académico actual
  getPeriodoActual(): Observable<any> {
    const url = `${environment.apiUrl}/reportes/periodo-actual`;
    console.log('🌐 Llamando API:', url);
    return this.http.get(url);
  }



  // ===== EXPORTACIÓN =====

  // 20. Descargar Excel
  descargarExcel(endpoint: string, filtros: FiltrosReporte): Observable<Blob> {
    const params = this.buildParams({ ...filtros, formato: 'excel' });
    return this.http.get(`${this.baseUrl}/${endpoint}`, {
      params,
      responseType: 'blob'
    });
  }

  // 21. Descargar PDF
  descargarPDF(endpoint: string, filtros: FiltrosReporte): Observable<Blob> {
    const params = this.buildParams({ ...filtros, formato: 'pdf' });
    return this.http.get(`${this.baseUrl}/${endpoint}`, {
      params,
      responseType: 'blob'
    });
  }

  // ===== MÉTODOS AUXILIARES =====

  // 22. Descargar archivo
  descargarArchivo(blob: Blob, nombreArchivo: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // 23. Obtener datos del dashboard
  getDashboardData(filtros: FiltrosReporte): Observable<any> {
    // Este método puede ser usado para obtener todos los datos necesarios para el dashboard
    // Puedes implementarlo según tus necesidades específicas
    return this.http.get(`${this.baseUrl}/dashboard`, {
      params: this.buildParams(filtros)
    });
  }

  // 24. Test de conexión
  testConnection(): Observable<any> {
    return this.http.get(`${this.baseUrl}/periodos-academicos`);
  }

  // ===== MÉTODOS ESPECÍFICOS PARA EXPORTACIÓN =====

  // 25. Exportar incidentes por laboratorio
  exportarIncidentesPorLaboratorio(filtros: FiltrosReporte, formato: 'excel' | 'pdf'): Observable<Blob> {
    const params = this.buildParams({ ...filtros, formato });
    return this.http.get(`${this.baseUrl}/incidentes-por-laboratorio`, {
      params,
      responseType: 'blob'
    });
  }

  // 26. Exportar objetos perdidos por laboratorio
  exportarObjetosPerdidosPorLaboratorio(filtros: FiltrosReporte, formato: 'excel' | 'pdf'): Observable<Blob> {
    const params = this.buildParams({ ...filtros, formato });
    return this.http.get(`${this.baseUrl}/objetos-perdidos-por-laboratorio`, {
      params,
      responseType: 'blob'
    });
  }

  // 27. Exportar ranking de usuarios
  exportarRankingUsuarios(filtros: FiltrosReporte, formato: 'excel' | 'pdf'): Observable<Blob> {
    const params = this.buildParams({ ...filtros, formato });
    return this.http.get(`${this.baseUrl}/ranking-usuarios`, {
      params,
      responseType: 'blob'
    });
  }

  // 28. Exportar trazabilidad general
  exportarTrazabilidadGeneral(filtros: FiltrosReporte, formato: 'excel' | 'pdf'): Observable<Blob> {
    const params = this.buildParams({ ...filtros, formato });
    return this.http.get(`${this.baseUrl}/trazabilidad`, {
      params,
      responseType: 'blob'
    });
  }

  // ===== MÉTODOS PÚBLICOS PARA SERVICIOS DE EXPORTACIÓN =====

  // Hacer público buildParams para que los servicios de exportación puedan acceder
  public buildParams(filtros: FiltrosReporte): HttpParams {
    let params = new HttpParams();

    if (filtros.fechaInicio) {
      params = params.set('fechaInicio', filtros.fechaInicio);
    }

    if (filtros.fechaFin) {
      params = params.set('fechaFin', filtros.fechaFin);
    }

    if (filtros.periodoAcademico) {
      params = params.set('periodoAcademico', filtros.periodoAcademico);
    }

    if (filtros.laboratorio) {
      params = params.set('laboratorio', filtros.laboratorio);
    }

    if (filtros.estado) {
      params = params.set('estado', filtros.estado);
    }

    if (filtros.usuario) {
      params = params.set('usuario', filtros.usuario);
    }

    if (filtros.usuarioId) {
      params = params.set('usuarioId', filtros.usuarioId);
    }

    if (filtros.limite) {
      params = params.set('limite', filtros.limite.toString());
    }

    if (filtros.formato) {
      params = params.set('formato', filtros.formato);
    }

    if (filtros.tipo) {
      params = params.set('tipo', filtros.tipo);
    }
        if (filtros.nombre) {
      params = params.set('nombre', filtros.nombre);
    }

    return params;
  }
getLaboratorios(): Observable<any> {
  return this.http.get(`${this.baseUrl}/laboratorios`);
}

  // Hacer público el HttpClient para que los servicios de exportación puedan acceder
  public get httpClient() {
    return this.http;
  }

  // Hacer público el baseUrl para que los servicios de exportación puedan acceder
  public get apiBaseUrl() {
    return this.baseUrl;
  }
}
