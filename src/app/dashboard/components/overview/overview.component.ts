import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { Subject } from 'rxjs';

import { DashboardData, Metricas } from '../../services/dashboard-data.service';

// Registrar componentes de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
  standalone: true,
  imports: [CommonModule, NgChartsModule]
})
export class OverviewComponent implements OnInit, OnDestroy {
  @Input() data: DashboardData | null = null;
  @Input() metricas: Metricas | null = null;

  private destroy$ = new Subject<void>();



  // Configuración de gráficos
  public barChartType: ChartType = 'bar';
  public pieChartType: ChartType = 'pie';
  public lineChartType: ChartType = 'line';

  // Datos de gráficos
  public incidentesLaboratorioChart: ChartConfiguration['data'] = { labels: [], datasets: [] };
  public incidentesEstadoChart: ChartConfiguration['data'] = { labels: [], datasets: [] };
  public incidentesInconvenienteChart: ChartConfiguration['data'] = { labels: [], datasets: [] };
  public objetosLaboratorioChart: ChartConfiguration['data'] = { labels: [], datasets: [] };
  public objetosEstadoChart: ChartConfiguration['data'] = { labels: [], datasets: [] };
  public tendenciaChart: ChartConfiguration['data'] = { labels: [], datasets: [] };

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
          color: '#E5E5E5'
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#374151',
          font: { size: 12 }
        },
        grid: {
          color: '#E5E5E5'
        }
      }
    }
  };

  ngOnInit(): void {
    if (this.data) {
      this.prepararGraficos();
    }
  }

  ngOnChanges(): void {
    if (this.data) {
      this.prepararGraficos();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  prepararGraficos(): void {
    if (!this.data) return;

    this.prepararGraficoIncidentesPorLaboratorio();
    this.prepararGraficoIncidentesPorEstado();
    this.prepararGraficoIncidentesPorInconveniente();
    this.prepararGraficoObjetosPorLaboratorio();
    this.prepararGraficoObjetosPorEstado();
    this.prepararGraficoTendencia();
  }

  private prepararGraficoIncidentesPorLaboratorio(): void {
    if (!this.data?.incidentesPorLaboratorio) return;

    const labels = this.data.incidentesPorLaboratorio.map(item => item.laboratorio);
    const data = this.data.incidentesPorLaboratorio.map(item => item.total_incidentes);

    this.incidentesLaboratorioChart = {
      labels,
      datasets: [
        {
          data,
          backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#06D6A0', '#F97316', '#EC4899', '#6366F1'],
          borderWidth: 0,
          borderRadius: 4
        }
      ]
    };
  }

  private prepararGraficoIncidentesPorEstado(): void {
    if (!this.data?.incidentesPorEstado) return;

    const labels = this.data.incidentesPorEstado.map(item => item.estado);
    const data = this.data.incidentesPorEstado.map(item => item.total_incidentes);

    this.incidentesEstadoChart = {
      labels,
      datasets: [
        {
          data,
          backgroundColor: ['#EF4444', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'],
          borderWidth: 0
        }
      ]
    };
  }

  private prepararGraficoIncidentesPorInconveniente(): void {
    if (!this.data?.incidentesPorInconveniente) return;

    const labels = this.data.incidentesPorInconveniente.map(item => item.inconveniente);
    const data = this.data.incidentesPorInconveniente.map(item => item.total_incidentes);

    this.incidentesInconvenienteChart = {
      labels,
      datasets: [
        {
          data,
          backgroundColor: ['#F59E0B', '#3B82F6', '#10B981', '#EF4444', '#06D6A0', '#F97316', '#EC4899', '#6366F1'],
          borderWidth: 0,
          borderRadius: 4
        }
      ]
    };
  }

  private prepararGraficoObjetosPorLaboratorio(): void {
    if (!this.data?.objetosPerdidosPorLaboratorio) return;

    const labels = this.data.objetosPerdidosPorLaboratorio.map(item => item.laboratorio);
    const data = this.data.objetosPerdidosPorLaboratorio.map(item => item.total_objetos_encontrados);

    this.objetosLaboratorioChart = {
      labels,
      datasets: [
        {
          data,
          backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#06D6A0', '#F97316', '#EC4899', '#6366F1'],
          borderWidth: 0,
          borderRadius: 4
        }
      ]
    };
  }

  private prepararGraficoObjetosPorEstado(): void {
    if (!this.data?.objetosPerdidosPorEstado) return;

    const labels = this.data.objetosPerdidosPorEstado.map(item => item.estado);
    const data = this.data.objetosPerdidosPorEstado.map(item => item.total_objetos);

    this.objetosEstadoChart = {
      labels,
      datasets: [
        {
          data,
          backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'],
          borderWidth: 0
        }
      ]
    };
  }

  private prepararGraficoTendencia(): void {
    if (!this.data?.incidentesPorPeriodo) return;

    // Agrupar por mes para mostrar tendencia
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const datosPorMes = new Array(12).fill(0);

    this.data.incidentesPorPeriodo.forEach(incidente => {
      const fecha = new Date(incidente.fecha_reporte);
      const mes = fecha.getMonth();
      datosPorMes[mes]++;
    });

    this.tendenciaChart = {
      labels: meses,
      datasets: [
        {
          label: 'Incidentes',
          data: datosPorMes,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }
      ]
    };
  }

  // Métodos de utilidad



  formatearTiempo(horas: number): string {
    if (horas < 24) {
      return `${horas}h`;
    } else {
      const dias = Math.floor(horas / 24);
      const horasRestantes = horas % 24;
      return `${dias}d ${horasRestantes}h`;
    }
  }

  getColorPorEstado(estado: string): string {
    const colores: { [key: string]: string } = {
      'Resuelto': '#10B981',
      'Activo': '#F59E0B',
      'Pendiente': '#EF4444',
      'Devuelto': '#10B981',
      'En Custodia': '#3B82F6',
      'Reclamado': '#8B5CF6'
    };
    return colores[estado] || '#6B7280';
  }
  // Configuraciones mejoradas para las gráficas


  // Configuración base común para todas las gráficas
  baseChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            family: 'system-ui, -apple-system, sans-serif'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        cornerRadius: 8,
        padding: 12,
        displayColors: false
      }
    }
  };

  // Configuración específica para gráficas de barras
  barChartOptions = {
    ...this.baseChartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          // Eliminar decimales y formatear números
          callback: function(value: any) {
            return Number.isInteger(value) ? value.toLocaleString('es-ES') : '';
          },
          font: {
            size: 11
          },
          color: '#6B7280'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        ticks: {
          font: {
            size: 11
          },
          color: '#6B7280',
          maxRotation: 45,
          minRotation: 0
        },
        grid: {
          display: false
        }
      }
    },
    plugins: {
      ...this.baseChartOptions.plugins,
      tooltip: {
        ...this.baseChartOptions.plugins.tooltip,
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y;
            return `${context.dataset.label}: ${value.toLocaleString('es-ES')}`;
          }
        }
      }
    }
  };

  // Configuración específica para gráficas de pie
  pieChartOptions = {
    ...this.baseChartOptions,
    plugins: {
      ...this.baseChartOptions.plugins,
      legend: {
        ...this.baseChartOptions.plugins.legend,
        position: 'right' as const
      },
      tooltip: {
        ...this.baseChartOptions.plugins.tooltip,
        callbacks: {
          label: function(context: any) {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${value.toLocaleString('es-ES')} (${percentage}%)`;
          }
        }
      }
    }
  };

  // Configuración específica para gráficas de línea
  lineChartOptions = {
    ...this.baseChartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return Number.isInteger(value) ? value.toLocaleString('es-ES') : '';
          },
          font: {
            size: 11
          },
          color: '#6B7280'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        ticks: {
          font: {
            size: 11
          },
          color: '#6B7280'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    },
    plugins: {
      ...this.baseChartOptions.plugins,
      tooltip: {
        ...this.baseChartOptions.plugins.tooltip,
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y;
            return `${context.dataset.label}: ${value.toLocaleString('es-ES')}`;
          }
        }
      }
    },
    elements: {
      line: {
        tension: 0.3, // Líneas más suaves
        borderWidth: 3
      },
      point: {
        radius: 4,
        hoverRadius: 6,
        borderWidth: 2
      }
    }
  };

  // Paleta de colores mejorada
  colorPalette = {
    primary: ['#3B82F6', '#1D4ED8', '#2563EB', '#1E40AF', '#1E3A8A'],
    success: ['#10B981', '#059669', '#047857', '#065F46', '#064E3B'],
    warning: ['#F59E0B', '#D97706', '#B45309', '#92400E', '#78350F'],
    danger: ['#EF4444', '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D'],
    purple: ['#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6', '#4C1D95'],
    pink: ['#EC4899', '#DB2777', '#BE185D', '#9D174D', '#831843'],
    mixed: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']
  };

  // Método para aplicar colores automáticamente
  applyColors(data: any[], colorType: keyof typeof this.colorPalette = 'mixed') {
    const colors = this.colorPalette[colorType];
    return data.map((_, index) => colors[index % colors.length]);
  }

  // Ejemplo de configuración de datos mejorada para gráfica de barras
  setupBarChart(labels: string[], data: number[], label: string, colorType: keyof typeof this.colorPalette = 'primary') {
    return {
      labels: labels,
      datasets: [{
        label: label,
        data: data,
        backgroundColor: this.applyColors(data, colorType).map(color => color + '20'), // 20% transparencia
        borderColor: this.applyColors(data, colorType),
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false
      }]
    };
  }

  // Ejemplo de configuración de datos mejorada para gráfica de pie
  setupPieChart(labels: string[], data: number[], label: string) {
    return {
      labels: labels,
      datasets: [{
        label: label,
        data: data,
        backgroundColor: this.applyColors(data, 'mixed').map(color => color + '80'), // 50% transparencia
        borderColor: this.applyColors(data, 'mixed'),
        borderWidth: 2,
        hoverOffset: 10
      }]
    };
  }

  // Ejemplo de configuración de datos mejorada para gráfica de línea
  setupLineChart(labels: string[], datasets: {label: string, data: number[], color: string}[]) {
    return {
      labels: labels,
      datasets: datasets.map(dataset => ({
        label: dataset.label,
        data: dataset.data,
        borderColor: dataset.color,
        backgroundColor: dataset.color + '20',
        fill: true,
        tension: 0.3
      }))
    };
  }

  // Método para formatear números sin decimales
  formatearNumero(numero: number): string {
    return Math.round(numero).toLocaleString('es-ES');
  }

  // Método para formatear porcentajes
  formatearPorcentaje(porcentaje: number): string {
    return Math.round(porcentaje) + '%';
  }
}

// Ejemplo de uso en el template:
/*
En tu template HTML, reemplaza chartOptions por las opciones específicas:

<!-- Para gráficas de barras -->
<canvas baseChart [data]="incidentesLaboratorioChart" [options]="barChartOptions" [type]="barChartType"></canvas>

<!-- Para gráficas de pie -->
<canvas baseChart [data]="incidentesEstadoChart" [options]="pieChartOptions" [type]="pieChartType"></canvas>

<!-- Para gráficas de línea -->
<canvas baseChart [data]="tendenciaChart" [options]="lineChartOptions" [type]="lineChartType"></canvas>
*/

