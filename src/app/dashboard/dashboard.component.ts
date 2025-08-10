import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';


// Componentes compartidos
import { FiltersComponent } from './shared/filters/filters.component';
import { DataTableComponent, TableConfig } from './shared/tables/data-table.component';
// Componentes de características
import { OverviewComponent } from './components/overview/overview.component';
import { PodiumRankingComponent } from './components/podium-ranking.component';
import { TrazabilidadBusquedaComponent } from './components/trazabilidad-busqueda.component';
import { GestionLaboratoriosComponent } from './components/gestion-laboratorios.component';
import { GestionUsuariosComponent } from './components/gestion-usuarios/gestion-usuarios.component';


// Servicios
import { DashboardDataService, DashboardData, Metricas } from './services/dashboard-data.service';
import { FiltrosReporte } from '../services/reportes.service';
import { ExcelExportService } from '../services/excel-exports.service';
import { PdfExportService } from '../services/pdf-export.service';
import { environment } from '../../environments/environment';
import { ReportesService } from '../services/reportes.service';
import { AuthService } from '../services/auth.service';
import { ChartConfiguration, ChartType } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';



export type ActiveTab = 'overview' | 'incidents' | 'objects' | 'rankings' | 'trazabilidad' | 'laboratorios' | 'usuarios';



@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,

    FiltersComponent,
    DataTableComponent,
    OverviewComponent,
    NgChartsModule,
    PodiumRankingComponent,
    TrazabilidadBusquedaComponent,
    GestionLaboratoriosComponent,
    GestionUsuariosComponent
  ]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Estado del componente
  activeTab: ActiveTab = 'overview';
  loading = false;
  error: string | null = null;

  // Datos del dashboard
  dashboardData: DashboardData | null = null;
  metricas: Metricas | null = null;
  filtrosActuales: FiltrosReporte = {};
   periodoSeleccionado: string = '';

  // Datos del podio (se vaciará cuando no hay datos)
  top10UsuariosPodio: any[] = [];

  // Pestañas actualizadas (sin usuarios y rankings)

  // Iconos actualizados


  // Datos del usuario
  userProfile: any = {
    nombre: 'Usuario ESPE',
    email: 'usuario@espe.edu.ec',
    rol: 'Administrador'
  };

  // Configuración de tablas (una sola definición por tabla)
  incidentesLaboratorioConfig: TableConfig = {
    columns: [
      { key: 'laboratorio', label: 'Laboratorio', sortable: true },
      { key: 'total_incidentes', label: 'Total', type: 'number', sortable: true },
      { key: 'incidentes_activos', label: 'Activos', type: 'number', sortable: true },
      { key: 'incidentes_resueltos', label: 'Resueltos', type: 'number', sortable: true },
      { key: 'tiempo_promedio_resolucion_horas', label: 'Tiempo Promedio (h)', type: 'number', sortable: true }
    ],
    showPagination: true,
    showExport: true,
    showSearch: true,
    sortable: true
  };
  mostrarPerfil = false;


  incidentesEstadoConfig: TableConfig = {
    columns: [
      { key: 'estado', label: 'Estado', sortable: true },
      { key: 'total_incidentes', label: 'Total', type: 'number', sortable: true },
      { key: 'porcentaje_total', label: '% del Total', type: 'percentage', sortable: true }
    ],
    showPagination: true,
    showExport: true,
    showSearch: true,
    sortable: true
  };

  incidentesPeriodoConfig: TableConfig = {
    columns: [
      { key: 'periodo_academico', label: 'Período Académico', sortable: true },
      { key: 'total_incidentes', label: 'Total', type: 'number', sortable: true },
      { key: 'resueltos', label: 'Resueltos', type: 'number', sortable: true },
      { key: 'activos', label: 'Activos', type: 'number', sortable: true },
      { key: 'porcentaje_resueltos', label: '% Resueltos', type: 'percentage', sortable: true }
    ],
    showPagination: true,
    showExport: true,
    showSearch: true,
    sortable: true
  };

  incidentesInconvenienteConfig: TableConfig = {
    columns: [
      { key: 'inconveniente', label: 'Inconveniente', sortable: true },
      { key: 'tipo_inconveniente', label: 'Tipo', sortable: true },
      { key: 'total_incidentes', label: 'Total', type: 'number', sortable: true },
      { key: 'porcentaje_total', label: '% del Total', type: 'percentage', sortable: true }
    ],
    showPagination: true,
    showExport: true,
    showSearch: true,
    sortable: true
  };

  objetosTableConfig: TableConfig = {
    columns: [
      { key: 'laboratorio', label: 'Laboratorio', sortable: true },
      { key: 'total_objetos_encontrados', label: 'Total Encontrados', type: 'number', sortable: true },
      { key: 'objetos_en_custodia', label: 'En Custodia', type: 'number', sortable: true },
      { key: 'objetos_devueltos', label: 'Devueltos', type: 'number', sortable: true }
    ],
    showPagination: true,
    showExport: true,
    showSearch: true,
    sortable: true
  };

  objetosEstadoConfig: TableConfig = {
    columns: [
      { key: 'estado', label: 'Estado', sortable: true },
      { key: 'total_objetos', label: 'Total', type: 'number', sortable: true },
      { key: 'porcentaje_total', label: '% del Total', type: 'percentage', sortable: true }
    ],
    showPagination: true,
    showExport: true,
    showSearch: true,
    sortable: true
  };



  // Gráfico de ranking de usuarios (top 10 por incidentes)


  constructor(
    private dashboardDataService: DashboardDataService,
    private excelExportService: ExcelExportService,
    private pdfExportService: PdfExportService,
    private reportesService: ReportesService,
    private authService: AuthService,
    private router: Router
  ) {
    this.filtrosActuales = {};
    this.cargarPerfilUsuario();
  }
alertaSesion: any = null;
  ngOnInit(): void {
    console.log('🚀 Dashboard inicializado');
    console.log('🔗 URL de la API:', environment.apiUrl);
    this.cargarDatosIniciales();
    this.iniciarAlertaExpiracionSesion();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

  }


iniciarAlertaExpiracionSesion(): void {
  // Suponiendo que el token dura 1 hora (3600 segundos)
  // Mostramos alerta a los 55 minutos (3300 segundos)
  const tiempoAlerta = 55 * 60 * 1000; // 55 minutos en ms

  if (this.alertaSesion) {
    clearTimeout(this.alertaSesion);
  }
  this.alertaSesion = setTimeout(() => {
    alert('⚠️ Tu sesión está a punto de expirar. Por favor, guarda tu trabajo y vuelve a iniciar sesión si es necesario.');
  }, tiempoAlerta);
}
exportarTrazabilidadGeneralExcel(): void {
  this.loading = true;
  this.reportesService.descargarExcel('trazabilidad-general', this.filtrosActuales).subscribe({
    next: (blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'trazabilidad-general.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
      this.loading = false;
    },
    error: (error: any) => {
      console.error('Error al exportar trazabilidad general:', error);
      this.loading = false;
      alert('Error al descargar el reporte');
    }
  });
}
exportarReporteObjetosPerdidosCompletoExcel(): void {
  this.loading = true;
  this.reportesService.descargarExcel('objetos-perdidos', this.filtrosActuales).subscribe({
    next: (blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'reporte-objetos-perdidos.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
      this.loading = false;
    },
    error: (error: any) => {
      console.error('Error al exportar reporte completo de objetos perdidos:', error);
      this.loading = false;
      alert('Error al descargar el reporte');
    }
  });
}
exportarReporteIncidentesCompletoExcel(): void {
  this.loading = true;
  this.reportesService.descargarExcel('reporteIncidentes', this.filtrosActuales).subscribe({
    next: (blob: Blob) => {
      // Descarga el archivo con un nombre amigable
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'reporte-incidentes-completo.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
      this.loading = false;
    },
    error: (error: any) => {
      console.error('Error al exportar reporte completo de incidentes:', error);
      this.loading = false;
      alert('Error al descargar el reporte');
    }
  });
}





 cargarDatosIniciales(): void {
   console.log('📊 Cargando datos iniciales del dashboard...');
  this.loading = true;
  this.error = null;
  this.top10UsuariosPodio = []; // <-- Vacía el ranking antes de cargar

  this.dashboardDataService.cargarDashboard(this.filtrosActuales)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data: DashboardData) => {
        console.log('✅ Datos del dashboard cargados:', data);
        this.dashboardData = data;
        this.metricas = this.dashboardDataService.calcularMetricas(data);
        this.top10UsuariosPodio = data.rankingUsuarios || [];
        console.log('👑 Ranking que se pasa al podio:', this.top10UsuariosPodio);
        this.loading = false;
      },
      error: (error: any) => {
        console.error('❌ Error al cargar datos del dashboard:', error);
        this.error = `Error al cargar datos: ${error.message}`;
        this.loading = false;
        this.top10UsuariosPodio = [];
      }
    });
  this.dashboardDataService.cargarDashboard(this.filtrosActuales)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data: DashboardData) => {
        console.log('✅ Datos del dashboard cargados:', data);
        this.dashboardData = data;
        this.metricas = this.dashboardDataService.calcularMetricas(data);
                 this.top10UsuariosPodio = data.rankingUsuarios || [];
        console.log('👑 Ranking que se pasa al podio:', this.top10UsuariosPodio); // <-- AGREGA ESTE LOG
        this.loading = false;
      },
      error: (error: any) => {
        console.error('❌ Error al cargar datos del dashboard:', error);
        this.error = `Error al cargar datos: ${error.message}`;
        this.loading = false;
        this.top10UsuariosPodio = [];
      }
    });
}
  onFiltrosAplicados(filtros: FiltrosReporte): void {
    console.log('🔍 Filtros aplicados:', filtros);
    this.filtrosActuales = { ...filtros };
     this.periodoSeleccionado = filtros.periodoAcademico || ''; // <-- Actualiza el período seleccionado
    this.cargarDatosIniciales();


  }


  onFiltrosCambiados(filtros: FiltrosReporte): void {
    console.log('🔄 Filtros cambiados:', filtros);
    this.filtrosActuales = { ...filtros };
  }

  cambiarTab(tab: ActiveTab): void {
    console.log('📑 Cambiando a pestaña:', tab);
    this.activeTab = tab;
  }

// Incidentes por laboratorio PDF
exportarIncidentesPorLaboratorioPdf(): void {
  this.pdfExportService.exportarIncidentesPorLaboratorio(this.filtrosActuales).subscribe({
    next: (blob: Blob) => {
      this.pdfExportService.descargarArchivo(blob, 'incidentes-por-laboratorio.pdf');
    },
    error: (error: any) => {
      console.error('Error al exportar incidentes por laboratorio PDF:', error);
    }
  });
}
// Incidentes por laboratorio EXCEL
exportarIncidentesPorLaboratorioExcel(): void {
  this.excelExportService.exportarIncidentesPorLaboratorio(this.filtrosActuales).subscribe({
    next: (blob: Blob) => {
      this.excelExportService.descargarArchivo(blob, 'incidentes-por-laboratorio.xlsx');
    },
    error: (error: any) => {
      console.error('Error al exportar incidentes por laboratorio Excel:', error);
    }
  });
}


// Incidentes por estado PDF
exportarIncidentesPorEstadoPdf(): void {
  this.pdfExportService.exportarIncidentesPorEstado(this.filtrosActuales).subscribe({
    next: (blob: Blob) => {
      this.pdfExportService.descargarArchivo(blob, 'incidentes-por-estado.pdf');
    },
    error: (error: any) => {
      console.error('Error al exportar incidentes por estado PDF:', error);
    }
  });
}

exportarIncidentesPorEstadoExcel(): void {
  this.excelExportService.exportarIncidentesPorEstado(this.filtrosActuales).subscribe({
    next: (blob: Blob) => {
      this.excelExportService.descargarArchivo(blob, 'incidentes-por-estado.xlsx');
    },
    error: (error: any) => {
      console.error('Error al exportar incidentes por estado Excel:', error);
    }
  });
}
// Incidentes por inconveniente PDF
exportarIncidentesPorInconvenientePdf(): void {
  this.pdfExportService.exportarIncidentesPorInconveniente(this.filtrosActuales).subscribe({
    next: (blob: Blob) => {
      this.pdfExportService.descargarArchivo(blob, 'incidentes-por-inconveniente.pdf');
    },
    error: (error: any) => {
      console.error('Error al exportar incidentes por inconveniente PDF:', error);
    }
  });
}

// Incidentes por inconveniente EXCEL
exportarIncidentesPorInconvenienteExcel(): void {
  this.excelExportService.exportarIncidentesPorInconveniente(this.filtrosActuales).subscribe({
    next: (blob: Blob) => {
      this.excelExportService.descargarArchivo(blob, 'incidentes-por-inconveniente.xlsx');
    },
    error: (error: any) => {
      console.error('Error al exportar incidentes por inconveniente Excel:', error);
    }
  });
}

// Objetos perdidos por laboratorio PDF
exportarObjetosPerdidosPorLaboratorioPdf(): void {
  this.pdfExportService.exportarObjetosPerdidosPorLaboratorio(this.filtrosActuales).subscribe({
    next: (blob: Blob) => {
      this.pdfExportService.descargarArchivo(blob, 'objetos-perdidos-por-laboratorio.pdf');
    },
    error: (error: any) => {
      console.error('Error al exportar objetos perdidos por laboratorio PDF:', error);
    }
  });
}

// Objetos perdidos por laboratorio EXCEL
exportarObjetosPerdidosPorLaboratorioExcel(): void {
  this.excelExportService.exportarObjetosPerdidosPorLaboratorio(this.filtrosActuales).subscribe({
    next: (blob: Blob) => {
      this.excelExportService.descargarArchivo(blob, 'objetos-perdidos-por-laboratorio.xlsx');
    },
    error: (error: any) => {
      console.error('Error al exportar objetos perdidos por laboratorio Excel:', error);
    }
  });
}

// Objetos perdidos por estado PDF
exportarObjetosPerdidosPorEstadoPdf(): void {
  this.pdfExportService.exportarObjetosPerdidosPorEstado(this.filtrosActuales).subscribe({
    next: (blob: Blob) => {
      this.pdfExportService.descargarArchivo(blob, 'objetos-perdidos-por-estado.pdf');
    },
    error: (error: any) => {
      console.error('Error al exportar objetos perdidos por estado PDF:', error);
    }
  });
}

// Objetos perdidos por estado EXCEL
exportarObjetosPerdidosPorEstadoExcel(): void {
  this.excelExportService.exportarObjetosPerdidosPorEstado(this.filtrosActuales).subscribe({
    next: (blob: Blob) => {
      this.excelExportService.descargarArchivo(blob, 'objetos-perdidos-por-estado.xlsx');
    },
    error: (error: any) => {
      console.error('Error al exportar objetos perdidos por estado Excel:', error);
    }
  });
}
  getTabClass(tab: ActiveTab): string {
    return this.isTabActive(tab) ? 'active' : '';
  }

  isTabActive(tab: ActiveTab): boolean {
    return this.activeTab === tab;
  }

  getTabLabel(tab: ActiveTab): string {
    const labels: Record<ActiveTab, string> = {
      overview: 'Resumen',
      incidents: 'Incidentes',
      objects: 'Objetos Perdidos',
      rankings: 'Rankings',
      trazabilidad: 'Trazabilidad',
      laboratorios: 'Gestión de Laboratorios',
      usuarios: 'Gestión de Usuarios'
    };
    return labels[tab];
  }


 // ...existing code...

evidenciaObjetoSeleccionado: any = null;
mostrarModalEvidencia: boolean = false;
objetoIdBusqueda: string = '';


consultarEvidenciaObjetoPerdido(objetoId: string | number): void {
  const id = Number(objetoId);
  if (!id || isNaN(id) || id <= 0) {
    alert('Ingrese un ID válido de objeto perdido');
      return;
    }

  this.loading = true;
  this.reportesService.consultarEvidenciaObjetoPerdido(id).subscribe({
    next: async (resp) => {
      console.log('✅ Evidencia cargada:', resp);
      this.evidenciaObjetoSeleccionado = resp.data;
      this.mostrarModalEvidencia = true;
      this.loading = false;


    },
    error: (err) => {
      console.error('❌ Error al cargar evidencia:', err);
      this.evidenciaObjetoSeleccionado = null;
      this.mostrarModalEvidencia = false;
      this.loading = false;
      alert('No se encontró evidencia para el ID ingresado');
    }
  });
  }
// ...existing code...

  cerrarSesion(): void {
    console.log('🚪 Cerrando sesión...');
    this.authService.logout();
    this.router.navigate(['/login']);
  }


  cargarPerfilUsuario(): void {
    const usuario = this.authService.getCurrentUser();
    if (usuario) {
      this.userProfile = {
        nombre: usuario.nombre || usuario.nombre_usuario || 'Usuario ESPE',
        email: usuario.correo || usuario.email || 'usuario@espe.edu.ec',
        rol: usuario.rol || 'Administrador'
      };
      console.log('👤 Perfil de usuario cargado:', this.userProfile);
    } else {
      console.warn('⚠️ No se encontró información del usuario');
    }
  }

  // Referencia a isNaN para usar en el template
  isNaN = isNaN;

  // Referencia al environment para usar en el template
  environment = environment;

  // Método para formatear fechas de manera legible
  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';

      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  }

  // Método para formatear fechas con hora
  formatDateTime(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';

      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'N/A';
    }
  }

  // Método para formatear horas de manera legible
  formatTime(timeString: string | null | undefined): string {
    if (!timeString) return 'N/A';

    try {
      // Si es solo hora (formato HH:MM:SS)
      if (timeString.includes(':') && !timeString.includes('T')) {
        const [hours, minutes, seconds] = timeString.split(':');
        return `${hours}:${minutes}`;
      }

      // Si es una fecha completa, extraer solo la hora
      const date = new Date(timeString);
      if (isNaN(date.getTime())) return 'N/A';

      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'N/A';
    }
  }
    usuarioSeleccionado: string = '';

  onUsuarioSeleccionado(nombre: string): void {
    this.usuarioSeleccionado = nombre;
  }

  // Descargar trazabilidad por usuario PDF
exportarTrazabilidadPorUsuarioPdf(nombre: string): void {
  if (!nombre || !nombre.trim()) {
    console.error('No se ha seleccionado un usuario para exportar');
    return;
  }
  this.pdfExportService.exportarTrazabilidadPorUsuario(nombre.trim(), this.filtrosActuales).subscribe({
    next: (blob: Blob) => {
      this.pdfExportService.descargarArchivo(blob, `trazabilidad-${nombre}.pdf`);
    },
    error: (error: any) => {
      console.error('Error al exportar trazabilidad por usuario PDF:', error);
    }
  });

}
  // Métodos para manejo de imágenes
  onImageLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    console.log('✅ Imagen cargada correctamente:', img.src);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    console.error('❌ Error al cargar imagen:', img.src);
    // Opcional: establecer una imagen por defecto
    // img.src = 'assets/images/no-image.png';
  }



  // Método para construir la URL completa de la imagen
  getImageUrl(url: string): string {
    if (!url) return '';

    // Si ya es una URL completa, devolverla tal como está
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Si es una URL relativa, construir la URL completa con el servidor
    if (url.startsWith('/')) {
      // Extraer la URL base del servidor desde la URL de la API
      const apiUrl = environment.apiUrl; // http://localhost:3000/api
      const baseUrl = apiUrl.replace('/api', ''); // http://localhost:3000
      return `${baseUrl}${url}`;
    }

    // Si no empieza con /, asumir que es relativa al servidor
    const apiUrl = environment.apiUrl;
    const baseUrl = apiUrl.replace('/api', '');
    return `${baseUrl}/${url}`;
  }

  // Método para ordenar laboratorios del 1 al 6
  ordenarLaboratorios(data: any[]): any[] {
    if (!data || data.length === 0) return data;

    // Mapeo de nombres de laboratorio a números de orden
    const ordenLaboratorios: { [key: string]: number } = {
      'LAB01-DCCO-SS': 1,
      'LAB02-DCCO-SS': 2,
      'LAB03-DCCO-SS': 3,
      'LAB04-DCCO-SS': 4,
      'LAB05-DCCO-SS': 5,
      'LAB06-DCCO-SS': 6
    };

    return data.sort((a, b) => {
      const ordenA = ordenLaboratorios[a.laboratorio] || 999;
      const ordenB = ordenLaboratorios[b.laboratorio] || 999;
      return ordenA - ordenB;
    });
  }
    // ...existing code...

  trackByTab(index: number, tab: any): any {
    return tab;
  }

// ...existing code...

getTabCategory(tab: any): string {
  // Ejemplo simple, ajusta según tu lógica real
  switch (tab) {
    case 'overview': return 'Resumen';
    case 'incidents': return 'Incidentes';
    case 'objects': return 'Objetos Perdidos';
    case 'rankings': return 'Rankings';
    case 'trazabilidad': return 'Trazabilidad';
    case 'laboratorios': return 'Laboratorios';
    case 'usuarios': return 'Usuarios';
    default: return '';
  }
}
  tabs: ActiveTab[] = [
    'overview',
    'incidents',
    'objects',
    'rankings',
    'trazabilidad',
    'laboratorios',
    'usuarios'
  ];

// ...existing code...

}
