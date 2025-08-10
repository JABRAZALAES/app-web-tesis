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
  reporteIncidentes: any[];
  reporteObjetosPerdidos: any[];
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
        this.reportesService.getIncidentesPorLaboratorio(filtros),      // 0
        this.reportesService.getIncidentesPorEstado(filtros),          // 1
        this.reportesService.getIncidentesPorPeriodo(filtros),         // 2
        this.reportesService.getIncidentesPorInconveniente(filtros),   // 3
        this.reportesService.getObjetosPerdidosPorLaboratorio(filtros), // 4
        this.reportesService.getObjetosPerdidosPorEstado(filtros),     // 5
        this.reportesService.getRankingUsuarios(filtros),             // 6
        this.reportesService.getTrazabilidadEstados(filtros),         // 7
        this.reportesService.getTrazabilidadGeneral(filtros),         // 8
        this.reportesService.getPeriodosAcademicos(),                 // 9
        this.reportesService.getLaboratorios()                       // 10
      ];

      console.log('📡 Número de requests a realizar:', requests.length);

      forkJoin(requests)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (responses) => {
            console.log('✅ Todas las respuestas recibidas:');
            responses.forEach((response, index) => {
              console.log(`Response ${index}:`, response);
            });

            // CORRECCIÓN: Procesamiento mejorado de respuestas
            const data: DashboardData = {
              incidentesPorLaboratorio: this.extraerData(responses[0]),
              incidentesPorEstado: this.calcularPorcentajesIncidentesPorEstado(this.extraerData(responses[1])),
              incidentesPorPeriodo: this.extraerDataPeriodo(responses[2]),
              incidentesPorInconveniente: this.calcularPorcentajesIncidentesPorInconveniente(this.extraerData(responses[3])),
              objetosPerdidosPorLaboratorio: this.extraerData(responses[4]),
              objetosPerdidosPorEstado: this.calcularPorcentajesObjetosPorEstado(this.completarEstadosObjetos(this.extraerData(responses[5]))),
              rankingUsuarios: this.extraerData(responses[6]),
              trazabilidadEstados: this.extraerData(responses[7]),
              trazabilidadCompleta: this.extraerData(responses[8]),
              periodosAcademicos: this.extraerData(responses[9]),
              laboratorios: this.extraerData(responses[10]),
              reporteIncidentes: [],
              reporteObjetosPerdidos: []
            };

            console.log('📊 Datos procesados:');
            console.log('🏢 Incidentes por laboratorio:', data.incidentesPorLaboratorio);
            console.log('📊 Incidentes por estado:', data.incidentesPorEstado);
            console.log('🔧 Incidentes por inconveniente:', data.incidentesPorInconveniente);
            console.log('📦 Objetos por laboratorio:', data.objetosPerdidosPorLaboratorio);
            console.log('📈 Tendencia (periodo):', data.incidentesPorPeriodo);

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

  // NUEVO: Método para extraer data de las respuestas
  private extraerData(response: any): any[] {
    console.log('🔍 Extrayendo data de response:', response);

    if (!response) {
      console.log('⚠️ Response es null/undefined');
      return [];
    }

    // Si la respuesta tiene la estructura { success: true, data: [...] }
    if (response.success && Array.isArray(response.data)) {
      console.log('✅ Estructura success + data encontrada:', response.data);
      return response.data;
    }

    // Si la respuesta es directamente un array
    if (Array.isArray(response)) {
      console.log('✅ Array directo encontrado:', response);
      return response;
    }

    // Si tiene solo la propiedad data
    if (response.data && Array.isArray(response.data)) {
      console.log('✅ Propiedad data encontrada:', response.data);
      return response.data;
    }

    console.log('⚠️ No se pudo extraer data, devolviendo array vacío');
    return [];
  }

  // NUEVO: Método específico para extraer datos de período
  private extraerDataPeriodo(response: any): any[] {
    console.log('🔍 Extrayendo data de período:', response);

    if (!response) {
      return [];
    }

    // Si tiene estructura anidada con incidentes
    if (response.success && response.data && response.data.incidentes) {
      console.log('✅ Incidentes de período encontrados:', response.data.incidentes);
      return response.data.incidentes;
    }

    // Si tiene la estructura { data: { incidentes: [...] } }
    if (response.data && response.data.incidentes) {
      console.log('✅ Incidentes anidados encontrados:', response.data.incidentes);
      return response.data.incidentes;
    }

    // Fallback a extracción normal
    return this.extraerData(response);
  }

  // Cargar datos de filtros
  cargarDatosFiltros(): Observable<[any[], any[]]> {
    return new Observable(observer => {
      forkJoin([
        this.reportesService.getPeriodosAcademicos(),
        this.reportesService.getLaboratorios()
      ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([periodosResponse, laboratoriosResponse]) => {
          const periodosAcademicos = this.extraerData(periodosResponse);
          const laboratorios = this.extraerData(laboratoriosResponse);

          console.log('📋 Períodos académicos cargados:', periodosAcademicos);
          console.log('🏢 Laboratorios cargados:', laboratorios);

          // Actualizar cache
          if (this.cachedData) {
            this.cachedData.periodosAcademicos = periodosAcademicos;
            this.cachedData.laboratorios = laboratorios;
          }
          observer.next([periodosAcademicos, laboratorios]);
          observer.complete();
        },
        error: (error) => {
          console.error('❌ Error cargando datos de filtros:', error);
          observer.error(error);
        }
      });
    });
  }

  // Calcular métricas principales
  calcularMetricas(data: DashboardData): Metricas {
    console.log('🧮 Calculando métricas con data:', data);

    const metricas: Metricas = {
      totalIncidentes: data.incidentesPorLaboratorio.reduce((sum, item) => sum + (item.total_incidentes || 0), 0),
      incidentesActivos: data.incidentesPorLaboratorio.reduce((sum, item) => sum + (item.incidentes_activos || 0), 0),
      incidentesResueltos: data.incidentesPorLaboratorio.reduce((sum, item) => sum + (item.incidentes_resueltos || 0), 0),
      totalObjetos: data.objetosPerdidosPorLaboratorio.reduce((sum, item) => sum + (item.total_objetos_encontrados || 0), 0),
      objetosEnCustodia: data.objetosPerdidosPorLaboratorio.reduce((sum, item) => sum + (item.objetos_en_custodia || 0), 0),
      objetosDevueltos: data.objetosPerdidosPorLaboratorio.reduce((sum, item) => sum + (item.objetos_devueltos || 0), 0),
      laboratoriosActivos: data.incidentesPorLaboratorio.length,
      usuariosActivos: Array.isArray(data.rankingUsuarios) ? data.rankingUsuarios.length : 0,
      tiempoPromedioResolucion: 0,
      porcentajeResolucion: 0
    };

    // Calcular porcentaje de resolución
    metricas.porcentajeResolucion = metricas.totalIncidentes > 0
      ? Math.round((metricas.incidentesResueltos / metricas.totalIncidentes) * 100)
      : 0;

    // Calcular tiempo promedio de resolución
    const tiemposResolucion = data.incidentesPorLaboratorio
      .filter(item => item.tiempo_promedio_resolucion_horas && item.tiempo_promedio_resolucion_horas !== 'N/A')
      .map(item => Number(item.tiempo_promedio_resolucion_horas));

    metricas.tiempoPromedioResolucion = tiemposResolucion.length > 0
      ? Math.round(tiemposResolucion.reduce((sum, tiempo) => sum + tiempo, 0) / tiemposResolucion.length)
      : 0;

    console.log('📊 Métricas calculadas:', metricas);
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
    console.log('🔢 Calculando porcentajes para incidentes por inconveniente:', incidentesPorInconveniente);

    if (!incidentesPorInconveniente || incidentesPorInconveniente.length === 0) {
      console.log('⚠️ No hay datos de incidentes por inconveniente');
      return [];
    }

    const totalIncidentes = incidentesPorInconveniente.reduce((sum, item) => sum + (item.total_incidentes || 0), 0);
    console.log('📊 Total de incidentes por inconveniente:', totalIncidentes);

    const resultado = incidentesPorInconveniente.map(item => {
      const porcentaje = totalIncidentes > 0 ? ((item.total_incidentes || 0) / totalIncidentes) * 100 : 0;
      return {
        ...item,
        porcentaje_total: porcentaje
      };
    });

    console.log('✅ Porcentajes por inconveniente calculados:', resultado);
    return resultado;
  }

  // Calcular porcentajes para objetos perdidos por estado
  private calcularPorcentajesObjetosPorEstado(objetosPorEstado: any[]): any[] {
    console.log('🔢 Calculando porcentajes para objetos por estado:', objetosPorEstado);

    if (!objetosPorEstado || objetosPorEstado.length === 0) {
      console.log('⚠️ No hay datos de objetos por estado');
      return [];
    }

    const totalObjetos = objetosPorEstado.reduce((sum, item) => sum + (item.total_objetos || 0), 0);
    console.log('📊 Total de objetos:', totalObjetos);

    const resultado = objetosPorEstado.map(item => {
      const porcentaje = totalObjetos > 0 ? ((item.total_objetos || 0) / totalObjetos) * 100 : 0;
      return {
        ...item,
        porcentaje_total: porcentaje
      };
    });

    console.log('✅ Porcentajes de objetos calculados:', resultado);
    return resultado;
  }

  // Completar estados de objetos perdidos
  private completarEstadosObjetos(objetosPorEstado: any[]): any[] {
    const estadosPosibles = ['En Custodia', 'Devuelto', 'Reclamado', 'Pendiente'];

    function normalizarEstado(estado: string): string {
      if (!estado) return '';
      return estado.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
    }

    return estadosPosibles.map(estadoEsperado => {
      const encontrado = objetosPorEstado.find((item: any) => {
        const estadoNormalizado = normalizarEstado(item.estado);
        const esperadoNormalizado = normalizarEstado(estadoEsperado);
        return estadoNormalizado === esperadoNormalizado ||
               estadoNormalizado.includes(esperadoNormalizado) ||
               esperadoNormalizado.includes(estadoNormalizado);
      });

      return encontrado || {
        estado: estadoEsperado,
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
    console.log('🧹 Limpiando cache');
    this.cachedData = null;
    this.lastFilters = null;
  }

  // Obtener datos del cache
  obtenerDatosCache(): DashboardData | null {
    return this.cachedData;
  }

  // Métodos de exportación para trazabilidad
  exportarTrazabilidadGeneral(filtros: any): Observable<Blob> {
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
