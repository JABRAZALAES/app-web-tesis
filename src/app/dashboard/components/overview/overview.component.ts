import { Component, Input, OnInit, OnDestroy, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { Subject } from 'rxjs';
import { DashboardData, Metricas } from '../../services/dashboard-data.service';

Chart.register(...registerables);

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
  standalone: true,
  imports: [CommonModule, NgChartsModule]
})
export class OverviewComponent implements OnInit, OnDestroy, OnChanges {
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

  // Mapeo de estados de la base de datos
  private estadosMap: { [key: string]: string } = {
    'EST_ANULADO': 'Anulado',
    'EST_DEVUELTO': 'Devuelto',
    'EST_EN_CUSTODIA': 'En Custodia',
    'EST_ESCALADO': 'Escalado',
    'EST_MANTENIMIENTO': 'En Mantenimiento',
    'EST_PENDIENTE': 'Pendiente',
    'EST_RECLAMADO': 'Reclamado',
    'EST_RESUELTO': 'Resuelto'
  };

  // Colores específicos por estado
  private estadosColores: { [key: string]: string } = {
    'Pendiente': '#EF4444',      // Rojo
    'Resuelto': '#10B981',       // Verde
    'Anulado': '#6B7280',        // Gris
    'Escalado': '#F59E0B',       // Amarillo
    'En Mantenimiento': '#8B5CF6', // Púrpura
    'Devuelto': '#06B6D4',       // Cyan
    'En Custodia': '#3B82F6',    // Azul
    'Reclamado': '#EC4899'       // Rosa
  };

  // Paleta de colores mejorada para grandes volúmenes
  colorPalette = {
    vibrant: [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#06B6D4', '#EC4899', '#84CC16', '#F97316', '#6366F1',
      '#14B8A6', '#F43F5E', '#8B5A2B', '#7C3AED', '#059669'
    ],
    professional: [
      '#1E40AF', '#047857', '#B45309', '#B91C1C', '#5B21B6',
      '#0E7490', '#BE185D', '#65A30D', '#EA580C', '#4338CA'
    ]
  };

  // Plugin para datos vacíos
  private noDataPlugin = {
    id: 'noData',
    beforeDraw: (chart: any) => {
      if (!chart.data.datasets[0] || chart.data.datasets[0].data.length === 0 ||
          chart.data.datasets[0].data.every((value: number) => value === 0)) {
        const ctx = chart.ctx;
        const width = chart.width;
        const height = chart.height;

        ctx.save();
        ctx.font = 'bold 16px system-ui';
        ctx.fillStyle = '#9CA3AF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('No hay datos disponibles', width / 2, height / 2);
        ctx.restore();
      }
    }
  };

  ngOnInit(): void {
    Chart.register(this.noDataPlugin);
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

  // MÉTODOS DE UTILIDAD
  private limpiarYNormalizarEstado(estado: string): string {
    if (!estado || estado === 'undefined' || estado === 'null') {
      return 'Sin Estado';
    }

    const estadoLimpio = estado.toString().trim().toUpperCase();
    return this.estadosMap[estadoLimpio] || this.capitalizarTexto(estado);
  }

  private capitalizarTexto(texto: string): string {
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
  }

  private filtrarYLimpiarDatos<T extends { [key: string]: any }>(
    datos: T[],
    campo: keyof T
  ): T[] {
    if (!datos || !Array.isArray(datos)) return [];

    return datos
      .filter(item =>
        item &&
        item[campo] !== null &&
        item[campo] !== undefined &&
        item[campo] !== '' &&
        item[campo].toString().trim() !== '' &&
        item[campo].toString().toLowerCase() !== 'undefined'
      )
      .map(item => ({
        ...item,
        [campo]: typeof item[campo] === 'string' && item[campo].startsWith('EST_')
          ? this.limpiarYNormalizarEstado(item[campo])
          : item[campo]
      }));
  }
private baseConfig = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 13,
          family: 'system-ui, -apple-system, sans-serif',
          weight: 500
        },
        color: '#374151'
      }
    },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      titleColor: '#F9FAFB',
      bodyColor: '#F9FAFB',
      cornerRadius: 12,
      padding: 16,
      displayColors: true,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      titleFont: {
        size: 14,
        weight: 700
      },
      bodyFont: {
        size: 13,
        weight: 500
      }
    }
  },
  interaction: {
    intersect: false,
    mode: 'index'
  }
};
  private agruparDatos<T extends { [key: string]: any }>(
    datos: T[],
    campoClave: keyof T,
    campoValor: keyof T
  ): { clave: string, valor: number }[] {
    const agrupados = new Map<string, number>();

    datos.forEach(item => {
      const clave = item[campoClave]?.toString() || 'Sin clasificar';
      const valor = Number(item[campoValor]) || 0;
      agrupados.set(clave, (agrupados.get(clave) || 0) + valor);
    });

    return Array.from(agrupados.entries())
      .map(([clave, valor]) => ({ clave, valor }))
      .sort((a, b) => b.valor - a.valor); // Ordenar por valor descendente
  }

  // PREPARACIÓN DE GRÁFICOS
  prepararGraficos(): void {
    if (!this.data) return;

    console.log('Preparando gráficos mejorados con data:', this.data);

    this.prepararGraficoIncidentesPorLaboratorio();
    this.prepararGraficoIncidentesPorEstado();
    this.prepararGraficoIncidentesPorInconveniente();
    this.prepararGraficoObjetosPorLaboratorio();
    this.prepararGraficoObjetosPorEstado();
    this.prepararGraficoTendencia();
  }

private prepararGraficoIncidentesPorLaboratorio(): void {
  if (!this.data?.incidentesPorLaboratorio) {
    this.incidentesLaboratorioChart = { labels: [], datasets: [] };
    return;
  }

  const datosLimpios = this.filtrarYLimpiarDatos(
    this.data.incidentesPorLaboratorio,
    'laboratorio' // o 'nombre' si ese es el campo correcto
  );

  const datosAgrupados = this.agruparDatos(
    datosLimpios,
    'laboratorio', // o 'nombre'
    'total_incidentes'
  );

  const labels = datosAgrupados.map(item => item.clave);
  const data = datosAgrupados.map(item => Number.isFinite(item.valor) ? item.valor : 0);

  console.log('Incidentes por laboratorio - labels:', labels);
  console.log('Incidentes por laboratorio - data:', data);

  this.incidentesLaboratorioChart = {
    labels,
    datasets: [{
      label: 'Incidentes',
      data,
      backgroundColor: this.colorPalette.vibrant.slice(0, labels.length),
      borderColor: this.colorPalette.professional.slice(0, labels.length),
      borderWidth: 2,
      borderRadius: 6,
      borderSkipped: false,
    }]
  };
}
  private prepararGraficoIncidentesPorEstado(): void {
    if (!this.data?.incidentesPorEstado) {
      this.incidentesEstadoChart = { labels: [], datasets: [] };
      return;
    }

    const datosLimpios = this.filtrarYLimpiarDatos(
      this.data.incidentesPorEstado,
      'estado'
    );

    const datosAgrupados = this.agruparDatos(
      datosLimpios,
      'estado',
      'total_incidentes'
    );

    const colores = datosAgrupados.map(item =>
      this.estadosColores[item.clave] || '#9CA3AF'
    );

    this.incidentesEstadoChart = {
      labels: datosAgrupados.map(item => item.clave),
      datasets: [{
        label: 'Incidentes',
        data: datosAgrupados.map(item => item.valor),
        backgroundColor: colores,
        borderColor: colores.map(color => color + 'CC'),
        borderWidth: 3,
        hoverOffset: 15
      }]
    };
  }

  private prepararGraficoIncidentesPorInconveniente(): void {
    if (!this.data?.incidentesPorInconveniente) {
      this.incidentesInconvenienteChart = { labels: [], datasets: [] };
      return;
    }

    const datosLimpios = this.filtrarYLimpiarDatos(
      this.data.incidentesPorInconveniente,
      'inconveniente'
    );

    const datosAgrupados = this.agruparDatos(
      datosLimpios,
      'inconveniente',
      'total_incidentes'
    );

    this.incidentesInconvenienteChart = {
      labels: datosAgrupados.map(item => item.clave),
      datasets: [{
        label: 'Incidentes',
        data: datosAgrupados.map(item => item.valor),

        backgroundColor: this.colorPalette.vibrant.slice(0, datosAgrupados.length),
        borderColor: this.colorPalette.professional.slice(0, datosAgrupados.length),
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      }]
    };
  }

  private prepararGraficoObjetosPorLaboratorio(): void {
    if (!this.data?.objetosPerdidosPorLaboratorio) {
      this.objetosLaboratorioChart = { labels: [], datasets: [] };
      return;
    }

    const datosLimpios = this.filtrarYLimpiarDatos(
      this.data.objetosPerdidosPorLaboratorio,
      'laboratorio'
    );

    const datosAgrupados = this.agruparDatos(
      datosLimpios,
      'laboratorio',
      'total_objetos_encontrados'
    );

const labels = datosAgrupados.map(item => item.clave);
const data = datosAgrupados.map(item => Number.isFinite(item.valor) ? item.valor : 0);
    this.objetosLaboratorioChart = {
      labels: datosAgrupados.map(item => item.clave),
      datasets: [{
        label: 'Objetos Encontrados',
        data: datosAgrupados.map(item => item.valor),
        backgroundColor: this.colorPalette.vibrant.slice(0, datosAgrupados.length),
        borderColor: this.colorPalette.professional.slice(0, datosAgrupados.length),
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      }]
    };
  }

  private prepararGraficoObjetosPorEstado(): void {
    if (!this.data?.objetosPerdidosPorEstado) {
      this.objetosEstadoChart = { labels: [], datasets: [] };
      return;
    }

    const datosLimpios = this.filtrarYLimpiarDatos(
      this.data.objetosPerdidosPorEstado,
      'estado'
    );

    const datosAgrupados = this.agruparDatos(
      datosLimpios,
      'estado',
      'total_objetos'
    );

    const colores = datosAgrupados.map(item =>
      this.estadosColores[item.clave] || '#9CA3AF'
    );

    this.objetosEstadoChart = {
      labels: datosAgrupados.map(item => item.clave),
      datasets: [{
        label: 'Objetos',
        data: datosAgrupados.map(item => item.valor),
        backgroundColor: colores,
        borderColor: colores.map(color => color + 'CC'),
        borderWidth: 3,
        hoverOffset: 15
      }]
    };
  }

  private prepararGraficoTendencia(): void {
    if (!this.data?.incidentesPorPeriodo) {
      this.tendenciaChart = { labels: [], datasets: [] };
      return;
    }

    const incidentesValidos = this.data.incidentesPorPeriodo.filter(incidente => {
      const fecha = incidente.fecha_reporte || incidente.fecha;
      if (!fecha) return false;
      const fechaObj = new Date(fecha);
      return !isNaN(fechaObj.getTime());
    });

    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const datosPorMes = new Array(12).fill(0);
    const objetosPorMes = new Array(12).fill(0);

    incidentesValidos.forEach(incidente => {
      const fecha = new Date(incidente.fecha_reporte || incidente.fecha);
      const mes = fecha.getMonth();
      if (mes >= 0 && mes < 12) {
        datosPorMes[mes]++;
      }
    });

    // Si hay datos de objetos por periodo, los agregamos
    if (this.data.objetosPerdidosPorLaboratorio) {
      this.data.objetosPerdidosPorLaboratorio.forEach(objeto => {
        const fecha = new Date(objeto.fecha_encontrado || objeto.fecha);
        const mes = fecha.getMonth();
        if (mes >= 0 && mes < 12) {
          objetosPorMes[mes]++;
        }
      });
    }

    this.tendenciaChart = {
      labels: meses,
      datasets: [
        {
          label: 'Incidentes',
          data: datosPorMes,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#3B82F6',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8
        },

      ]
    };
  }

  // MÉTODOS DE UTILIDAD Y FORMATEO
  formatearTiempo(horas: number): string {
    if (!horas || horas === 0) return '0h';

    if (horas < 24) {
      return `${Math.round(horas)}h`;
    } else {
      const dias = Math.floor(horas / 24);
      const horasRestantes = Math.round(horas % 24);
      return horasRestantes > 0 ? `${dias}d ${horasRestantes}h` : `${dias}d`;
    }
  }

  formatearNumero(numero: number): string {
    if (!numero && numero !== 0) return '0';
    return Math.round(numero).toLocaleString('es-ES');
  }

  formatearPorcentaje(porcentaje: number): string {
    if (!porcentaje && porcentaje !== 0) return '0%';
    return Math.round(porcentaje) + '%';
  }

  // CONFIGURACIONES DE GRÁFICAS OPTIMIZADAS

  // Configuración para gráficas de barras horizontales
  public horizontalBarChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: true,
      position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 13,
            family: 'system-ui, -apple-system, sans-serif',
            weight: 500
          },
          color: '#374151'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#F9FAFB',
        bodyColor: '#F9FAFB',
        cornerRadius: 12,
        padding: 16,
        displayColors: true,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13,
          weight: 'normal'
        },
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.x;
            return `${context.dataset.label}: ${value.toLocaleString('es-ES')}`;
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return Number.isInteger(value) ? value.toLocaleString('es-ES') : '';
          },
          font: {
            size: 12,
            weight: 500
          },
          color: '#6B7280'
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.2)'
        }
      },
      y: {
        ticks: {
          font: {
            size: 12,
            weight: 500
          },
          color: '#374151',
          padding: 10
        },
        grid: {
          display: false
        }
      }
    },
    elements: {
      bar: {
        borderRadius: 8,
        borderSkipped: false
      }
    }
  };

  // Configuración para gráficas de dona
  public doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: true,
      position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 25,
          font: {
            size: 13,
            family: 'system-ui, -apple-system, sans-serif',
            weight: 500
          },
          color: '#374151',
          generateLabels: function(chart: any) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              const dataset = data.datasets[0];
              const total = dataset.data.reduce((sum: number, value: number) => sum + value, 0);

              return data.labels.map((label: string, index: number) => {
                const value = dataset.data[index];
                const percentage = ((value / total) * 100).toFixed(1);

                return {
                  text: `${label} (${percentage}%)`,
                  fillStyle: dataset.backgroundColor[index],
                  strokeStyle: dataset.borderColor[index],
                  lineWidth: dataset.borderWidth,
                  hidden: false,
                  index: index
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#F9FAFB',
        bodyColor: '#F9FAFB',
        cornerRadius: 12,
        padding: 16,
        displayColors: true,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13,
          weight: 'normal'
        },
        callbacks: {
          label: function(context: any) {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${value.toLocaleString('es-ES')} (${percentage}%)`;
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    elements: {
      arc: {
        borderWidth: 3,
        hoverBorderWidth: 4
      }
    }
  };

  // Configuración para gráficas de área
 public areaChartOptions: ChartConfiguration['options'] = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value: any) {
          return Number.isInteger(value) ? value.toLocaleString('es-ES') : '';
        },
        font: {
          size: 12,
          weight: 500
        },
        color: '#6B7280'
      },
      grid: {
        color: 'rgba(156, 163, 175, 0.2)'
      }
    },
    x: {
      ticks: {
        font: {
          size: 12,
          weight: 500
        },
        color: '#374151'
      },
      grid: {
        color: 'rgba(156, 163, 175, 0.1)'
      }
    }
  },
  plugins: {
    legend: {
      display: true,
      position: 'top', // <-- literal, no string
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 13,
          family: 'system-ui, -apple-system, sans-serif',
          weight: 500
        },
        color: '#374151'
      }
    },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      titleColor: '#F9FAFB',
      bodyColor: '#F9FAFB',
      cornerRadius: 12,
      padding: 16,
      displayColors: true,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      titleFont: {
        size: 14,
        weight: 700
      },
      bodyFont: {
        size: 13,
        weight: 500
      },
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
      tension: 0.4,
      borderWidth: 3
    },
    point: {
      radius: 5,
      hoverRadius: 8,
      borderWidth: 3,
      hoverBorderWidth: 4
    }
  }
  };
}
