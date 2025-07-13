import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FiltrosReporte } from './reportes.service';

@Injectable({
  providedIn: 'root'
})
export class PdfExportService {
  private baseUrl = environment.apiUrl + '/reportes';

  constructor(private http: HttpClient) { }

  // ===== REPORTES DE INCIDENTES =====

  // 1. Reporte general de incidentes
  exportarIncidentes(filtros: FiltrosReporte): Observable<Blob> {
    const params = this.buildParams({ ...filtros, formato: 'pdf' });
    return this.http.get(`${this.baseUrl}/incidentes`, { 
      params, 
      responseType: 'blob' 
    });
  }

  // 2. Incidentes por laboratorio
  exportarIncidentesPorLaboratorio(filtros: FiltrosReporte): Observable<Blob> {
    const params = this.buildParams({ ...filtros, formato: 'pdf' });
    return this.http.get(`${this.baseUrl}/incidentes-por-laboratorio`, { 
      params, 
      responseType: 'blob' 
    });
  }

  // 3. Incidentes por estado
  exportarIncidentesPorEstado(filtros: FiltrosReporte): Observable<Blob> {
    const params = this.buildParams({ ...filtros, formato: 'pdf' });
    return this.http.get(`${this.baseUrl}/incidentes-por-estado`, { 
      params, 
      responseType: 'blob' 
    });
  }

  // 4. Incidentes por período académico
  exportarIncidentesPorPeriodo(filtros: FiltrosReporte): Observable<Blob> {
    const params = this.buildParams({ ...filtros, formato: 'pdf' });
    return this.http.get(`${this.baseUrl}/incidentes-por-periodo`, { 
      params, 
      responseType: 'blob' 
    });
  }

  // 5. Incidentes por inconveniente
  exportarIncidentesPorInconveniente(filtros: FiltrosReporte): Observable<Blob> {
    const params = this.buildParams({ ...filtros, formato: 'pdf' });
    return this.http.get(`${this.baseUrl}/incidentes-por-inconveniente`, { 
      params, 
      responseType: 'blob' 
    });
  }

  // ===== REPORTES DE OBJETOS PERDIDOS =====

  // 6. Reporte general de objetos perdidos
  exportarObjetosPerdidos(filtros: FiltrosReporte): Observable<Blob> {
    const params = this.buildParams({ ...filtros, formato: 'pdf' });
    return this.http.get(`${this.baseUrl}/objetos-perdidos`, { 
      params, 
      responseType: 'blob' 
    });
  }

  // 7. Objetos perdidos por laboratorio
  exportarObjetosPerdidosPorLaboratorio(filtros: FiltrosReporte): Observable<Blob> {
    const params = this.buildParams({ ...filtros, formato: 'pdf' });
    return this.http.get(`${this.baseUrl}/objetos-perdidos-por-laboratorio`, { 
      params, 
      responseType: 'blob' 
    });
  }

  // 8. Objetos perdidos por estado
  exportarObjetosPerdidosPorEstado(filtros: FiltrosReporte): Observable<Blob> {
    const params = this.buildParams({ ...filtros, formato: 'pdf' });
    return this.http.get(`${this.baseUrl}/objetos-perdidos-por-estado`, { 
      params, 
      responseType: 'blob' 
    });
  }

  // ===== REPORTES DE USUARIOS =====

  // 9. Ranking de usuarios
  exportarRankingUsuarios(filtros: FiltrosReporte): Observable<Blob> {
    const params = this.buildParams({ ...filtros, formato: 'pdf' });
    return this.http.get(`${this.baseUrl}/ranking-usuarios`, { 
      params, 
      responseType: 'blob' 
    });
  }

  // 10. Trazabilidad por usuario específico
  exportarTrazabilidadPorUsuario(usuarioId: string, filtros: FiltrosReporte): Observable<Blob> {
    const params = this.buildParams({ ...filtros, usuarioId, formato: 'pdf' });
    return this.http.get(`${this.baseUrl}/trazabilidad-por-usuario`, { 
      params, 
      responseType: 'blob' 
    });
  }

  // 11. Actividad detallada por usuario
  exportarActividadDetalladaUsuario(usuarioId: string, filtros: FiltrosReporte): Observable<Blob> {
    const params = this.buildParams({ ...filtros, usuarioId, formato: 'pdf' });
    return this.http.get(`${this.baseUrl}/actividad-detallada-usuario`, { 
      params, 
      responseType: 'blob' 
    });
  }

  // ===== REPORTES GENERALES =====

  // 12. Trazabilidad de estados
  exportarTrazabilidadEstados(filtros: FiltrosReporte): Observable<Blob> {
    const params = this.buildParams({ ...filtros, formato: 'pdf' });
    return this.http.get(`${this.baseUrl}/trazabilidad-estados`, { 
      params, 
      responseType: 'blob' 
    });
  }

  // 13. Trazabilidad general
  exportarTrazabilidadGeneral(filtros: FiltrosReporte): Observable<Blob> {
    const params = this.buildParams({ ...filtros, formato: 'pdf' });
    return this.http.get(`${this.baseUrl}/trazabilidad-general`, { 
      params, 
      responseType: 'blob' 
    });
  }

  // 14. Trazabilidad de incidente específico
  exportarTrazabilidadIncidente(id: number, filtros: FiltrosReporte): Observable<Blob> {
    const params = this.buildParams({ ...filtros, formato: 'pdf' });
    return this.http.get(`${this.baseUrl}/trazabilidad-incidente/${id}`, { 
      params, 
      responseType: 'blob' 
    });
  }

  // 15. Trazabilidad de objeto perdido específico
  exportarTrazabilidadObjetoPerdido(id: number, filtros: FiltrosReporte): Observable<Blob> {
    const params = this.buildParams({ ...filtros, formato: 'pdf' });
    return this.http.get(`${this.baseUrl}/trazabilidad-objeto-perdido/${id}`, { 
      params, 
      responseType: 'blob' 
    });
  }

  // 16. Reporte completo
  exportarReporteCompleto(filtros: FiltrosReporte): Observable<Blob> {
    const params = this.buildParams({ ...filtros, formato: 'pdf' });
    return this.http.get(`${this.baseUrl}/completo`, { 
      params, 
      responseType: 'blob' 
    });
  }

  // ===== MÉTODOS AUXILIARES =====

  private buildParams(filtros: FiltrosReporte): HttpParams {
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

    return params;
  }

  // Descargar archivo
  descargarArchivo(blob: Blob, nombreArchivo: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Generar nombre de archivo con fecha
  generarNombreArchivo(tipo: string, extension: string = 'pdf'): string {
    const fecha = new Date().toISOString().split('T')[0];
    const hora = new Date().toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }).replace(':', '-');
    return `ESPE_${tipo}_${fecha}_${hora}.${extension}`;
  }
} 