import { Component, OnInit } from '@angular/core';
import { ChartConfiguration, ChartType } from 'chart.js';
import { finalize } from 'rxjs';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import {
  ReportesService,
  IncidenteLaboratorio,
  IncidenteEstado,
  IncidentePeriodo,
  IncidenteInconveniente,
  ObjetoLaboratorio,
  ObjetoEstado,
  FiltrosReporte
} from '../services/reportes.service';

import { PdfExportService } from '../services/pdf-export.service';
import { ExcelExportService } from '../services/excel-exports.service'

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
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [CommonModule, FormsModule, NgChartsModule, FontAwesomeModule, RouterModule]
})
export class DashboardComponent implements OnInit {
  usuario: any = null;
  // FontAwesome icons
  faIcons = {
    dashboard: faTachometerAlt,
    reports: faChartBar,
    data: faDatabase,
    logout: faSignOutAlt,
    check: faCheckCircle,
    warning: faExclamationTriangle,
    user: faUser,
    userCog: faUserCog,
    settings: faCog,
    filter: faFilter,
    clear: faTimes,
    cards: faThLarge,
    charts: faChartPie,
    table: faTable,
    pdf: faFilePdf,
    excel: faFileExcel,
    alert: faExclamationCircle,
    clock: faClock,
    search: faSearch,
    trend: faChartLine,
    objects: faBoxOpen,

  };
    submenuOpen = false;

  toggleSubmenu() {
    this.submenuOpen = !this.submenuOpen;
  }
scrollToSection(sectionId: string) {
  setTimeout(() => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100); // Espera a que el DOM actualice el *ngIf
}
  // Component state
  loading = false;
  error: string | null = null;
  userDropdownOpen = false;
  activeTab: 'cards' | 'tables' | 'charts' = 'cards';

  // Filters
  filtros: FiltrosReporte = { limite: 100 };

  // Raw data
  incidentesPorLaboratorio: IncidenteLaboratorio[] = [];
  incidentesPorEstado: IncidenteEstado[] = [];
  incidentesPorPeriodo: IncidentePeriodo[] = [];
  incidentesPorInconveniente: IncidenteInconveniente[] = [];
  objetosPerdidosPorLaboratorio: ObjetoLaboratorio[] = [];
  objetosPerdidosPorEstado: ObjetoEstado[] = [];

  // Summary statistics
  estadisticasResumen = {
    totalIncidentes: 0,
    incidentesActivos: 0,
    incidentesResueltos: 0,
    totalObjetosPerdidos: 0,
    objetosEncontrados: 0,
    objetosNoEncontrados: 0,
    laboratorioConMasIncidentes: '',
    inconvenienteMasFrecuente: '',
    periodoConMasIncidentes: ''
  };
sidebarOpen: boolean = true; // Inicialmente abierto
  // Chart colors for dark mode
  private chartTextColor = '#374151'; // Texto oscuro para fondo claro
  private chartGridColor = '#E5E7EB'; // Líneas claras

  // Chart data - 6 gráficos
  public barChartType: ChartType = 'bar';
  public barChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  public barChartOptions: ChartConfiguration['options'] = this.getChartOptions('Incidentes por Laboratorio');

  public pieChartType: ChartType = 'pie';
  public pieChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  public pieChartOptions: ChartConfiguration['options'] = this.getChartOptions('Objetos Perdidos por Laboratorio');

  public estadoChartType: ChartType = 'doughnut';
  public estadoChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  public estadoChartOptions: ChartConfiguration['options'] = this.getChartOptions('Estados de Incidentes');

  public inconvenienteChartType: ChartType = 'pie';
  public inconvenienteChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  public inconvenienteChartOptions: ChartConfiguration['options'] = this.getChartOptions('Tipos de Inconvenientes');

  public objetosEstadoChartType: ChartType = 'doughnut';
  public objetosEstadoChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  public objetosEstadoChartOptions: ChartConfiguration['options'] = this.getChartOptions('Estados de Objetos Perdidos');

  public tendenciaChartType: ChartType = 'line';
  public tendenciaChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  public tendenciaChartOptions: ChartConfiguration['options'] = this.getChartOptions('Tendencia de Incidentes por Período');

  constructor(
    private reportesService: ReportesService,
    private pdfExportService: PdfExportService,
    private excelExportService: ExcelExportService,
    private router: Router
  ) {}

ngOnInit(): void {
  // Recupera el usuario guardado en localStorage
  const usuarioGuardado = localStorage.getItem('usuario');
  if (usuarioGuardado) {
    this.usuario = JSON.parse(usuarioGuardado);
  }
  this.cargarDatos();
}
  exportarExcel(): void {
    this.excelExportService.exportReporteCompleto(
      this.incidentesPorLaboratorio,
      this.incidentesPorEstado,
      this.incidentesPorPeriodo,
      this.incidentesPorInconveniente,
      this.objetosPerdidosPorLaboratorio,
      this.objetosPerdidosPorEstado,
      this.estadisticasResumen,
      this.filtros
    );
  }

   getObjetosEncontradosPorLab(laboratorio: string): number {
    // Primero obtenemos el total de objetos perdidos en este laboratorio
    const totalObjLab = this.objetosPerdidosPorLaboratorio.find(o => o.laboratorio === laboratorio)?.total_objetos_perdidos || 0;

    // Si no hay objetos perdidos en este laboratorio, no hay encontrados
    if (totalObjLab === 0) return 0;

    // Obtenemos el total de objetos encontrados (sin importar laboratorio)
    const encontrados = this.objetosPerdidosPorEstado.find(e => e.estado.toLowerCase().includes('encontrado'))?.total_objetos || 0;

    // Calculamos el porcentaje de objetos encontrados en general
    const totalGlobal = this.objetosPerdidosPorLaboratorio.reduce((sum, item) => sum + item.total_objetos_perdidos, 0);
    const porcentajeEncontrados = totalGlobal > 0 ? (encontrados / totalGlobal) : 0;

    // Estimamos los encontrados para este laboratorio basado en el porcentaje global
    return Math.round(totalObjLab * porcentajeEncontrados);
  }

getPorcentajeObjetosEncontradosPorLab(laboratorio: string): number {
    const total = this.getObjetosPerdidosPorLaboratorio(laboratorio);
    const encontrados = this.getObjetosEncontradosPorLab(laboratorio);
    return total > 0 ? Math.round((encontrados / total) * 100) : 0;
  }
// ...existing code...

exportarTablaExcel(tabla: string) {
  switch (tabla) {
    case 'incidentesLaboratorio':
      this.excelExportService.exportIncidentesPorLaboratorio(this.incidentesPorLaboratorio, this.filtros);
      break;
    case 'incidentesEstado':
      this.excelExportService.exportIncidentesPorEstado(this.incidentesPorEstado, this.filtros);
      break;
    case 'incidentesInconveniente':
      this.excelExportService.exportIncidentesPorInconveniente(this.incidentesPorInconveniente, this.filtros);
      break;
    case 'objetosLaboratorio':
      this.excelExportService.exportObjetosPerdidosPorLaboratorio(this.objetosPerdidosPorLaboratorio, this.filtros);
      break;
    case 'objetosEstado':
      this.excelExportService.exportObjetosPerdidosPorEstado(this.objetosPerdidosPorEstado, this.filtros);
      break;
    case 'incidentesPeriodo':
      this.excelExportService.exportIncidentesPorPeriodo(this.incidentesPorPeriodo, this.filtros);
      break;
  }
}

exportarTablaPDF(tabla: string) {
  switch (tabla) {
    case 'incidentesLaboratorio':
      this.pdfExportService.exportIncidentesPorLaboratorio(this.incidentesPorLaboratorio, this.filtros);
      break;
    case 'incidentesEstado':
      this.pdfExportService.exportIncidentesPorEstado(this.incidentesPorEstado, this.filtros);
      break;
    case 'incidentesInconveniente':
      this.pdfExportService.exportIncidentesPorInconveniente(this.incidentesPorInconveniente, this.filtros);
      break;
    case 'objetosLaboratorio':
      this.pdfExportService.exportObjetosPerdidosPorLaboratorio(this.objetosPerdidosPorLaboratorio, this.filtros);
      break;
    case 'objetosEstado':
      this.pdfExportService.exportObjetosPerdidosPorEstado(this.objetosPerdidosPorEstado, this.filtros);
      break;
    case 'incidentesPeriodo':
      this.pdfExportService.exportIncidentesPorPeriodo(this.incidentesPorPeriodo, this.filtros);
      break;
  }
}
exportarGraficosExcel() {
  this.excelExportService.exportGraficos(
    this.barChartData,
    this.estadoChartData,
    this.pieChartData,
    this.inconvenienteChartData,
    this.objetosEstadoChartData,
    this.tendenciaChartData,
    this.filtros
  );
}

exportarGraficosPDF() {
  this.pdfExportService.exportGraficos(
    this.barChartData,
    this.estadoChartData,
    this.pieChartData,
    this.inconvenienteChartData,
    this.objetosEstadoChartData,
    this.tendenciaChartData,
    this.filtros
  );
}
exportarTablasExcel() {
  this.excelExportService.exportReporteCompleto(
    this.incidentesPorLaboratorio,
    this.incidentesPorEstado,
    this.incidentesPorPeriodo,
    this.incidentesPorInconveniente,
    this.objetosPerdidosPorLaboratorio,
    this.objetosPerdidosPorEstado,
    this.estadisticasResumen,
    this.filtros
  );
}

exportarTablasPDF() {
  this.pdfExportService.exportReporteCompleto(
    this.incidentesPorLaboratorio,
    this.incidentesPorEstado,
    this.incidentesPorPeriodo,
    this.incidentesPorInconveniente,
    this.objetosPerdidosPorLaboratorio,
    this.objetosPerdidosPorEstado,
    this.estadisticasResumen,
    this.filtros
  );
}
// ...existing code...
 getChartOptions(title: string): ChartConfiguration['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: this.chartTextColor,
            font: { size: 12 }
          }
        },
        title: {
          display: !!title,
          text: title,
          color: this.chartTextColor,
          font: { size: 16, weight: 'bold' }
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
            color: this.chartTextColor,
            font: { size: 12 }
          },
          grid: {
            color: this.chartGridColor,
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: this.chartTextColor,
            font: { size: 12 }
          },
          grid: {
            color: this.chartGridColor,
          }
        }
      },
      elements: {
        bar: { borderRadius: 4 },
        line: { tension: 0.4 }
      }
    };
  }

  cargarDatos(): void {
    this.loading = true;
    this.error = null;

    this.reportesService.getDashboardData(this.filtros)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (data) => {
          this.incidentesPorLaboratorio = data.incidentesLaboratorio?.data || [];
          this.incidentesPorEstado = data.incidentesEstado?.data || [];
          this.incidentesPorPeriodo = data.incidentesPeriodo?.data || [];
          this.incidentesPorInconveniente = data.incidentesInconveniente?.data || [];
          this.objetosPerdidosPorLaboratorio = data.objetosLaboratorio?.data || [];
          this.objetosPerdidosPorEstado = data.objetosEstado?.data || [];

          this.calcularEstadisticasResumen();
          this.actualizarGraficos();
        },
        error: (err) => {
          console.error('Error al cargar dashboard:', err);
          this.error = 'No se pudo cargar la información del dashboard. Intente nuevamente más tarde.';
        }
      });
  }

  aplicarFiltros(): void {
    if (this.filtros.fechaInicio && this.filtros.fechaFin) {
      const ini = new Date(this.filtros.fechaInicio);
      const fin = new Date(this.filtros.fechaFin);
      if (ini > fin) {
        this.error = 'La fecha de inicio no puede ser mayor a la fecha final';
        return;
      }
    }
    if (this.filtros.limite && (this.filtros.limite < 1 || this.filtros.limite > 1000)) {
      this.error = 'El límite debe estar entre 1 y 1000 registros';
      return;
    }
    this.error = null;
    this.cargarDatos();
  }

  limpiarFiltros(): void {
    this.filtros = { limite: 100 };
    this.cargarDatos();
  }

  toggleUserDropdown(): void {
    this.userDropdownOpen = !this.userDropdownOpen;
  }

  cerrarSesion(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  actualizarGraficos(): void {
    // Gráfico 1: Incidentes por laboratorio (barras)
    this.barChartData = {
      labels: this.incidentesPorLaboratorio.map(i => i.laboratorio),
      datasets: [{
        data: this.incidentesPorLaboratorio.map(i => i.total_incidentes),
        label: 'Incidentes',
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
        hoverBackgroundColor: 'rgba(54, 162, 235, 0.9)'
      }]
    };

    // Gráfico 2: Objetos perdidos por laboratorio (pie)
    this.pieChartData = {
      labels: this.objetosPerdidosPorLaboratorio.map(o => o.laboratorio),
      datasets: [{
        data: this.objetosPerdidosPorLaboratorio.map(o => o.total_objetos_perdidos),
        label: 'Objetos Perdidos',
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
          '#9966FF', '#FF9F40', '#8AC24A', '#FF5722'
        ],
        borderWidth: 1
      }]
    };

    // Gráfico 3: Estados de incidentes (doughnut)
    this.estadoChartData = {
      labels: this.incidentesPorEstado.map(e => e.estado),
      datasets: [{
        data: this.incidentesPorEstado.map(e => e.total_incidentes),
        label: 'Estados',
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#9966FF',
          '#4BC0C0', '#FF9F40'
        ],
        borderWidth: 1
      }]
    };

    // Gráfico 4: Tipos de inconvenientes (pie)
    this.inconvenienteChartData = {
      labels: this.incidentesPorInconveniente.map(i => i.inconveniente),
      datasets: [{
        data: this.incidentesPorInconveniente.map(i => i.total_incidentes),
        label: 'Inconvenientes',
        backgroundColor: [
          '#4BC0C0', '#FF9F40', '#9966FF', '#8AC24A',
          '#FF5722', '#607D8B'
        ],
        borderWidth: 1
      }]
    };

    // Gráfico 5: Estados de objetos perdidos (doughnut)
    this.objetosEstadoChartData = {
      labels: this.objetosPerdidosPorEstado.map(e => e.estado),
      datasets: [{
        data: this.objetosPerdidosPorEstado.map(e => e.total_objetos),
        label: 'Estados',
        backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56'],
        borderWidth: 1
      }]
    };

    // Gráfico 6: Tendencia de incidentes por período (línea)
    const periodosUnicos = [...new Set(this.incidentesPorPeriodo.map(p => p.periodo_academico))];
    const incidentesPorPeriodo = periodosUnicos.map(periodo => {
      return this.incidentesPorPeriodo
        .filter(p => p.periodo_academico === periodo)
        .length;
    });

    this.tendenciaChartData = {
      labels: periodosUnicos,
      datasets: [{
        data: incidentesPorPeriodo,
        label: 'Incidentes',
        borderColor: '#4BC0C0',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 3,
        pointBackgroundColor: '#4BC0C0',
        pointBorderColor: '#fff',
        pointHoverRadius: 6,
        fill: true
      }]
    };
  }

  calcularEstadisticasResumen(): void {
    this.estadisticasResumen.totalIncidentes = this.incidentesPorLaboratorio.reduce((sum, item) => sum + item.total_incidentes, 0);
    this.estadisticasResumen.incidentesActivos = this.incidentesPorLaboratorio.reduce((sum, item) => sum + item.incidentes_activos, 0);
    this.estadisticasResumen.incidentesResueltos = this.incidentesPorLaboratorio.reduce((sum, item) => sum + item.incidentes_aprobados, 0);
    this.estadisticasResumen.totalObjetosPerdidos = this.objetosPerdidosPorLaboratorio.reduce((sum, item) => sum + item.total_objetos_perdidos, 0);

    // Calcular objetos encontrados vs no encontrados
    const encontrados = this.objetosPerdidosPorEstado.find(e => e.estado.toLowerCase().includes('encontrado'));
    const noEncontrados = this.objetosPerdidosPorEstado.find(e => e.estado.toLowerCase().includes('perdido'));

    this.estadisticasResumen.objetosEncontrados = encontrados ? encontrados.total_objetos : 0;
    this.estadisticasResumen.objetosNoEncontrados = noEncontrados ? noEncontrados.total_objetos : 0;

    // Laboratorio con más incidentes
    const labMax = this.incidentesPorLaboratorio.length
      ? this.incidentesPorLaboratorio.reduce((max, cur) => cur.total_incidentes > max.total_incidentes ? cur : max)
      : { laboratorio: 'N/A' };
    this.estadisticasResumen.laboratorioConMasIncidentes = labMax.laboratorio;

    // Inconveniente más frecuente
    const incMax = this.incidentesPorInconveniente.length
      ? this.incidentesPorInconveniente.reduce((max, cur) => cur.total_incidentes > max.total_incidentes ? cur : max)
      : { inconveniente: 'N/A' };
    this.estadisticasResumen.inconvenienteMasFrecuente = incMax.inconveniente;

    // Período con más incidentes
    if (this.incidentesPorPeriodo.length) {
      const periodosAgrupados = this.incidentesPorPeriodo.reduce((acc, curr) => {
        acc[curr.periodo_academico] = (acc[curr.periodo_academico] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const periodoMax = Object.entries(periodosAgrupados).reduce((max, [periodo, count]) =>
        count > max.count ? { periodo, count } : max,
        { periodo: '', count: 0 }
      );

      this.estadisticasResumen.periodoConMasIncidentes = periodoMax.periodo || 'N/A';
    } else {
      this.estadisticasResumen.periodoConMasIncidentes = 'N/A';
    }
  }

  get laboratoriosUnicos(): string[] {
    return [...new Set(this.incidentesPorLaboratorio.map(i => i.laboratorio))];
  }

  get periodosUnicos(): { id: number, nombre: string }[] {
    return [...new Map(
      this.incidentesPorPeriodo.map(i => [i.periodo_academico_id, {
        id: i.periodo_academico_id,
        nombre: i.periodo_academico
      }])
    ).values()];
  }
    sidebarVisible = true;

  get porcentajeIncidentesResueltos(): number {
    return this.estadisticasResumen.totalIncidentes === 0
      ? 0
      : Math.round((this.estadisticasResumen.incidentesResueltos / this.estadisticasResumen.totalIncidentes) * 100);
  }

  get porcentajeIncidentesActivos(): number {
    return this.estadisticasResumen.totalIncidentes === 0
      ? 0
      : Math.round((this.estadisticasResumen.incidentesActivos / this.estadisticasResumen.totalIncidentes) * 100);
  }

  get porcentajeObjetosEncontrados(): number {
    return this.estadisticasResumen.totalObjetosPerdidos === 0
      ? 0
      : Math.round((this.estadisticasResumen.objetosEncontrados / this.estadisticasResumen.totalObjetosPerdidos) * 100);
  }

  getObjetosPerdidosPorLaboratorio(laboratorio: string): number {
    const obj = this.objetosPerdidosPorLaboratorio.find(o => o.laboratorio === laboratorio);
    return obj ? obj.total_objetos_perdidos : 0;
  }

  datosVacios(): boolean {
    return !this.incidentesPorLaboratorio.length &&
           !this.incidentesPorEstado.length &&
           !this.incidentesPorPeriodo.length &&
           !this.incidentesPorInconveniente.length &&
           !this.objetosPerdidosPorLaboratorio.length &&
           !this.objetosPerdidosPorEstado.length;
  }

  exportarPDF(): void {
    this.pdfExportService.exportDashboardCompleto(
      this.incidentesPorLaboratorio,
      this.objetosPerdidosPorLaboratorio,
      this.estadisticasResumen,
      'Reporte_Dashboard_Completo'
    );
  }

  // Métodos para las tablas
  getTablaIncidentesPorLaboratorio() {
    return this.incidentesPorLaboratorio.map(item => ({
      Laboratorio: item.laboratorio,
      'Total Incidentes': item.total_incidentes,
      'Activos': item.incidentes_activos,
      'Resueltos': item.incidentes_aprobados,
      'Anulados': item.incidentes_anulados
    }));
  }

  getTablaIncidentesPorEstado() {
    return this.incidentesPorEstado.map(item => ({
      Estado: item.estado,
      'Total Incidentes': item.total_incidentes
    }));
  }

  getTablaIncidentesPorInconveniente() {
    return this.incidentesPorInconveniente.map(item => ({
      Inconveniente: item.inconveniente,
      'Total Incidentes': item.total_incidentes
    }));
  }

  getTablaObjetosPerdidosPorLaboratorio() {
    return this.objetosPerdidosPorLaboratorio.map(item => ({
      Laboratorio: item.laboratorio,
      'Objetos Perdidos': item.total_objetos_perdidos
    }));
  }

  getTablaObjetosPerdidosPorEstado() {
    return this.objetosPerdidosPorEstado.map(item => ({
      Estado: item.estado,
      'Total Objetos': item.total_objetos
    }));
  }





    getIncidentesPorPeriodo(periodoNombre: string) {
    return this.incidentesPorPeriodo.filter(i => i.periodo_academico === periodoNombre);
  }
    periodoAbierto: string | null = null;

  togglePeriodo(nombre: string) {
    this.periodoAbierto = this.periodoAbierto === nombre ? null : nombre;
  }

}


