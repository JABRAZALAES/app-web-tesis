import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin, Observable } from 'rxjs';
import { Chart, ChartConfiguration, ChartType } from 'chart.js';
import { BaseChartDirective, NgChartsModule } from 'ng2-charts';
import { registerables } from 'chart.js';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

// Servicios
import { ReportesService, FiltrosReporte } from '../services/reportes.service';
import { PdfExportService } from '../services/pdf-export.service';
import { ExcelExportService } from '../services/excel-exports.service';

// Iconos FontAwesome
import {
  faTachometerAlt,
  faChartBar,
  faDatabase,
  faSignOutAlt,
  faCheckCircle,
  faExclamationTriangle,
  faUser,
  faUserCog,
  faCog,
  faFilter,
  faTimes,
  faThLarge,
  faChartPie,
  faTable,
  faFilePdf,
  faFileExcel,
  faExclamationCircle,
  faClock,
  faSearch,
  faChartLine,
  faBoxOpen,
  faEraser,
  faCalendarDay,
  faCalendarWeek,
  faFlask,
  faDownload,
  faRefresh,
  faEye,
  faEyeSlash,
  faHome,
  faUsers,
  faTools,
  faInfoCircle,
  faPlus,
  faFileAlt,
  faRoute,
  faTrophy,
  faMedal,
  faCrown,
  faStar
} from '@fortawesome/free-solid-svg-icons';

// Registrar todos los componentes de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgChartsModule,
    FontAwesomeModule
  ]
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild(BaseChartDirective) chart!: BaseChartDirective;

  private destroy$ = new Subject<void>();

  // Usuario y estado
  usuario: any = null;
  loading = false;
  error: string | null = null;

  // Formulario de filtros
  filtrosForm: FormGroup;

  // Iconos FontAwesome
      faIcons = {
      dashboard: faTachometerAlt,
      bars: faThLarge,
      reports: faChartBar,
      chartBar: faChartBar,
      data: faDatabase,
      logout: faSignOutAlt,
      check: faCheckCircle,
      warning: faExclamationTriangle,
      exclamationTriangle: faExclamationTriangle,
      exclamationCircle: faExclamationCircle,
      user: faUser,
      userCog: faUserCog,
      settings: faCog,
      filter: faFilter,
      clear: faTimes,
      times: faTimes,
      cards: faThLarge,
      charts: faChartPie,
      table: faTable,
      pdf: faFilePdf,
      excel: faFileExcel,
      alert: faExclamationCircle,
      clock: faClock,
      search: faSearch,
      trend: faChartLine,
      chartLine: faChartLine,
      objects: faBoxOpen,
      boxOpen: faBoxOpen,
      eraser: faEraser,
      calendarDay: faCalendarDay,
      calendarWeek: faCalendarWeek,
      flask: faFlask,
      download: faDownload,
      refresh: faRefresh,
      eye: faEye,
      eyeSlash: faEyeSlash,
      home: faHome,
      users: faUsers,
      tools: faTools,
      info: faInfoCircle,
      plus: faPlus,
      fileAlt: faFileAlt,
      route: faRoute,
      trophy: faTrophy,
      medal: faMedal,
      crown: faCrown,
      star: faStar
    };

  // Estado del sidebar
  sidebarOpen = false;
  submenuOpen = false;

  // Pestañas activas
  activeTab: 'overview' | 'incidents' | 'objects' | 'users' | 'analytics' | 'rankings' | 'trazabilidad' = 'overview';

  // Métricas principales
  metricas = {
    totalIncidentes: 0,
    incidentesActivos: 0,
    incidentesResueltos: 0,
    totalObjetos: 0,
    objetosEnCustodia: 0,
    objetosDevueltos: 0,
    laboratoriosActivos: 0,
    usuariosActivos: 0,
    tiempoPromedioResolucion: 0,
    porcentajeResolucion: 0
  };

  // Datos para gráficos
  incidentesPorLaboratorio: any[] = [];
  incidentesPorEstado: any[] = [];
  incidentesPorPeriodo: any[] = [];
  incidentesPorPeriodoResumen: any[] = [];
  incidentesPorInconveniente: any[] = [];
  objetosPerdidosPorLaboratorio: any[] = [];
  objetosPerdidosPorEstado: any[] = [];
  rankingUsuarios: any[] = [];
  trazabilidadEstados: any[] = [];
  
  // Datos de trazabilidad
  trazabilidadCompleta: any[] = [];
  trazabilidadIncidentes: any[] = [];
  trazabilidadObjetos: any[] = [];
  
  // Datos dinámicos para filtros
  periodosAcademicos: any[] = [];
  laboratorios: any[] = [];
  
  // Datos de rankings
  top10Usuarios: any[] = [];
  loadingRankings = false;
  
  // Consulta específica por ID de usuario
  idUsuarioConsulta: number | null = null;
  trazabilidadIncidenteEspecifico: any[] = [];
  trazabilidadObjetoEspecifico: any[] = [];
  
  // Mensajes de descarga
  mensajeDescarga: string = '';
  descargaExitosa: boolean = false;
  mensajeExito: string = '';

  // Configuración de gráficos
  public barChartType: ChartType = 'bar';
  public pieChartType: ChartType = 'pie';
  public doughnutChartType: ChartType = 'doughnut';
  public lineChartType: ChartType = 'line';

  // Datos de gráficos
  public incidentesLaboratorioChart: ChartConfiguration['data'] = { labels: [], datasets: [] };
  public incidentesEstadoChart: ChartConfiguration['data'] = { labels: [], datasets: [] };
  public objetosLaboratorioChart: ChartConfiguration['data'] = { labels: [], datasets: [] };
  public objetosEstadoChart: ChartConfiguration['data'] = { labels: [], datasets: [] };
  public tendenciaChart: ChartConfiguration['data'] = { labels: [], datasets: [] };
  public rankingChart: ChartConfiguration['data'] = { labels: [], datasets: [] };

  // Opciones de gráficos
  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#374151',
          font: { size: 12 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 14 },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 4
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#374151',
          font: { size: 12 }
        },
        grid: {
          color: '#E5E7EB',
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#374151',
          font: { size: 12 }
        },
        grid: {
          color: '#E5E7EB',
        }
      }
    }
  };

  constructor(
    private router: Router,
    private reportesService: ReportesService,
    private pdfExportService: PdfExportService,
    private excelExportService: ExcelExportService,
    private fb: FormBuilder
  ) {
    this.filtrosForm = this.fb.group({
      fechaInicio: [''],
      fechaFin: [''],
      periodoAcademico: [''],
      laboratorio: ['']
    });
  }

  ngOnInit(): void {
    this.recuperarUsuario();
    this.cargarDatosFiltros();
    this.cargarDashboard();
    this.initializeSidebarState();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Recuperar información del usuario
  recuperarUsuario(): void {
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      this.usuario = JSON.parse(usuarioGuardado);
    }
  }



  // Inicializar estado del sidebar
  private initializeSidebarState(): void {
    if (window.innerWidth >= 1024) {
      this.sidebarOpen = true;
    } else {
      this.sidebarOpen = false;
    }
  }

  // Cargar datos dinámicos para los filtros
  cargarDatosFiltros(): void {
    console.log('Cargando datos dinámicos para filtros...');
    
    // Cargar períodos académicos
    this.reportesService.getPeriodosAcademicos().subscribe({
      next: (response) => {
        console.log('Períodos académicos cargados:', response);
        this.periodosAcademicos = response?.data || [];
      },
      error: (error) => {
        console.error('Error cargando períodos académicos:', error);
        // Si no hay endpoint, intentar extraer de los datos existentes
        this.extraerPeriodosDeDatos();
      }
    });

    // Cargar laboratorios
    this.reportesService.getLaboratorios().subscribe({
      next: (response) => {
        console.log('Laboratorios cargados:', response);
        this.laboratorios = response?.data || [];
      },
      error: (error) => {
        console.error('Error cargando laboratorios:', error);
        // Si no hay endpoint, intentar extraer de los datos existentes
        this.extraerLaboratoriosDeDatos();
      }
    });
  }

  // Extraer períodos académicos de los datos existentes
  extraerPeriodosDeDatos(): void {
    console.log('Extrayendo períodos de datos existentes...');
    const periodosUnicos = new Set<string>();
    
    // Extraer de incidentes por período
    if (this.incidentesPorPeriodo && this.incidentesPorPeriodo.length > 0) {
      this.incidentesPorPeriodo.forEach(item => {
        if (item.periodo_academico) {
          periodosUnicos.add(item.periodo_academico);
        }
      });
    }
    
    // Convertir a array de objetos
    this.periodosAcademicos = Array.from(periodosUnicos).map(periodo => ({
      id: periodo,
      nombre: periodo,
      periodo_academico: periodo
    }));
    
    console.log('Períodos extraídos:', this.periodosAcademicos);
  }

  // Extraer laboratorios de los datos existentes
  extraerLaboratoriosDeDatos(): void {
    console.log('Extrayendo laboratorios de datos existentes...');
    const laboratoriosUnicos = new Set<string>();
    
    // Extraer de incidentes por laboratorio
    if (this.incidentesPorLaboratorio && this.incidentesPorLaboratorio.length > 0) {
      this.incidentesPorLaboratorio.forEach(item => {
        if (item.laboratorio) {
          laboratoriosUnicos.add(item.laboratorio);
        }
      });
    }
    
    // Convertir a array de objetos
    this.laboratorios = Array.from(laboratoriosUnicos).map(lab => ({
      id: lab,
      nombre: lab,
      laboratorio: lab
    }));
    
    console.log('Laboratorios extraídos:', this.laboratorios);
  }

  // Cargar datos del dashboard
  cargarDashboard(): void {
    this.loading = true;
    this.error = null;
    this.mensajeExito = '';

    const filtros: FiltrosReporte = this.filtrosForm.value;
    console.log('Cargando dashboard con filtros:', filtros);
    
    // Validar y limpiar filtros vacíos
    const filtrosLimpios: FiltrosReporte = {};
    if (filtros.fechaInicio) filtrosLimpios.fechaInicio = filtros.fechaInicio;
    if (filtros.fechaFin) filtrosLimpios.fechaFin = filtros.fechaFin;
    if (filtros.periodoAcademico) filtrosLimpios.periodoAcademico = filtros.periodoAcademico;
    if (filtros.laboratorio) filtrosLimpios.laboratorio = filtros.laboratorio;
    
    console.log('Filtros limpios enviados al backend:', filtrosLimpios);

    // Cargar todos los datos en paralelo
    const requests = [
      this.reportesService.getIncidentesPorLaboratorio(filtrosLimpios),
      this.reportesService.getIncidentesPorEstado(filtrosLimpios),
      this.reportesService.getIncidentesPorPeriodo(filtrosLimpios),
      this.reportesService.getIncidentesPorInconveniente(filtrosLimpios),
      this.reportesService.getObjetosPerdidosPorLaboratorio(filtrosLimpios),
      this.reportesService.getObjetosPerdidosPorEstado(filtrosLimpios),
      this.reportesService.getRankingUsuarios(filtrosLimpios),
      this.reportesService.getTrazabilidadEstados(filtrosLimpios),
      this.reportesService.getTrazabilidadCompleta(filtrosLimpios)
    ];

    forkJoin(requests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (responses) => {
          try {
            this.incidentesPorLaboratorio = responses[0]?.data || [];
            this.incidentesPorEstado = responses[1]?.data || [];
            this.incidentesPorPeriodo = responses[2]?.data?.incidentes || [];
            
            // Procesar datos de incidentes por período para crear resumen
            this.procesarIncidentesPorPeriodo();
            
            this.incidentesPorInconveniente = responses[3]?.data || [];
            this.objetosPerdidosPorLaboratorio = responses[4]?.data || [];
            this.objetosPerdidosPorEstado = responses[5]?.data || [];
            this.rankingUsuarios = responses[6]?.data?.ranking_incidentes || [];
            this.trazabilidadEstados = responses[7]?.data || [];
            
            // Manejar respuesta de trazabilidad completa según el formato del backend
            const trazabilidadResponse = responses[8];
            if (trazabilidadResponse?.success && Array.isArray(trazabilidadResponse.data)) {
              this.trazabilidadCompleta = trazabilidadResponse.data;
            } else if (Array.isArray(trazabilidadResponse?.data)) {
              this.trazabilidadCompleta = trazabilidadResponse.data;
            } else {
              this.trazabilidadCompleta = [];
            }

            // Filtrar trazabilidad por tipo - asegurar que sea un array
            if (Array.isArray(this.trazabilidadCompleta)) {
              this.trazabilidadIncidentes = this.trazabilidadCompleta.filter(item => item.tipo_entidad === 'INCIDENTE');
              this.trazabilidadObjetos = this.trazabilidadCompleta.filter(item => item.tipo_entidad === 'OBJETO_PERDIDO');
            } else {
              this.trazabilidadIncidentes = [];
              this.trazabilidadObjetos = [];
            }

            this.calcularMetricas();
            this.prepararGraficos();
            
            // Si no se cargaron los filtros dinámicos, extraer de los datos
            if (this.periodosAcademicos.length === 0) {
              this.extraerPeriodosDeDatos();
            }
            if (this.laboratorios.length === 0) {
              this.extraerLaboratoriosDeDatos();
            }
            
            this.loading = false;
          } catch (error) {
            console.error('Error procesando datos del dashboard:', error);
            this.error = 'Error al procesar los datos del dashboard';
            this.loading = false;
          }
        },
        error: (error) => {
          console.error('Error cargando dashboard:', error);
          console.error('Detalles del error:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            url: error.url
          });
          
          if (error.status === 0) {
            this.error = 'No se puede conectar con el servidor. Verifica que el backend esté ejecutándose.';
          } else if (error.status === 404) {
            this.error = 'Los endpoints del backend no están disponibles. Verifica las rutas del API.';
          } else if (error.status === 500) {
            this.error = 'Error interno del servidor. Revisa los logs del backend.';
          } else if (error.status === 400) {
            this.error = 'Error en los parámetros enviados. Verifica los filtros aplicados.';
          } else {
            this.error = `Error al cargar los datos del dashboard: ${error.message || error.statusText}`;
          }
          this.loading = false;
        }
      });
  }

  // Procesar incidentes por período para crear resumen
  procesarIncidentesPorPeriodo(): void {
    if (!Array.isArray(this.incidentesPorPeriodo)) {
      this.incidentesPorPeriodoResumen = [];
      return;
    }

    // Agrupar por período académico
    const resumenPorPeriodo = new Map<string, any>();

    this.incidentesPorPeriodo.forEach(incidente => {
      const periodo = incidente.periodo_academico || 'Sin Período';
      
      if (!resumenPorPeriodo.has(periodo)) {
        resumenPorPeriodo.set(periodo, {
          periodo_academico: periodo,
          total_incidentes: 0,
          incidentes_activos: 0,
          incidentes_resueltos: 0,
          incidentes_anulados: 0,
          tiempos_resolucion: []
        });
      }

      const resumen = resumenPorPeriodo.get(periodo);
      resumen.total_incidentes++;

      // Contar por estado
      const estado = incidente.estado?.toUpperCase() || '';
      if (estado.includes('PENDIENTE') || estado.includes('ACTIVO')) {
        resumen.incidentes_activos++;
      } else if (estado.includes('RESUELTO') || estado.includes('COMPLETADO')) {
        resumen.incidentes_resueltos++;
      } else if (estado.includes('ANULADO') || estado.includes('CANCELADO')) {
        resumen.incidentes_anulados++;
      }

      // Calcular tiempo de resolución si está disponible
      if (incidente.tiempo_resolucion_horas) {
        resumen.tiempos_resolucion.push(incidente.tiempo_resolucion_horas);
      }
    });

    // Convertir a array y calcular porcentajes y promedios
    this.incidentesPorPeriodoResumen = Array.from(resumenPorPeriodo.values()).map(resumen => {
      const porcentajeResolucion = resumen.total_incidentes > 0 
        ? Math.round((resumen.incidentes_resueltos / resumen.total_incidentes) * 100)
        : 0;

      const tiempoPromedio = resumen.tiempos_resolucion.length > 0
        ? Math.round(resumen.tiempos_resolucion.reduce((sum: number, tiempo: number) => sum + tiempo, 0) / resumen.tiempos_resolucion.length)
        : 0;

      return {
        ...resumen,
        porcentaje_resolucion: porcentajeResolucion,
        tiempo_promedio_resolucion: tiempoPromedio
      };
    });

    // Ordenar por período académico
    this.incidentesPorPeriodoResumen.sort((a, b) => {
      return a.periodo_academico.localeCompare(b.periodo_academico);
    });
  }

  // Calcular métricas principales
  calcularMetricas(): void {
    // Métricas de incidentes
    this.metricas.totalIncidentes = this.incidentesPorLaboratorio.reduce((sum, item) => sum + (item.total_incidentes || 0), 0);
    this.metricas.incidentesActivos = this.incidentesPorLaboratorio.reduce((sum, item) => sum + (item.incidentes_activos || 0), 0);
    this.metricas.incidentesResueltos = this.incidentesPorLaboratorio.reduce((sum, item) => sum + (item.incidentes_resueltos || 0), 0);

    // Métricas de objetos
    this.metricas.totalObjetos = this.objetosPerdidosPorLaboratorio.reduce((sum, item) => sum + (item.total_objetos_encontrados || 0), 0);
    this.metricas.objetosEnCustodia = this.objetosPerdidosPorLaboratorio.reduce((sum, item) => sum + (item.objetos_en_custodia || 0), 0);
    this.metricas.objetosDevueltos = this.objetosPerdidosPorLaboratorio.reduce((sum, item) => sum + (item.objetos_devueltos || 0), 0);

    // Métricas adicionales
    this.metricas.laboratoriosActivos = this.incidentesPorLaboratorio.length;
    this.metricas.usuariosActivos = this.rankingUsuarios.length;

    // Porcentaje de resolución
    this.metricas.porcentajeResolucion = this.metricas.totalIncidentes > 0 
      ? Math.round((this.metricas.incidentesResueltos / this.metricas.totalIncidentes) * 100) 
      : 0;

    // Tiempo promedio de resolución
    const tiemposResolucion = this.incidentesPorLaboratorio
      .filter(item => item.tiempo_promedio_resolucion_horas)
      .map(item => item.tiempo_promedio_resolucion_horas);
    
    this.metricas.tiempoPromedioResolucion = tiemposResolucion.length > 0 
      ? Math.round(tiemposResolucion.reduce((sum, tiempo) => sum + tiempo, 0) / tiemposResolucion.length)
      : 0;
  }

  // Preparar datos para gráficos
  prepararGraficos(): void {
    this.prepararGraficoIncidentesPorLaboratorio();
    this.prepararGraficoIncidentesPorEstado();
    this.prepararGraficoObjetosPorLaboratorio();
    this.prepararGraficoObjetosPorEstado();
    this.prepararGraficoTendencia();
    this.prepararGraficoRanking();
  }

  private prepararGraficoIncidentesPorLaboratorio(): void {
    this.incidentesLaboratorioChart = {
      labels: this.incidentesPorLaboratorio.map(item => item.laboratorio),
      datasets: [
        {
          data: this.incidentesPorLaboratorio.map(item => item.total_incidentes),
          label: 'Total Incidentes',
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          data: this.incidentesPorLaboratorio.map(item => item.incidentes_activos),
          label: 'Activos',
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        },
        {
          data: this.incidentesPorLaboratorio.map(item => item.incidentes_resueltos),
          label: 'Resueltos',
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }
      ]
    };
  }

  private prepararGraficoIncidentesPorEstado(): void {
    this.incidentesEstadoChart = {
      labels: this.incidentesPorEstado.map(item => item.estado),
      datasets: [{
        data: this.incidentesPorEstado.map(item => item.total_incidentes),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
          '#9966FF', '#FF9F40', '#8AC24A', '#FF5722'
        ],
        borderWidth: 2
      }]
    };
  }

  private prepararGraficoObjetosPorLaboratorio(): void {
    this.objetosLaboratorioChart = {
      labels: this.objetosPerdidosPorLaboratorio.map(item => item.laboratorio),
      datasets: [
        {
          data: this.objetosPerdidosPorLaboratorio.map(item => item.total_objetos_encontrados),
          label: 'Total Objetos',
          backgroundColor: 'rgba(255, 159, 64, 0.7)',
          borderColor: 'rgba(255, 159, 64, 1)',
          borderWidth: 1
        },
        {
          data: this.objetosPerdidosPorLaboratorio.map(item => item.objetos_en_custodia),
          label: 'En Custodia',
          backgroundColor: 'rgba(255, 205, 86, 0.7)',
          borderColor: 'rgba(255, 205, 86, 1)',
          borderWidth: 1
        },
        {
          data: this.objetosPerdidosPorLaboratorio.map(item => item.objetos_devueltos),
          label: 'Devueltos',
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }
      ]
    };
  }

  private prepararGraficoObjetosPorEstado(): void {
    this.objetosEstadoChart = {
      labels: this.objetosPerdidosPorEstado.map(item => item.estado),
      datasets: [{
        data: this.objetosPerdidosPorEstado.map(item => item.total_objetos),
        backgroundColor: [
          '#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0',
          '#9966FF', '#FF9F40'
        ],
        borderWidth: 2
      }]
    };
  }

  private prepararGraficoTendencia(): void {
    // Agrupar incidentes por período académico
    const periodosAgrupados = this.incidentesPorPeriodo.reduce((acc, incidente) => {
      const periodo = incidente.periodo_academico;
      if (!acc[periodo]) {
        acc[periodo] = 0;
      }
      acc[periodo]++;
      return acc;
    }, {} as Record<string, number>);

    const periodosOrdenados = Object.keys(periodosAgrupados).sort();
    const datosOrdenados = periodosOrdenados.map(periodo => periodosAgrupados[periodo]);

    this.tendenciaChart = {
      labels: periodosOrdenados,
      datasets: [{
        data: datosOrdenados,
        label: 'Incidentes',
        borderColor: '#4BC0C0',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 3,
        pointBackgroundColor: '#4BC0C0',
        pointBorderColor: '#fff',
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4
      }]
    };
  }

  private prepararGraficoRanking(): void {
    const topUsuarios = this.rankingUsuarios.slice(0, 10);
    
    this.rankingChart = {
      labels: topUsuarios.map(item => item.nombre),
      datasets: [{
        data: topUsuarios.map(item => item.total_incidentes),
        label: 'Incidentes Reportados',
        backgroundColor: 'rgba(153, 102, 255, 0.7)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1
      }]
    };
  }

  // Métodos de navegación
  cambiarTab(tab: 'overview' | 'incidents' | 'objects' | 'users' | 'analytics' | 'rankings' | 'trazabilidad'): void {
    this.activeTab = tab;
    
    // Cargar datos específicos según la pestaña
    if (tab === 'rankings') {
      this.cargarTop10();
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  toggleSubmenu(): void {
    this.submenuOpen = !this.submenuOpen;
  }

  // Métodos de filtros
  aplicarFiltros(): void {
    const filtros = this.filtrosForm.value;
    console.log('Aplicando filtros:', filtros);
    
    // Validar que al menos un filtro esté seleccionado
    const tieneFiltros = filtros.fechaInicio || filtros.fechaFin || filtros.periodoAcademico || filtros.laboratorio;
    
    if (!tieneFiltros) {
      console.log('No hay filtros aplicados, cargando todos los datos');
      this.mensajeExito = 'Cargando todos los datos sin filtros';
    } else {
      console.log('Filtros aplicados:', {
        fechaInicio: filtros.fechaInicio || 'No especificada',
        fechaFin: filtros.fechaFin || 'No especificada',
        periodoAcademico: filtros.periodoAcademico || 'Todos',
        laboratorio: filtros.laboratorio || 'Todos'
      });
      
      // Crear mensaje descriptivo de los filtros aplicados
      const filtrosAplicados = [];
      if (filtros.fechaInicio) filtrosAplicados.push(`Desde: ${filtros.fechaInicio}`);
      if (filtros.fechaFin) filtrosAplicados.push(`Hasta: ${filtros.fechaFin}`);
      if (filtros.periodoAcademico) filtrosAplicados.push(`Período: ${filtros.periodoAcademico}`);
      if (filtros.laboratorio) filtrosAplicados.push(`Laboratorio: ${filtros.laboratorio}`);
      
      this.mensajeExito = `Filtros aplicados: ${filtrosAplicados.join(', ')}`;
    }
    
    this.cargarDashboard();
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset();
    console.log('Filtros limpiados, cargando todos los datos');
    this.mensajeExito = 'Filtros limpiados correctamente';
    this.cargarDashboard();
  }

  limpiarMensajeExito(): void {
    this.mensajeExito = '';
  }

  // Método para probar la conexión con el backend
  probarConexionBackend(): void {
    console.log('Probando conexión con el backend...');
    this.reportesService.testConnection().subscribe({
      next: (response) => {
        console.log('Conexión exitosa con el backend:', response);
        this.mensajeExito = 'Conexión con el backend establecida correctamente';
      },
      error: (error) => {
        console.error('Error de conexión con el backend:', error);
        this.error = `Error de conexión: ${error.message || error.statusText}`;
      }
    });
  }

  // Método para probar los filtros específicamente
  probarFiltros(): void {
    const filtros = this.filtrosForm.value;
    console.log('Probando filtros:', filtros);
    console.log('Períodos académicos disponibles:', this.periodosAcademicos);
    console.log('Laboratorios disponibles:', this.laboratorios);
    
    // Probar con un endpoint simple
    this.reportesService.getIncidentesPorLaboratorio(filtros).subscribe({
      next: (response) => {
        console.log('Respuesta exitosa con filtros:', response);
        this.mensajeExito = `Filtros funcionando correctamente. Datos recibidos: ${response?.data?.length || 0} registros`;
      },
      error: (error) => {
        console.error('Error con filtros:', error);
        this.error = `Error con filtros: ${error.message || error.statusText}`;
      }
    });
  }

  // Método para mostrar información de debugging de filtros
  mostrarInfoFiltros(): void {
    const info = {
      periodosDisponibles: this.periodosAcademicos,
      laboratoriosDisponibles: this.laboratorios,
      filtrosActuales: this.filtrosForm.value
    };
    console.log('Información de filtros:', info);
    this.mensajeExito = `Períodos: ${this.periodosAcademicos.length}, Laboratorios: ${this.laboratorios.length}`;
  }

  // Método para probar endpoints de ranking


  // Cargar top 10 usuarios
  cargarTop10(): void {
    this.loadingRankings = true;
    console.log('Cargando top 10 usuarios...');
    
    this.reportesService.getTop10Usuarios().subscribe({
      next: (response) => {
        console.log('Top 10 cargado exitosamente:', response);
        this.top10Usuarios = response?.data || [];
        this.loadingRankings = false;
        this.error = null;
      },
      error: (error) => {
        console.error('Error cargando top 10:', error);
        this.error = 'No se pudo cargar el ranking de usuarios. Verifica que el backend esté ejecutándose.';
        this.loadingRankings = false;
        this.top10Usuarios = [];
      }
    });
  }

  // Métodos para calcular estadísticas del ranking
  getTotalIncidentesRanking(): number {
    return this.top10Usuarios.reduce((sum, u) => sum + (u.total_actividad || 0), 0);
  }

  getPromedioResolucionRanking(): number {
    if (this.top10Usuarios.length === 0) return 0;
    const total = this.top10Usuarios.reduce((sum, u) => sum + (u.incidentes_creados || 0), 0);
    return Math.round(total / this.top10Usuarios.length);
  }

  // Métodos de exportación
  // ===== MÉTODOS DE EXPORTACIÓN =====

  // Exportar reporte completo del dashboard
  exportarDashboardExcel(): void {
    this.loading = true;
    const filtros: FiltrosReporte = this.filtrosForm.value;
    
    this.excelExportService.exportarReporteCompleto(filtros).subscribe({
      next: (blob) => {
        const nombreArchivo = this.excelExportService.generarNombreArchivo('Dashboard_Completo', 'xlsx');
        this.excelExportService.descargarArchivo(blob, nombreArchivo);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exportando Excel:', error);
        this.error = 'Error al generar el reporte Excel';
        this.loading = false;
      }
    });
  }

  exportarDashboardPDF(): void {
    this.loading = true;
    const filtros: FiltrosReporte = this.filtrosForm.value;
    
    this.pdfExportService.exportarReporteCompleto(filtros).subscribe({
      next: (blob) => {
        const nombreArchivo = this.pdfExportService.generarNombreArchivo('Dashboard_Completo', 'pdf');
        this.pdfExportService.descargarArchivo(blob, nombreArchivo);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exportando PDF:', error);
        this.error = 'Error al generar el reporte PDF';
        this.loading = false;
      }
    });
  }

  // Exportar reportes específicos según la pestaña activa
  exportarReporteEspecificoExcel(): void {
    this.loading = true;
    const filtros: FiltrosReporte = this.filtrosForm.value;
    
    let exportObservable: Observable<Blob>;
    let tipoReporte: string;

    switch (this.activeTab) {
      case 'incidents':
        exportObservable = this.excelExportService.exportarIncidentesPorLaboratorio(filtros);
        tipoReporte = 'Incidentes_Por_Laboratorio';
        break;
      case 'objects':
        exportObservable = this.excelExportService.exportarObjetosPerdidosPorLaboratorio(filtros);
        tipoReporte = 'Objetos_Perdidos_Por_Laboratorio';
        break;
      case 'users':
        exportObservable = this.excelExportService.exportarRankingUsuarios(filtros);
        tipoReporte = 'Ranking_Usuarios';
        break;
      case 'analytics':
        exportObservable = this.excelExportService.exportarReporteCompleto(filtros);
        tipoReporte = 'Analytics_Completo';
        break;
      default:
        exportObservable = this.excelExportService.exportarReporteCompleto(filtros);
        tipoReporte = 'Dashboard_General';
    }

    exportObservable.subscribe({
      next: (blob: Blob) => {
        const nombreArchivo = this.excelExportService.generarNombreArchivo(tipoReporte, 'xlsx');
        this.excelExportService.descargarArchivo(blob, nombreArchivo);
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error exportando Excel específico:', error);
        this.error = 'Error al generar el reporte Excel';
        this.loading = false;
      }
    });
  }

  exportarReporteEspecificoPDF(): void {
    this.loading = true;
    const filtros: FiltrosReporte = this.filtrosForm.value;
    
    let exportObservable: Observable<Blob>;
    let tipoReporte: string;

    switch (this.activeTab) {
      case 'incidents':
        exportObservable = this.pdfExportService.exportarIncidentesPorLaboratorio(filtros);
        tipoReporte = 'Incidentes_Por_Laboratorio';
        break;
      case 'objects':
        exportObservable = this.pdfExportService.exportarObjetosPerdidosPorLaboratorio(filtros);
        tipoReporte = 'Objetos_Perdidos_Por_Laboratorio';
        break;
      case 'users':
        exportObservable = this.pdfExportService.exportarRankingUsuarios(filtros);
        tipoReporte = 'Ranking_Usuarios';
        break;
      case 'analytics':
        exportObservable = this.pdfExportService.exportarReporteCompleto(filtros);
        tipoReporte = 'Analytics_Completo';
        break;
      default:
        exportObservable = this.pdfExportService.exportarReporteCompleto(filtros);
        tipoReporte = 'Dashboard_General';
    }

    exportObservable.subscribe({
      next: (blob: Blob) => {
        const nombreArchivo = this.pdfExportService.generarNombreArchivo(tipoReporte, 'pdf');
        this.pdfExportService.descargarArchivo(blob, nombreArchivo);
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error exportando PDF específico:', error);
        this.error = 'Error al generar el reporte PDF';
        this.loading = false;
      }
    });
  }

  // Exportar reportes adicionales
  exportarIncidentesExcel(): void {
    this.loading = true;
    const filtros: FiltrosReporte = this.filtrosForm.value;
    
    this.excelExportService.exportarIncidentes(filtros).subscribe({
      next: (blob) => {
        const nombreArchivo = this.excelExportService.generarNombreArchivo('Incidentes_Generales', 'xlsx');
        this.excelExportService.descargarArchivo(blob, nombreArchivo);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exportando incidentes Excel:', error);
        this.error = 'Error al generar el reporte de incidentes';
        this.loading = false;
      }
    });
  }

  exportarIncidentesPDF(): void {
    this.loading = true;
    const filtros: FiltrosReporte = this.filtrosForm.value;
    
    this.pdfExportService.exportarIncidentes(filtros).subscribe({
      next: (blob) => {
        const nombreArchivo = this.pdfExportService.generarNombreArchivo('Incidentes_Generales', 'pdf');
        this.pdfExportService.descargarArchivo(blob, nombreArchivo);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exportando incidentes PDF:', error);
        this.error = 'Error al generar el reporte de incidentes';
        this.loading = false;
      }
    });
  }

  exportarObjetosPerdidosExcel(): void {
    this.loading = true;
    const filtros: FiltrosReporte = this.filtrosForm.value;
    
    this.excelExportService.exportarObjetosPerdidos(filtros).subscribe({
      next: (blob) => {
        const nombreArchivo = this.excelExportService.generarNombreArchivo('Objetos_Perdidos_Generales', 'xlsx');
        this.excelExportService.descargarArchivo(blob, nombreArchivo);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exportando objetos perdidos Excel:', error);
        this.error = 'Error al generar el reporte de objetos perdidos';
        this.loading = false;
      }
    });
  }

  exportarObjetosPerdidosPDF(): void {
    this.loading = true;
    const filtros: FiltrosReporte = this.filtrosForm.value;
    
    this.pdfExportService.exportarObjetosPerdidos(filtros).subscribe({
      next: (blob) => {
        const nombreArchivo = this.pdfExportService.generarNombreArchivo('Objetos_Perdidos_Generales', 'pdf');
        this.pdfExportService.descargarArchivo(blob, nombreArchivo);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exportando objetos perdidos PDF:', error);
        this.error = 'Error al generar el reporte de objetos perdidos';
        this.loading = false;
      }
    });
  }

  exportarTrazabilidadExcel(): void {
    this.loading = true;
    const filtros: FiltrosReporte = this.filtrosForm.value;
    
    this.excelExportService.exportarTrazabilidadGeneral(filtros).subscribe({
      next: (blob) => {
        const nombreArchivo = this.excelExportService.generarNombreArchivo('Trazabilidad_General', 'xlsx');
        this.excelExportService.descargarArchivo(blob, nombreArchivo);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exportando trazabilidad Excel:', error);
        this.error = 'Error al generar el reporte de trazabilidad';
        this.loading = false;
      }
    });
  }

  exportarTrazabilidadPDF(): void {
    this.loading = true;
    const filtros: FiltrosReporte = this.filtrosForm.value;
    
    this.pdfExportService.exportarTrazabilidadGeneral(filtros).subscribe({
      next: (blob) => {
        const nombreArchivo = this.pdfExportService.generarNombreArchivo('Trazabilidad_General', 'pdf');
        this.pdfExportService.descargarArchivo(blob, nombreArchivo);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exportando trazabilidad PDF:', error);
        this.error = 'Error al generar el reporte de trazabilidad';
        this.loading = false;
      }
    });
  }

  // Exportar ranking de usuarios
  exportarRankingUsuariosExcel(): void {
    this.loading = true;
    const filtros: FiltrosReporte = this.filtrosForm.value;
    
    this.excelExportService.exportarRankingUsuarios(filtros).subscribe({
      next: (blob) => {
        const nombreArchivo = this.excelExportService.generarNombreArchivo('Ranking_Usuarios', 'xlsx');
        this.excelExportService.descargarArchivo(blob, nombreArchivo);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exportando ranking usuarios Excel:', error);
        this.error = 'Error al generar el reporte de ranking de usuarios';
        this.loading = false;
      }
    });
  }

  exportarRankingUsuariosPDF(): void {
    this.loading = true;
    const filtros: FiltrosReporte = this.filtrosForm.value;
    
    this.pdfExportService.exportarRankingUsuarios(filtros).subscribe({
      next: (blob) => {
        const nombreArchivo = this.pdfExportService.generarNombreArchivo('Ranking_Usuarios', 'pdf');
        this.pdfExportService.descargarArchivo(blob, nombreArchivo);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exportando ranking usuarios PDF:', error);
        this.error = 'Error al generar el reporte de ranking de usuarios';
        this.loading = false;
      }
    });
  }

  // ===== EXPORTACIÓN ESPECÍFICA POR ENDPOINT =====

  // Incidentes por Laboratorio
  exportarIncidentesPorLaboratorioExcel(): void {
    this.loading = true;
    const filtros: FiltrosReporte = this.filtrosForm.value;
    
    this.excelExportService.exportarIncidentesPorLaboratorio(filtros).subscribe({
      next: (blob) => {
        const nombreArchivo = this.excelExportService.generarNombreArchivo('Incidentes_Por_Laboratorio', 'xlsx');
        this.excelExportService.descargarArchivo(blob, nombreArchivo);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exportando incidentes por laboratorio Excel:', error);
        this.error = 'Error al generar el reporte de incidentes por laboratorio';
        this.loading = false;
      }
    });
  }

  exportarIncidentesPorLaboratorioPDF(): void {
    this.loading = true;
    const filtros: FiltrosReporte = this.filtrosForm.value;
    
    this.pdfExportService.exportarIncidentesPorLaboratorio(filtros).subscribe({
      next: (blob) => {
        const nombreArchivo = this.pdfExportService.generarNombreArchivo('Incidentes_Por_Laboratorio', 'pdf');
        this.pdfExportService.descargarArchivo(blob, nombreArchivo);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exportando incidentes por laboratorio PDF:', error);
        this.error = 'Error al generar el reporte de incidentes por laboratorio';
        this.loading = false;
      }
    });
  }

  // Incidentes por Estado
  exportarIncidentesPorEstadoExcel(): void {
    this.loading = true;
    const filtros: FiltrosReporte = this.filtrosForm.value;
    
    this.excelExportService.exportarIncidentesPorEstado(filtros).subscribe({
      next: (blob) => {
        const nombreArchivo = this.excelExportService.generarNombreArchivo('Incidentes_Por_Estado', 'xlsx');
        this.excelExportService.descargarArchivo(blob, nombreArchivo);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exportando incidentes por estado Excel:', error);
        this.error = 'Error al generar el reporte de incidentes por estado';
        this.loading = false;
      }
    });
  }

  exportarIncidentesPorEstadoPDF(): void {
    this.loading = true;
    const filtros: FiltrosReporte = this.filtrosForm.value;
    
    this.pdfExportService.exportarIncidentesPorEstado(filtros).subscribe({
      next: (blob) => {
        const nombreArchivo = this.pdfExportService.generarNombreArchivo('Incidentes_Por_Estado', 'pdf');
        this.pdfExportService.descargarArchivo(blob, nombreArchivo);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exportando incidentes por estado PDF:', error);
        this.error = 'Error al generar el reporte de incidentes por estado';
        this.loading = false;
      }
    });
  }

  // Incidentes por Período
  exportarIncidentesPorPeriodoExcel(): void {
    this.loading = true;
    const filtros: FiltrosReporte = this.filtrosForm.value;
    
    this.excelExportService.exportarIncidentesPorPeriodo(filtros).subscribe({
      next: (blob) => {
        const nombreArchivo = this.excelExportService.generarNombreArchivo('Incidentes_Por_Periodo', 'xlsx');
        this.excelExportService.descargarArchivo(blob, nombreArchivo);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exportando incidentes por período Excel:', error);
        this.error = 'Error al generar el reporte de incidentes por período';
        this.loading = false;
      }
    });
  }

  exportarIncidentesPorPeriodoPDF(): void {
    this.loading = true;
    const filtros: FiltrosReporte = this.filtrosForm.value;
    
    this.pdfExportService.exportarIncidentesPorPeriodo(filtros).subscribe({
      next: (blob) => {
        const nombreArchivo = this.pdfExportService.generarNombreArchivo('Incidentes_Por_Periodo', 'pdf');
        this.pdfExportService.descargarArchivo(blob, nombreArchivo);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exportando incidentes por período PDF:', error);
        this.error = 'Error al generar el reporte de incidentes por período';
        this.loading = false;
      }
    });
  }

  // Incidentes por Inconveniente
  exportarIncidentesPorInconvenienteExcel(): void {
    this.loading = true;
    const filtros: FiltrosReporte = this.filtrosForm.value;
    
    this.excelExportService.exportarIncidentesPorInconveniente(filtros).subscribe({
      next: (blob) => {
        const nombreArchivo = this.excelExportService.generarNombreArchivo('Incidentes_Por_Inconveniente', 'xlsx');
        this.excelExportService.descargarArchivo(blob, nombreArchivo);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exportando incidentes por inconveniente Excel:', error);
        this.error = 'Error al generar el reporte de incidentes por inconveniente';
        this.loading = false;
      }
    });
  }

  exportarIncidentesPorInconvenientePDF(): void {
    this.loading = true;
    const filtros: FiltrosReporte = this.filtrosForm.value;
    
    this.pdfExportService.exportarIncidentesPorInconveniente(filtros).subscribe({
      next: (blob) => {
        const nombreArchivo = this.pdfExportService.generarNombreArchivo('Incidentes_Por_Inconveniente', 'pdf');
        this.pdfExportService.descargarArchivo(blob, nombreArchivo);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exportando incidentes por inconveniente PDF:', error);
        this.error = 'Error al generar el reporte de incidentes por inconveniente';
        this.loading = false;
      }
    });
  }

  // Objetos por Laboratorio
  exportarObjetosPorLaboratorioExcel(): void {
    this.loading = true;
    const filtros: FiltrosReporte = this.filtrosForm.value;
    
    this.excelExportService.exportarObjetosPerdidosPorLaboratorio(filtros).subscribe({
      next: (blob) => {
        const nombreArchivo = this.excelExportService.generarNombreArchivo('Objetos_Por_Laboratorio', 'xlsx');
        this.excelExportService.descargarArchivo(blob, nombreArchivo);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exportando objetos por laboratorio Excel:', error);
        this.error = 'Error al generar el reporte de objetos por laboratorio';
        this.loading = false;
      }
    });
  }

  exportarObjetosPorLaboratorioPDF(): void {
    this.loading = true;
    const filtros: FiltrosReporte = this.filtrosForm.value;
    
    this.pdfExportService.exportarObjetosPerdidosPorLaboratorio(filtros).subscribe({
      next: (blob) => {
        const nombreArchivo = this.pdfExportService.generarNombreArchivo('Objetos_Por_Laboratorio', 'pdf');
        this.pdfExportService.descargarArchivo(blob, nombreArchivo);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exportando objetos por laboratorio PDF:', error);
        this.error = 'Error al generar el reporte de objetos por laboratorio';
        this.loading = false;
      }
    });
  }

  // Objetos por Estado
  exportarObjetosPorEstadoExcel(): void {
    this.loading = true;
    const filtros: FiltrosReporte = this.filtrosForm.value;
    
    this.excelExportService.exportarObjetosPerdidosPorEstado(filtros).subscribe({
      next: (blob) => {
        const nombreArchivo = this.excelExportService.generarNombreArchivo('Objetos_Por_Estado', 'xlsx');
        this.excelExportService.descargarArchivo(blob, nombreArchivo);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exportando objetos por estado Excel:', error);
        this.error = 'Error al generar el reporte de objetos por estado';
        this.loading = false;
      }
    });
  }

  exportarObjetosPorEstadoPDF(): void {
    this.loading = true;
    const filtros: FiltrosReporte = this.filtrosForm.value;
    
    this.pdfExportService.exportarObjetosPerdidosPorEstado(filtros).subscribe({
      next: (blob) => {
        const nombreArchivo = this.pdfExportService.generarNombreArchivo('Objetos_Por_Estado', 'pdf');
        this.pdfExportService.descargarArchivo(blob, nombreArchivo);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exportando objetos por estado PDF:', error);
        this.error = 'Error al generar el reporte de objetos por estado';
        this.loading = false;
      }
    });
  }

  // ===== EXPORTACIÓN DE TRAZABILIDAD =====

  // Trazabilidad Completa
  exportarTrazabilidadCompletaExcel(): void {
    this.loading = true;
    const filtros: FiltrosReporte = this.filtrosForm.value;
    
    this.reportesService.descargarExcel('trazabilidad', filtros).subscribe({
      next: (blob) => {
        const nombreArchivo = this.excelExportService.generarNombreArchivo('Trazabilidad_Completa', 'xlsx');
        this.reportesService.descargarArchivo(blob, nombreArchivo);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exportando trazabilidad completa Excel:', error);
        this.error = 'Error al generar el reporte de trazabilidad completa';
        this.loading = false;
      }
    });
  }

  exportarTrazabilidadCompletaPDF(): void {
    this.loading = true;
    const filtros: FiltrosReporte = this.filtrosForm.value;
    
    this.reportesService.descargarPDF('trazabilidad', filtros).subscribe({
      next: (blob) => {
        const nombreArchivo = this.pdfExportService.generarNombreArchivo('Trazabilidad_Completa', 'pdf');
        this.reportesService.descargarArchivo(blob, nombreArchivo);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exportando trazabilidad completa PDF:', error);
        this.error = 'Error al generar el reporte de trazabilidad completa';
        this.loading = false;
      }
    });
  }

  // Trazabilidad de Incidentes
  exportarTrazabilidadIncidentesExcel(): void {
    this.loading = true;
    const filtros: FiltrosReporte = this.filtrosForm.value;
    
    // Filtrar solo incidentes
    const filtrosIncidentes = { ...filtros, tipo: 'INCIDENTE' };
    
    this.excelExportService.exportarTrazabilidadGeneral(filtrosIncidentes).subscribe({
      next: (blob) => {
        const nombreArchivo = this.excelExportService.generarNombreArchivo('Trazabilidad_Incidentes', 'xlsx');
        this.excelExportService.descargarArchivo(blob, nombreArchivo);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exportando trazabilidad incidentes Excel:', error);
        this.error = 'Error al generar el reporte de trazabilidad de incidentes';
        this.loading = false;
      }
    });
  }

  exportarTrazabilidadIncidentesPDF(): void {
    this.loading = true;
    const filtros: FiltrosReporte = this.filtrosForm.value;
    
    // Filtrar solo incidentes
    const filtrosIncidentes = { ...filtros, tipo: 'INCIDENTE' };
    
    this.pdfExportService.exportarTrazabilidadGeneral(filtrosIncidentes).subscribe({
      next: (blob) => {
        const nombreArchivo = this.pdfExportService.generarNombreArchivo('Trazabilidad_Incidentes', 'pdf');
        this.pdfExportService.descargarArchivo(blob, nombreArchivo);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exportando trazabilidad incidentes PDF:', error);
        this.error = 'Error al generar el reporte de trazabilidad de incidentes';
        this.loading = false;
      }
    });
  }

  // Trazabilidad de Objetos Perdidos
  exportarTrazabilidadObjetosExcel(): void {
    this.loading = true;
    const filtros: FiltrosReporte = this.filtrosForm.value;
    
    // Filtrar solo objetos perdidos
    const filtrosObjetos = { ...filtros, tipo: 'OBJETO_PERDIDO' };
    
    this.excelExportService.exportarTrazabilidadGeneral(filtrosObjetos).subscribe({
      next: (blob) => {
        const nombreArchivo = this.excelExportService.generarNombreArchivo('Trazabilidad_Objetos', 'xlsx');
        this.excelExportService.descargarArchivo(blob, nombreArchivo);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exportando trazabilidad objetos Excel:', error);
        this.error = 'Error al generar el reporte de trazabilidad de objetos';
        this.loading = false;
      }
    });
  }

  exportarTrazabilidadObjetosPDF(): void {
    this.loading = true;
    const filtros: FiltrosReporte = this.filtrosForm.value;
    
    // Filtrar solo objetos perdidos
    const filtrosObjetos = { ...filtros, tipo: 'OBJETO_PERDIDO' };
    
    this.pdfExportService.exportarTrazabilidadGeneral(filtrosObjetos).subscribe({
      next: (blob) => {
        const nombreArchivo = this.pdfExportService.generarNombreArchivo('Trazabilidad_Objetos', 'pdf');
        this.pdfExportService.descargarArchivo(blob, nombreArchivo);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exportando trazabilidad objetos PDF:', error);
        this.error = 'Error al generar el reporte de trazabilidad de objetos';
        this.loading = false;
      }
    });
  }

  // ===== EXPORTACIÓN DE TRAZABILIDAD ESPECÍFICA =====

  // Trazabilidad de Incidente Específico
  exportarTrazabilidadIncidenteEspecificoExcel(id: number): void {
    this.loading = true;
    const filtros: FiltrosReporte = this.filtrosForm.value;
    
    this.reportesService.descargarExcel(`trazabilidad-incidente/${id}`, filtros).subscribe({
      next: (blob) => {
        const nombreArchivo = this.excelExportService.generarNombreArchivo(`Trazabilidad_Incidente_${id}`, 'xlsx');
        this.reportesService.descargarArchivo(blob, nombreArchivo);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exportando trazabilidad incidente específico Excel:', error);
        this.error = 'Error al generar el reporte de trazabilidad del incidente';
        this.loading = false;
      }
    });
  }

  exportarTrazabilidadIncidenteEspecificoPDF(id: number): void {
    this.loading = true;
    const filtros: FiltrosReporte = this.filtrosForm.value;
    
    this.reportesService.descargarPDF(`trazabilidad-incidente/${id}`, filtros).subscribe({
      next: (blob) => {
        const nombreArchivo = this.pdfExportService.generarNombreArchivo(`Trazabilidad_Incidente_${id}`, 'pdf');
        this.reportesService.descargarArchivo(blob, nombreArchivo);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exportando trazabilidad incidente específico PDF:', error);
        this.error = 'Error al generar el reporte de trazabilidad del incidente';
        this.loading = false;
      }
    });
  }

  // Trazabilidad de Objeto Perdido Específico
  exportarTrazabilidadObjetoPerdidoEspecificoExcel(id: number): void {
    this.loading = true;
    const filtros: FiltrosReporte = this.filtrosForm.value;
    
    this.reportesService.descargarExcel(`trazabilidad-objeto-perdido/${id}`, filtros).subscribe({
      next: (blob) => {
        const nombreArchivo = this.excelExportService.generarNombreArchivo(`Trazabilidad_Objeto_${id}`, 'xlsx');
        this.reportesService.descargarArchivo(blob, nombreArchivo);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exportando trazabilidad objeto perdido específico Excel:', error);
        this.error = 'Error al generar el reporte de trazabilidad del objeto perdido';
        this.loading = false;
      }
    });
  }

  exportarTrazabilidadObjetoPerdidoEspecificoPDF(id: number): void {
    this.loading = true;
    const filtros: FiltrosReporte = this.filtrosForm.value;
    
    this.reportesService.descargarPDF(`trazabilidad-objeto-perdido/${id}`, filtros).subscribe({
      next: (blob) => {
        const nombreArchivo = this.pdfExportService.generarNombreArchivo(`Trazabilidad_Objeto_${id}`, 'pdf');
        this.reportesService.descargarArchivo(blob, nombreArchivo);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exportando trazabilidad objeto perdido específico PDF:', error);
        this.error = 'Error al generar el reporte de trazabilidad del objeto perdido';
        this.loading = false;
      }
    });
  }

  // ===== DESCARGA DIRECTA POR ID DE USUARIO =====

  // Descargar trazabilidad por usuario en PDF
  descargarTrazabilidadUsuarioPDF(): void {
    if (!this.idUsuarioConsulta) {
      this.mostrarMensajeDescarga('Por favor ingresa un ID de usuario válido', false);
      return;
    }

    this.loading = true;
    this.error = null;
    const filtros: FiltrosReporte = this.filtrosForm.value;

    // Usar el endpoint correcto de trazabilidad por usuario
    this.reportesService.descargarPDF('trazabilidad-por-usuario', { ...filtros, usuarioId: this.idUsuarioConsulta.toString() })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const nombreArchivo = `Trazabilidad_Usuario_${this.idUsuarioConsulta}_${new Date().toISOString().split('T')[0]}.pdf`;
          this.reportesService.descargarArchivo(blob, nombreArchivo);
          this.mostrarMensajeDescarga(`PDF de trazabilidad del usuario #${this.idUsuarioConsulta} descargado exitosamente`, true);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error descargando trazabilidad por usuario:', error);
          if (error.status === 404) {
            this.mostrarMensajeDescarga(`No se encontró trazabilidad para el usuario #${this.idUsuarioConsulta}`, false);
          } else {
            this.mostrarMensajeDescarga(`Error al descargar la trazabilidad del usuario: ${error.message || error.statusText}`, false);
          }
          this.loading = false;
        }
      });
  }

  // Mostrar mensaje de descarga
  mostrarMensajeDescarga(mensaje: string, exitoso: boolean): void {
    this.mensajeDescarga = mensaje;
    this.descargaExitosa = exitoso;
    
    // Limpiar mensaje después de 5 segundos
    setTimeout(() => {
      this.mensajeDescarga = '';
      this.descargaExitosa = false;
    }, 5000);
  }

  // Limpiar consultas específicas
  limpiarConsultasEspecificas(): void {
    this.idUsuarioConsulta = null;
    this.trazabilidadIncidenteEspecifico = [];
    this.trazabilidadObjetoEspecifico = [];
    this.error = null;
    this.mensajeDescarga = '';
    this.descargaExitosa = false;
  }

  // Métodos de utilidad
  cerrarSesion(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.router.navigate(['/login']);
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatearNumero(numero: number): string {
    return numero.toLocaleString('es-ES');
  }

  formatearPorcentaje(valor: number): string {
    return `${valor}%`;
  }

  formatearTiempo(horas: number): string {
    if (horas < 24) {
      return `${horas}h`;
    } else {
      const dias = Math.floor(horas / 24);
      const horasRestantes = horas % 24;
      return `${dias}d ${horasRestantes}h`;
    }
  }
}