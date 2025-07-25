import { Injectable } from '@angular/core';
import { ReportesService, FiltrosReporte } from './reportes.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExcelExportService {
  constructor(private reportesService: ReportesService) {}

  // Exportar incidentes por laboratorio
  exportarIncidentesPorLaboratorio(filtros: FiltrosReporte): Observable<Blob> {
    return this.reportesService.exportarIncidentesPorLaboratorio(filtros, 'excel');
  }

  // Exportar objetos perdidos por laboratorio
  exportarObjetosPerdidosPorLaboratorio(filtros: FiltrosReporte): Observable<Blob> {
    return this.reportesService.exportarObjetosPerdidosPorLaboratorio(filtros, 'excel');
  }

  // Exportar ranking de usuarios
  exportarRankingUsuarios(filtros: FiltrosReporte): Observable<Blob> {
    return this.reportesService.exportarRankingUsuarios(filtros, 'excel');
  }

  // Exportar trazabilidad general
  exportarTrazabilidadGeneral(filtros: FiltrosReporte): Observable<Blob> {
    return this.reportesService.exportarTrazabilidadGeneral(filtros, 'excel');
  }

  // Exportar incidentes por estado
  exportarIncidentesPorEstado(filtros: FiltrosReporte): Observable<Blob> {
    const params = this.reportesService.buildParams({ ...filtros, formato: 'excel' });
    return this.reportesService.httpClient.get(`${this.reportesService.apiBaseUrl}/incidentes-por-estado`, {
      params,
      responseType: 'blob'
    });
  }

  // Exportar objetos perdidos por estado
  exportarObjetosPerdidosPorEstado(filtros: FiltrosReporte): Observable<Blob> {
    const params = this.reportesService.buildParams({ ...filtros, formato: 'excel' });
    return this.reportesService.httpClient.get(`${this.reportesService.apiBaseUrl}/objetos-perdidos-por-estado`, {
      params,
      responseType: 'blob'
    });
  }

  // Exportar reporte completo
  exportarReporteCompleto(filtros: FiltrosReporte): Observable<Blob> {
    const params = this.reportesService.buildParams({ ...filtros, formato: 'excel' });
    return this.reportesService.httpClient.get(`${this.reportesService.apiBaseUrl}/completo`, {
      params,
      responseType: 'blob'
    });
  }
    // Exportar incidentes por inconveniente (Excel)
  exportarIncidentesPorInconveniente(filtros: FiltrosReporte): Observable<Blob> {
    const params = this.reportesService.buildParams({ ...filtros, formato: 'excel' });
    return this.reportesService.httpClient.get(`${this.reportesService.apiBaseUrl}/incidentes-por-inconveniente`, {
      params,
      responseType: 'blob'
    });
  }

  // Exportar reporte de incidentes
  exportarReporteIncidentes(filtros: FiltrosReporte): Observable<Blob> {
    const params = this.reportesService.buildParams({ ...filtros, formato: 'excel' });
    return this.reportesService.httpClient.get(`${this.reportesService.apiBaseUrl}/incidentes`, {
      params,
      responseType: 'blob'
    });
  }

  // Exportar reporte de objetos perdidos
  exportarReporteObjetosPerdidos(filtros: FiltrosReporte): Observable<Blob> {
    const params = this.reportesService.buildParams({ ...filtros, formato: 'excel' });
    return this.reportesService.httpClient.get(`${this.reportesService.apiBaseUrl}/objetos-perdidos`, {
      params,
      responseType: 'blob'
    });
  }

  // Exportar trazabilidad por usuario
  exportarTrazabilidadPorUsuario(usuarioId: string, filtros: FiltrosReporte): Observable<Blob> {
    const params = this.reportesService.buildParams({ ...filtros, usuarioId, formato: 'excel' });
    return this.reportesService.httpClient.get(`${this.reportesService.apiBaseUrl}/trazabilidad-por-usuario`, {
      params,
      responseType: 'blob'
    });
  }

  // Exportar actividad detallada por usuario
  exportarActividadDetalladaUsuario(usuarioId: string, filtros: FiltrosReporte): Observable<Blob> {
    const params = this.reportesService.buildParams({ ...filtros, usuarioId, formato: 'excel' });
    return this.reportesService.httpClient.get(`${this.reportesService.apiBaseUrl}/actividad-detallada-usuario`, {
      params,
      responseType: 'blob'
    });
  }

  // Descargar archivo
  descargarArchivo(blob: Blob, nombreArchivo: string): void {
    this.reportesService.descargarArchivo(blob, nombreArchivo);
  }
}
