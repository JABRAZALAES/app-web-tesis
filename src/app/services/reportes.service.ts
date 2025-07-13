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

export interface TrazabilidadRegistro {
  id: number;
  entidad_id: number;
  tipo_entidad: string;
  estado_anterior: string;
  estado_nuevo: string;
  fecha_cambio: string;
  usuario_nombre: string;
  descripcion: string;
  laboratorio: string;
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
    return this.http.get(`${this.baseUrl}/incidentes-por-laboratorio`, { params });
  }

  // 2. Incidentes por estado
  getIncidentesPorEstado(filtros: FiltrosReporte): Observable<any> {
    const params = this.buildParams(filtros);
    return this.http.get(`${this.baseUrl}/incidentes-por-estado`, { params });
  }

  // 3. Incidentes por período académico
  getIncidentesPorPeriodo(filtros: FiltrosReporte): Observable<any> {
    const params = this.buildParams(filtros);
    return this.http.get(`${this.baseUrl}/incidentes-por-periodo`, { params });
  }

  // 4. Incidentes por inconveniente
  getIncidentesPorInconveniente(filtros: FiltrosReporte): Observable<any> {
    const params = this.buildParams(filtros);
    return this.http.get(`${this.baseUrl}/incidentes-por-inconveniente`, { params });
  }

  // 5. Reporte general de incidentes
  getReporteIncidentes(filtros: FiltrosReporte): Observable<any> {
    const params = this.buildParams(filtros);
    return this.http.get(`${this.baseUrl}/incidentes`, { params });
  }

  // ===== REPORTES DE OBJETOS PERDIDOS =====

  // 6. Objetos perdidos por laboratorio
  getObjetosPerdidosPorLaboratorio(filtros: FiltrosReporte): Observable<any> {
    const params = this.buildParams(filtros);
    return this.http.get(`${this.baseUrl}/objetos-perdidos-por-laboratorio`, { params });
  }

  // 7. Objetos perdidos por estado
  getObjetosPerdidosPorEstado(filtros: FiltrosReporte): Observable<any> {
    const params = this.buildParams(filtros);
    return this.http.get(`${this.baseUrl}/objetos-perdidos-por-estado`, { params });
  }

  // 8. Reporte general de objetos perdidos
  getReporteObjetosPerdidos(filtros: FiltrosReporte): Observable<any> {
    const params = this.buildParams(filtros);
    return this.http.get(`${this.baseUrl}/objetos-perdidos`, { params });
  }

  // ===== REPORTES DE USUARIOS =====

  // 9. Ranking de usuarios
  getRankingUsuarios(filtros: FiltrosReporte): Observable<any> {
    const params = this.buildParams(filtros);
    return this.http.get(`${this.baseUrl}/ranking-usuarios`, { params });
  }

  // 10. Trazabilidad por usuario específico
  getTrazabilidadPorUsuario(usuarioId: string, filtros: FiltrosReporte): Observable<any> {
    const params = this.buildParams({ ...filtros, usuarioId });
    return this.http.get(`${this.baseUrl}/trazabilidad-por-usuario`, { params });
  }

  // 11. Actividad detallada por usuario
  getActividadDetalladaUsuario(usuarioId: string, filtros: FiltrosReporte): Observable<any> {
    const params = this.buildParams({ ...filtros, usuarioId });
    return this.http.get(`${this.baseUrl}/actividad-detallada-usuario`, { params });
  }

  // ===== REPORTES DE TRAZABILIDAD =====

  // Trazabilidad completa
  getTrazabilidadCompleta(filtros: FiltrosReporte): Observable<any> {
    const params = this.buildParams(filtros);
    return this.http.get(`${this.baseUrl}/trazabilidad`, { params });
  }

  // Trazabilidad de incidente específico
  getTrazabilidadIncidenteEspecifico(id: number, filtros: FiltrosReporte): Observable<any> {
    const params = this.buildParams(filtros);
    return this.http.get(`${this.baseUrl}/trazabilidad-incidente/${id}`, { params });
  }

  // Trazabilidad de objeto perdido específico
  getTrazabilidadObjetoPerdidoEspecifico(id: number, filtros: FiltrosReporte): Observable<any> {
    const params = this.buildParams(filtros);
    return this.http.get(`${this.baseUrl}/trazabilidad-objeto-perdido/${id}`, { params });
  }

  // ===== REPORTES GENERALES =====

  // 12. Trazabilidad de estados
  getTrazabilidadEstados(filtros: FiltrosReporte): Observable<any> {
    const params = this.buildParams(filtros);
    return this.http.get(`${this.baseUrl}/trazabilidad-estados`, { params });
  }

  // 13. Trazabilidad general
  getTrazabilidadGeneral(filtros: FiltrosReporte): Observable<any> {
    const params = this.buildParams(filtros);
    return this.http.get(`${this.baseUrl}/trazabilidad-general`, { params });
  }

  // 14. Trazabilidad de incidente específico
  getTrazabilidadIncidente(id: number, filtros: FiltrosReporte): Observable<any> {
    const params = this.buildParams(filtros);
    return this.http.get(`${this.baseUrl}/trazabilidad-incidente/${id}`, { params });
  }

  // 15. Trazabilidad de objeto perdido específico
  getTrazabilidadObjetoPerdido(id: number, filtros: FiltrosReporte): Observable<any> {
    const params = this.buildParams(filtros);
    return this.http.get(`${this.baseUrl}/trazabilidad-objeto-perdido/${id}`, { params });
  }

  // 16. Reporte completo
  getReporteCompleto(filtros: FiltrosReporte): Observable<any> {
    const params = this.buildParams(filtros);
    return this.http.get(`${this.baseUrl}/completo`, { params });
  }

  // ===== DESCARGAS =====

  // Descargar reporte en Excel
  descargarExcel(endpoint: string, filtros: FiltrosReporte): Observable<Blob> {
    const params = this.buildParams({ ...filtros, formato: 'excel' });
    return this.http.get(`${this.baseUrl}/${endpoint}`, { 
      params, 
      responseType: 'blob' 
    });
  }

  // Descargar reporte en PDF
  descargarPDF(endpoint: string, filtros: FiltrosReporte): Observable<Blob> {
    const params = this.buildParams({ ...filtros, formato: 'pdf' });
    return this.http.get(`${this.baseUrl}/${endpoint}`, { 
      params, 
      responseType: 'blob' 
    });
  }

  // ===== MÉTODOS AUXILIARES =====

  private buildParams(filtros: FiltrosReporte): HttpParams {
    let params = new HttpParams();

    // Filtros de fecha - el backend espera estos nombres exactos
    if (filtros.fechaInicio) {
      params = params.set('fechaInicio', filtros.fechaInicio);
    }
    if (filtros.fechaFin) {
      params = params.set('fechaFin', filtros.fechaFin);
    }
    
    // Período académico - el backend espera periodo_academico_id
    if (filtros.periodoAcademico) {
      params = params.set('periodo_academico_id', filtros.periodoAcademico);
    }
    
    // Laboratorio
    if (filtros.laboratorio) {
      params = params.set('laboratorio', filtros.laboratorio);
    }
    
    // Estado (aunque ya no lo usamos, lo mantenemos por compatibilidad)
    if (filtros.estado) {
      params = params.set('estado', filtros.estado);
    }
    
    // Usuario
    if (filtros.usuario) {
      params = params.set('usuario', filtros.usuario);
    }
    if (filtros.usuarioId) {
      params = params.set('usuarioId', filtros.usuarioId);
    }
    
    // Límite (aunque ya no lo usamos, lo mantenemos por compatibilidad)
    if (filtros.limite) {
      params = params.set('limite', filtros.limite.toString());
    }
    
    // Formato para exportaciones
    if (filtros.formato) {
      params = params.set('formato', filtros.formato);
    }
    
    // Tipo
    if (filtros.tipo) {
      params = params.set('tipo', filtros.tipo);
    }

    console.log('Parámetros construidos para el backend:', params.toString());
    return params;
  }

  // Método para descargar archivo
  descargarArchivo(blob: Blob, nombreArchivo: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // ===== MÉTODOS PARA DASHBOARD =====

  // Obtener datos para el dashboard principal
  getDashboardData(filtros: FiltrosReporte): Observable<any> {
    return new Observable(observer => {
      try {
        // Obtener múltiples reportes en paralelo
        const requests = [
          this.getIncidentesPorLaboratorio(filtros),
          this.getIncidentesPorEstado(filtros),
          this.getObjetosPerdidosPorLaboratorio(filtros),
          this.getObjetosPerdidosPorEstado(filtros),
          this.getRankingUsuarios(filtros)
        ];

        // Combinar todas las respuestas
        const combinedData: any = {
          incidentesPorLaboratorio: { data: [] },
          incidentesPorEstado: { data: [] },
          objetosPorLaboratorio: { data: [] },
          objetosPorEstado: { data: [] },
          rankingUsuarios: { data: { ranking_incidentes: [] } }
        };
        
        let completedRequests = 0;
        let hasError = false;

        requests.forEach((request, index) => {
          request.subscribe({
            next: (data) => {
              if (!hasError) {
                try {
                  switch (index) {
                    case 0:
                      combinedData.incidentesPorLaboratorio = data || { data: [] };
                      break;
                    case 1:
                      combinedData.incidentesPorEstado = data || { data: [] };
                      break;
                    case 2:
                      combinedData.objetosPorLaboratorio = data || { data: [] };
                      break;
                    case 3:
                      combinedData.objetosPorEstado = data || { data: [] };
                      break;
                    case 4:
                      combinedData.rankingUsuarios = data || { data: { ranking_incidentes: [] } };
                      break;
                  }
                  completedRequests++;

                  if (completedRequests === requests.length) {
                    observer.next(combinedData);
                    observer.complete();
                  }
                } catch (parseError) {
                  console.error('Error parseando datos del request', index, parseError);
                  if (!hasError) {
                    hasError = true;
                    observer.error(parseError);
                  }
                }
              }
            },
            error: (error) => {
              if (!hasError) {
                hasError = true;
                console.error(`Error en request ${index}:`, error);
                // En lugar de fallar completamente, enviar datos vacíos
                observer.next(combinedData);
                observer.complete();
              }
            }
          });
        });
      } catch (error) {
        console.error('Error en getDashboardData:', error);
        observer.error(error);
      }
    });
  }

  // Método para obtener evidencia de objeto perdido
  getEvidenciaObjetoPerdido(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/evidencia-objeto-perdido/${id}`);
  }

  // Método para validar conexión con el backend
  testConnection(): Observable<any> {
    return this.http.get(`${this.baseUrl}/test`);
  }

  // Obtener períodos académicos disponibles
  getPeriodosAcademicos(): Observable<any> {
    return this.http.get(`${this.baseUrl}/periodos-academicos`);
  }

  // Obtener laboratorios disponibles
  getLaboratorios(): Observable<any> {
    return this.http.get(`${this.baseUrl}/laboratorios`);
  }

  // Obtener top 10 usuarios
  getTop10Usuarios(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/rankings/top10`);
  }
}