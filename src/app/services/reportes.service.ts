import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  metadata: {
    total_registros: number;
    fecha_consulta: string;
    filtros_aplicados: any;
  };
}

export interface IncidenteLaboratorio {
  laboratorio: string;
  total_incidentes: number;
  incidentes_activos: number;
  incidentes_aprobados: number;
  incidentes_anulados: number;
  incidentes_escalados: number;
}

export interface IncidenteEstado {
  estado: string;
  total_incidentes: number;
}
export interface ObjetoEstado {
  estado: string;
  total_objetos: number;
}
export interface IncidentePeriodo {
  id: number;
  codigo: string;
  fecha_reporte: string;
  descripcion: string;
  laboratorio_id: string;
  inconveniente_id: number;
  estadoId: string;
  observaciones?: string;
  fecha_resolucion?: string;
  periodo_academico_id: number;
  periodo_academico: string;
}

export interface IncidenteInconveniente {
  inconveniente: string;
  total_incidentes: number;
}

export interface ObjetoLaboratorio {
  laboratorio: string;
  total_objetos_perdidos: number;


}

export interface ObjetoEstado {
  estado: string;
  total_objetos: number;
}

export interface FiltrosReporte {
  fechaInicio?: string;
  fechaFin?: string;
  limite?: number;
  periodoId?: number;
  laboratorio?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportesService {
  private readonly apiUrl = 'http://10.3.1.112:3000/api/reportes';

  constructor(private http: HttpClient) {}

  private buildHttpParams(filtros: FiltrosReporte): HttpParams {
    let params = new HttpParams();
    if (filtros.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
    if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
    if (filtros.limite) params = params.set('limite', filtros.limite.toString());
    if (filtros.periodoId) params = params.set('periodoId', filtros.periodoId.toString());
    if (filtros.laboratorio) params = params.set('laboratorio', filtros.laboratorio);
    return params;
  }

  getIncidentesPorLaboratorio(filtros: FiltrosReporte = {}): Observable<ApiResponse<IncidenteLaboratorio[]>> {
    const params = this.buildHttpParams(filtros);
    return this.http.get<ApiResponse<IncidenteLaboratorio[]>>(`${this.apiUrl}/incidentes-por-laboratorio`, { params });
  }

  getIncidentesPorEstado(filtros: FiltrosReporte = {}): Observable<ApiResponse<IncidenteEstado[]>> {
    const params = this.buildHttpParams(filtros);
    return this.http.get<ApiResponse<IncidenteEstado[]>>(`${this.apiUrl}/incidentes-por-estado`, { params });
  }

  getIncidentesPorPeriodo(filtros: FiltrosReporte = {}): Observable<ApiResponse<IncidentePeriodo[]>> {
    const params = this.buildHttpParams(filtros);
    return this.http.get<ApiResponse<IncidentePeriodo[]>>(`${this.apiUrl}/incidentes-por-periodo`, { params });
  }

  getIncidentesPorInconveniente(filtros: FiltrosReporte = {}): Observable<ApiResponse<IncidenteInconveniente[]>> {
    const params = this.buildHttpParams(filtros);
    return this.http.get<ApiResponse<IncidenteInconveniente[]>>(`${this.apiUrl}/incidentes-por-inconveniente`, { params });
  }

  getObjetosPerdidosPorLaboratorio(filtros: FiltrosReporte = {}): Observable<ApiResponse<ObjetoLaboratorio[]>> {
    const params = this.buildHttpParams(filtros);
    return this.http.get<ApiResponse<ObjetoLaboratorio[]>>(`${this.apiUrl}/objetos-perdidos-por-laboratorio`, { params });
  }

  getObjetosPerdidosPorEstado(filtros: FiltrosReporte = {}): Observable<ApiResponse<ObjetoEstado[]>> {
    const params = this.buildHttpParams(filtros);
    return this.http.get<ApiResponse<ObjetoEstado[]>>(`${this.apiUrl}/objetos-perdidos-por-estado`, { params });
  }

  exportarCSV(data: any[], filename: string): void {
    if (!data || data.length === 0) {
      console.warn('No hay datos para exportar');
      return;
    }
    const csvContent = this.convertirACSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  private convertirACSV(data: any[]): string {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
    });
    return [csvHeaders, ...csvRows].join('\n');
  }

  // NUEVO MÉTODO PARA DASHBOARD COMPLETO
  getDashboardData(filtros: FiltrosReporte): Observable<{
    incidentesLaboratorio: ApiResponse<IncidenteLaboratorio[]>,
    incidentesEstado: ApiResponse<IncidenteEstado[]>,
    incidentesPeriodo: ApiResponse<IncidentePeriodo[]>,
    incidentesInconveniente: ApiResponse<IncidenteInconveniente[]>,
    objetosLaboratorio: ApiResponse<ObjetoLaboratorio[]>,
    objetosEstado: ApiResponse<ObjetoEstado[]>
  }> {
    return forkJoin({
      incidentesLaboratorio: this.getIncidentesPorLaboratorio(filtros),
      incidentesEstado: this.getIncidentesPorEstado(filtros),
      incidentesPeriodo: this.getIncidentesPorPeriodo(filtros),
      incidentesInconveniente: this.getIncidentesPorInconveniente(filtros),
      objetosLaboratorio: this.getObjetosPerdidosPorLaboratorio(filtros),
      objetosEstado: this.getObjetosPerdidosPorEstado(filtros)
    });
  }
}
