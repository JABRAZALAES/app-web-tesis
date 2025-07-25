import { Injectable } from '@angular/core';
import { Observable, forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ReportesService, FiltrosReporte } from '../../services/reportes.service';

export interface DashboardData {
  incidentesPorLaboratorio: any[];
  incidentesPorEstado: any[];
  incidentesPorPeriodo: any[];
  incidentesPorInconveniente: any[];
  objetosPerdidosPorLaboratorio: any[];
  objetosPerdidosPorEstado: any[];
  rankingUsuarios: any;
  trazabilidadEstados: any;
  trazabilidadCompleta: any[];
  periodosAcademicos: any[];
  laboratorios: any[];
  reporteIncidentes: any[]; // <--- Agregado
  reporteObjetosPerdidos: any[]; // <--- Agregado
}

export interface Metricas {
  totalIncidentes: number;
  incidentesActivos: number;
  incidentesResueltos: number;
  totalObjetos: number;
  objetosEnCustodia: number;
  objetosDevueltos: number;
  laboratoriosActivos: number;
  usuariosActivos: number;
  tiempoPromedioResolucion: number;
  porcentajeResolucion: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardDataService {
  private destroy$ = new Subject<void>();

  // Cache de datos
  private cachedData: DashboardData | null = null;
  private lastFilters: FiltrosReporte | null = null;

  constructor(private reportesService: ReportesService) {}

  // Cargar todos los datos del dashboard
  cargarDashboard(filtros: FiltrosReporte): Observable<DashboardData> {
    return new Observable(observer => {
      console.log('🔄 DashboardDataService: Iniciando carga de datos...');
      console.log('📋 Filtros recibidos:', filtros);

      // Verificar si tenemos datos en cache para los mismos filtros
      if (this.cachedData && this.filtrosIguales(filtros, this.lastFilters)) {
        console.log('💾 Usando datos en cache');
        observer.next(this.cachedData);
        observer.complete();
        return;
      }

      // Limpiar cache si los filtros han cambiado
      if (!this.filtrosIguales(filtros, this.lastFilters)) {
        console.log('🔄 Filtros cambiados, limpiando cache');
        this.limpiarCache();
      }

      console.log('🌐 Realizando llamadas a la API...');

      const requests = [
        this.reportesService.getIncidentesPorLaboratorio(filtros),
        this.reportesService.getIncidentesPorEstado(filtros),
        this.reportesService.getIncidentesPorPeriodo(filtros),
        this.reportesService.getIncidentesPorInconveniente(filtros),
        this.reportesService.getObjetosPerdidosPorLaboratorio(filtros),
        this.reportesService.getObjetosPerdidosPorEstado(filtros),
        this.reportesService.getRankingUsuarios(filtros),
        this.reportesService.getTrazabilidadEstados(filtros),
        this.reportesService.getTrazabilidadGeneral(filtros), // <-- aquí
        this.reportesService.getPeriodosAcademicos(),
        this.reportesService.getReporteIncidentes(filtros),
        this.reportesService.getReporteObjetosPerdidos(filtros)
      ];

      console.log('📡 Número de requests a realizar:', requests.length);

      forkJoin(requests)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (responses) => {
            console.log('✅ Todas las respuestas recibidas:', responses);

            const data: DashboardData = {
              incidentesPorLaboratorio: responses[0]?.data || [],
              incidentesPorEstado: this.calcularPorcentajesIncidentesPorEstado(responses[1]?.data || []),
              incidentesPorPeriodo: responses[2]?.data?.incidentes || [],
              incidentesPorInconveniente: this.calcularPorcentajesIncidentesPorInconveniente(responses[3]?.data || []),
              objetosPerdidosPorLaboratorio: responses[4]?.data || [],
              objetosPerdidosPorEstado: this.calcularPorcentajesObjetosPorEstado(this.completarEstadosObjetos(responses[5]?.data || [])),
              rankingUsuarios: responses[6]?.data || [],
              trazabilidadEstados: responses[7]?.data || [],
              trazabilidadCompleta: responses[8]?.data || [],
              periodosAcademicos: responses[9]?.data || [],
              laboratorios: responses[10]?.data || [],
              reporteIncidentes: responses[11]?.data || [],
              reporteObjetosPerdidos: responses[12]?.data || [] // <--- Agregado
            };

            console.log('📊 Datos procesados:', data);

            // Cachear datos
            this.cachedData = data;
            this.lastFilters = { ...filtros };

            observer.next(data);
            observer.complete();
          },
          error: (error) => {
            console.error('❌ Error en forkJoin:', error);
            console.error('❌ Detalles del error:', {
              message: error.message,
              status: error.status,
              statusText: error.statusText,
              url: error.url
            });
            observer.error(error);
          }
        });
    });
  }

  // Cargar datos de filtros
  cargarDatosFiltros(): Observable<[any[], any]> {
    return new Observable(observer => {
      forkJoin([
        this.reportesService.getPeriodosAcademicos(),
        this.reportesService.getLaboratorios()
      ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([periodosResponse, laboratoriosResponse]) => {
          const periodosAcademicos = periodosResponse?.data || [];
          const laboratorios = laboratoriosResponse?.data || [];
          // Actualizar cache
          if (this.cachedData) {
            this.cachedData.periodosAcademicos = periodosAcademicos;
            this.cachedData.laboratorios = laboratorios;
          }
          observer.next([periodosAcademicos, laboratorios]);
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  // Calcular métricas principales
  calcularMetricas(data: DashboardData): Metricas {
    const metricas: Metricas = {
      totalIncidentes: data.incidentesPorLaboratorio.reduce((sum, item) => sum + (item.total_incidentes || 0), 0),
      incidentesActivos: data.incidentesPorLaboratorio.reduce((sum, item) => sum + (item.incidentes_activos || 0), 0),
      incidentesResueltos: data.incidentesPorLaboratorio.reduce((sum, item) => sum + (item.incidentes_resueltos || 0), 0),
      totalObjetos: data.objetosPerdidosPorLaboratorio.reduce((sum, item) => sum + (item.total_objetos_encontrados || 0), 0),
      objetosEnCustodia: data.objetosPerdidosPorLaboratorio.reduce((sum, item) => sum + (item.objetos_en_custodia || 0), 0),
      objetosDevueltos: data.objetosPerdidosPorLaboratorio.reduce((sum, item) => sum + (item.objetos_devueltos || 0), 0),
      laboratoriosActivos: data.incidentesPorLaboratorio.length,
      usuariosActivos: data.rankingUsuarios.length,
      tiempoPromedioResolucion: 0,
      porcentajeResolucion: 0
    };

    // Calcular porcentaje de resolución
    metricas.porcentajeResolucion = metricas.totalIncidentes > 0
      ? Math.round((metricas.incidentesResueltos / metricas.totalIncidentes) * 100)
      : 0;  

    // Calcular tiempo promedio de resolución
    const tiemposResolucion = data.incidentesPorLaboratorio
      .filter(item => item.tiempo_promedio_resolucion_horas)
      .map(item => item.tiempo_promedio_resolucion_horas);

    metricas.tiempoPromedioResolucion = tiemposResolucion.length > 0
      ? Math.round(tiemposResolucion.reduce((sum, tiempo) => sum + tiempo, 0) / tiemposResolucion.length)
      : 0;

    return metricas;
  }

  // Calcular porcentajes para incidentes por estado
  private calcularPorcentajesIncidentesPorEstado(incidentesPorEstado: any[]): any[] {
    console.log('🔢 Calculando porcentajes para incidentes por estado:', incidentesPorEstado);

    if (!incidentesPorEstado || incidentesPorEstado.length === 0) {
      console.log('⚠️ No hay datos de incidentes por estado');
      return [];
    }

    const totalIncidentes = incidentesPorEstado.reduce((sum, item) => sum + (item.total_incidentes || 0), 0);
    console.log('📊 Total de incidentes:', totalIncidentes);

    const resultado = incidentesPorEstado.map(item => {
      const porcentaje = totalIncidentes > 0 ? ((item.total_incidentes || 0) / totalIncidentes) * 100 : 0;
      console.log(`📈 ${item.estado}: ${item.total_incidentes} incidentes = ${porcentaje.toFixed(1)}%`);
      return {
        ...item,
        porcentaje_total: porcentaje
      };
    });

    console.log('✅ Porcentajes calculados:', resultado);
    return resultado;
  }

  // Calcular porcentajes para incidentes por inconveniente
  private calcularPorcentajesIncidentesPorInconveniente(incidentesPorInconveniente: any[]): any[] {
    if (!incidentesPorInconveniente || incidentesPorInconveniente.length === 0) {
      return [];
    }

    const totalIncidentes = incidentesPorInconveniente.reduce((sum, item) => sum + (item.total_incidentes || 0), 0);

    return incidentesPorInconveniente.map(item => ({
      ...item,
      porcentaje_total: totalIncidentes > 0 ? ((item.total_incidentes || 0) / totalIncidentes) * 100 : 0
    }));
  }

  // Calcular porcentajes para objetos perdidos por estado
  private calcularPorcentajesObjetosPorEstado(objetosPorEstado: any[]): any[] {
    if (!objetosPorEstado || objetosPorEstado.length === 0) {
      return [];
    }

    const totalObjetos = objetosPorEstado.reduce((sum, item) => sum + (item.total_objetos || 0), 0);

    return objetosPorEstado.map(item => ({
      ...item,
      porcentaje_total: totalObjetos > 0 ? ((item.total_objetos || 0) / totalObjetos) * 100 : 0
    }));
  }

  // Completar estados de objetos perdidos
  private completarEstadosObjetos(objetosPorEstado: any[]): any[] {
    const estadosPosibles = ['en custodia', 'devuelto', 'reclamado', 'pendiente'];

    function normalizarEstado(estado: string): string {
      return estado?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    return estadosPosibles.map(estado => {
      const encontrado = objetosPorEstado.find((item: any) => normalizarEstado(item.estado) === estado);
      return encontrado || {
        estado,
        total_objetos: 0,
        porcentaje_total: 0,
        objetos_con_entrega: 0,
        tiempo_promedio_entrega_dias: 0
      };
    });
  }

  // Procesar datos de trazabilidad
  private procesarTrazabilidad(trazabilidadResponse: any): any[] {
    if (trazabilidadResponse?.success && Array.isArray(trazabilidadResponse.data)) {
      return trazabilidadResponse.data;
    } else if (Array.isArray(trazabilidadResponse?.data)) {
      return trazabilidadResponse.data;
    } else {
      return [];
    }
  }

  // Verificar si los filtros son iguales
  private filtrosIguales(filtros1: FiltrosReporte | null, filtros2: FiltrosReporte | null): boolean {
    if (!filtros1 && !filtros2) return true;
    if (!filtros1 || !filtros2) return false;

    const iguales = (
      filtros1.fechaInicio === filtros2.fechaInicio &&
      filtros1.fechaFin === filtros2.fechaFin &&
      filtros1.periodoAcademico === filtros2.periodoAcademico &&
      filtros1.laboratorio === filtros2.laboratorio
    );

    console.log('🔍 Comparando filtros:', { filtros1, filtros2, iguales });
    return iguales;
  }

  // Limpiar cache
  limpiarCache(): void {
    this.cachedData = null;
    this.lastFilters = null;
  }

  // Obtener datos del cache
  obtenerDatosCache(): DashboardData | null {
    return this.cachedData;
  }

  // Métodos de exportación para trazabilidad
  exportarTrazabilidadGeneral(filtros: any): Observable<Blob> {
    // Usar la ruta correcta para exportar trazabilidad general
    return this.reportesService.descargarExcel('trazabilidad', filtros);
  }
  exportarTrazabilidadGeneralPdf(filtros: any): Observable<Blob> {
    return this.reportesService.descargarPDF('trazabilidad', filtros);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
