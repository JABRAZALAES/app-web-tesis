import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class PdfExportService {

  // Propiedades para almacenar las imágenes en base64
  private logoEspeBase64: string = '';
  private logoSecundarioBase64: string = '';

  constructor() {
    this.loadLogos();
  }

  // Cargar logos desde assets
  private async loadLogos(): Promise<void> {
    try {
      this.logoEspeBase64 = await this.loadImageAsBase64('assets/Logo_ESPE.png');
      this.logoSecundarioBase64 = await this.loadImageAsBase64('assets/logo.png');
    } catch (error) {
      console.warn('Error cargando logos:', error);
    }
  }

  // Convertir imagen desde assets a base64
  private loadImageAsBase64(imagePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = imagePath;
    });
  }

  // Agregar fondo degradado verde y blanco
  private addBackground(doc: jsPDF): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Fondo degradado simulado con rectángulos
    // Parte superior verde claro
    doc.setFillColor(232, 245, 233); // Verde muy claro
    doc.rect(0, 0, pageWidth, pageHeight * 0.15, 'F');

    // Parte media blanco
    doc.setFillColor(255, 255, 255); // Blanco
    doc.rect(0, pageHeight * 0.15, pageWidth, pageHeight * 0.7, 'F');

    // Parte inferior verde suave
    doc.setFillColor(248, 252, 248); // Verde casi blanco
    doc.rect(0, pageHeight * 0.85, pageWidth, pageHeight * 0.15, 'F');

    // Líneas decorativas verdes
    doc.setDrawColor(76, 175, 80); // Verde medio
    doc.setLineWidth(0.5);
    doc.line(0, pageHeight * 0.15, pageWidth, pageHeight * 0.15);
    doc.line(0, pageHeight * 0.85, pageWidth, pageHeight * 0.85);
  }

  // Configuración del encabezado mejorado
  private addHeader(doc: jsPDF, title: string): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;

    // Agregar fondo
    this.addBackground(doc);

    // Logo ESPE en la esquina superior izquierda
    if (this.logoEspeBase64) {
      try {
        doc.addImage(this.logoEspeBase64, 'PNG', 10, 8, 25, 25);
      } catch (error) {
        console.warn('No se pudo agregar el logo ESPE:', error);
      }
    }

    // Logo secundario en la esquina superior derecha
    if (this.logoSecundarioBase64) {
      try {
        doc.addImage(this.logoSecundarioBase64, 'PNG', pageWidth - 35, 8, 25, 25);
      } catch (error) {
        console.warn('No se pudo agregar el logo secundario:', error);
      }
    }

    // Información de la universidad centrada
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(27, 94, 32); // Verde oscuro
    doc.text('UNIVERSIDAD DE LAS FUERZAS ARMADAS', centerX, 16, { align: 'center' });

    doc.setFontSize(16);
    doc.setTextColor(56, 142, 60); // Verde medio
    doc.text('ESPE', centerX, 24, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(76, 175, 80); // Verde claro
    doc.text('INNOVACIÓN PARA LA EXCELENCIA', centerX, 30, { align: 'center' });

    // Línea decorativa con degradado
    doc.setDrawColor(76, 175, 80);
    doc.setLineWidth(1);
    doc.line(40, 38, pageWidth - 40, 38);

    // Línea más delgada debajo
    doc.setLineWidth(0.3);
    doc.line(60, 40, pageWidth - 60, 40);

    // Título del reporte con fondo verde suave
    doc.setFillColor(232, 245, 233); // Verde muy claro
    doc.roundedRect(20, 45, pageWidth - 40, 12, 2, 2, 'F');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(27, 94, 32); // Verde oscuro
    doc.text(title, centerX, 53, { align: 'center' });

    // Fecha y hora de generación
    const now = new Date();
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(102, 102, 102); // Gris
    doc.text(`Generado el: ${now.toLocaleString('es-EC')}`, pageWidth - 15, 62, { align: 'right' });
  }

  // Configuración del pie de página mejorado
  private addFooter(doc: jsPDF): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Línea decorativa en el pie
    doc.setDrawColor(76, 175, 80);
    doc.setLineWidth(0.5);
    doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);

    // Texto del pie de página
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(76, 175, 80);
    doc.text('Sistema de Gestión de Laboratorios - ESPE', pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Número de página - método compatible con todas las versiones
    doc.setTextColor(102, 102, 102);
    const totalPages = doc.getNumberOfPages();
    const currentPage = (doc as any).internal.pageNumber || 1;
    doc.text(`Página ${currentPage} de ${totalPages}`, pageWidth - 15, pageHeight - 10, { align: 'right' });
  }

  // Estilo mejorado para tablas
  private getTableStyles() {
    return {
      theme: 'striped' as const,
      headStyles: {
        fillColor: [56, 142, 60] as [number, number, number], // Verde medio
        textColor: 255,
        fontStyle: 'bold' as const,
        fontSize: 10
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
        lineColor: [200, 200, 200] as [number, number, number],
        lineWidth: 0.1
      },
      alternateRowStyles: {
        fillColor: [248, 252, 248] as [number, number, number] // Verde muy claro
      },
      margin: { top: 10, bottom: 10, left: 15, right: 15 }
    };
  }

  // Exportar incidentes por laboratorio
  exportIncidentesPorLaboratorio(data: any[], filtros: any = {}): void {
    const doc = new jsPDF();

    this.addHeader(doc, 'REPORTE DE INCIDENTES POR LABORATORIO');

    // Información de filtros aplicados
    let yPosition = 70;
    if (Object.keys(filtros).length > 0) {
      yPosition = this.addFiltrosInfo(doc, filtros, yPosition);
    }

    // Tabla de datos
    const tableData = data.map(item => [
      item.laboratorio,
      item.total_incidentes.toString(),
      item.incidentes_activos.toString(),
      item.incidentes_aprobados.toString(),
      item.incidentes_anulados.toString(),
      item.incidentes_escalados.toString()
    ]);

    const tableStyles = this.getTableStyles();
    autoTable(doc, {
      startY: yPosition,
      head: [['Laboratorio', 'Total', 'Activos', 'Aprobados', 'Anulados', 'Escalados']],
      body: tableData,
      ...tableStyles
    });

    this.addFooter(doc);

    const fileName = `incidentes_por_laboratorio_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  // Exportar incidentes por estado
  exportIncidentesPorEstado(data: any[], filtros: any = {}): void {
    const doc = new jsPDF();

    this.addHeader(doc, 'REPORTE DE INCIDENTES POR ESTADO');

    let yPosition = 70;
    if (Object.keys(filtros).length > 0) {
      yPosition = this.addFiltrosInfo(doc, filtros, yPosition);
    }

    const tableData = data.map(item => [
      item.estado,
      item.total_incidentes.toString(),
      ((item.total_incidentes / data.reduce((sum, i) => sum + i.total_incidentes, 0)) * 100).toFixed(1) + '%'
    ]);

    const tableStyles = this.getTableStyles();
    autoTable(doc, {
      startY: yPosition,
      head: [['Estado', 'Total Incidentes', 'Porcentaje']],
      body: tableData,
      ...tableStyles
    });

    this.addFooter(doc);

    const fileName = `incidentes_por_estado_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  // Exportar incidentes por período
  exportIncidentesPorPeriodo(data: any[], filtros: any = {}): void {
    const doc = new jsPDF();

    this.addHeader(doc, 'REPORTE DETALLADO DE INCIDENTES POR PERÍODO');

    let yPosition = 70;
    if (Object.keys(filtros).length > 0) {
      yPosition = this.addFiltrosInfo(doc, filtros, yPosition);
    }

    const tableData = data.map(item => [
      item.codigo,
      new Date(item.fecha_reporte).toLocaleDateString('es-EC'),
      item.descripcion.length > 45 ? item.descripcion.substring(0, 45) + '...' : item.descripcion,
      item.laboratorio_id,
      item.estadoId,
      item.periodo_academico,
      item.fecha_resolucion ? new Date(item.fecha_resolucion).toLocaleDateString('es-EC') : 'Pendiente'
    ]);

    const tableStyles = this.getTableStyles();
    autoTable(doc, {
      startY: yPosition,
      head: [['Código', 'Fecha Reporte', 'Descripción', 'Lab.', 'Estado', 'Período', 'F. Resolución']],
      body: tableData,
      ...tableStyles,
      columnStyles: {
        2: { cellWidth: 50 } // Descripción más ancha
      }
    });

    this.addFooter(doc);

    const fileName = `incidentes_por_periodo_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  // Exportar incidentes por inconveniente
  exportIncidentesPorInconveniente(data: any[], filtros: any = {}): void {
    const doc = new jsPDF();

    this.addHeader(doc, 'REPORTE DE INCIDENTES POR TIPO DE INCONVENIENTE');

    let yPosition = 70;
    if (Object.keys(filtros).length > 0) {
      yPosition = this.addFiltrosInfo(doc, filtros, yPosition);
    }

    const totalIncidentes = data.reduce((sum, item) => sum + item.total_incidentes, 0);
    const tableData = data.map(item => [
      item.inconveniente,
      item.total_incidentes.toString(),
      ((item.total_incidentes / totalIncidentes) * 100).toFixed(1) + '%'
    ]);

    const tableStyles = this.getTableStyles();
    autoTable(doc, {
      startY: yPosition,
      head: [['Tipo de Inconveniente', 'Total Incidentes', 'Porcentaje']],
      body: tableData,
      ...tableStyles,
      columnStyles: {
        0: { cellWidth: 90 }
      }
    });

    this.addFooter(doc);

    const fileName = `incidentes_por_inconveniente_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  // Exportar objetos perdidos por laboratorio
  exportObjetosPerdidosPorLaboratorio(data: any[], filtros: any = {}): void {
    const doc = new jsPDF();

    this.addHeader(doc, 'REPORTE DE OBJETOS PERDIDOS POR LABORATORIO');

    let yPosition = 70;
    if (Object.keys(filtros).length > 0) {
      yPosition = this.addFiltrosInfo(doc, filtros, yPosition);
    }

    const tableData = data.map(item => [
      item.laboratorio,
      item.total_objetos_perdidos.toString()
    ]);

    const tableStyles = this.getTableStyles();
    autoTable(doc, {
      startY: yPosition,
      head: [['Laboratorio', 'Total Objetos Perdidos']],
      body: tableData,
      ...tableStyles
    });

    this.addFooter(doc);

    const fileName = `objetos_perdidos_por_laboratorio_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  // Exportar objetos perdidos por estado
  exportObjetosPerdidosPorEstado(data: any[], filtros: any = {}): void {
    const doc = new jsPDF();

    this.addHeader(doc, 'REPORTE DE OBJETOS PERDIDOS POR ESTADO');

    let yPosition = 70;
    if (Object.keys(filtros).length > 0) {
      yPosition = this.addFiltrosInfo(doc, filtros, yPosition);
    }

    const tableData = data.map(item => [
      item.estado,
      item.total_objetos.toString()
    ]);

    const tableStyles = this.getTableStyles();
    autoTable(doc, {
      startY: yPosition,
      head: [['Estado', 'Total Objetos']],
      body: tableData,
      ...tableStyles
    });

    this.addFooter(doc);

    const fileName = `objetos_perdidos_por_estado_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  // Exportar reporte completo con estadísticas
  exportReporteCompleto(
    incidentesLab: any[],
    incidentesEstado: any[],
    incidentesPeriodo: any[],
    incidentesInconv: any[],
    objetosLab: any[],
    objetosEstado: any[],
    estadisticas: any,
    filtros: any = {}
  ): void {
    const doc = new jsPDF();

    this.addHeader(doc, 'REPORTE EJECUTIVO COMPLETO');

    let yPosition = 70;

    // Resumen ejecutivo con fondo verde
    doc.setFillColor(232, 245, 233); // Verde muy claro
    doc.roundedRect(15, yPosition, doc.internal.pageSize.getWidth() - 30, 8, 2, 2, 'F');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(27, 94, 32);
    doc.text('RESUMEN EJECUTIVO', 20, yPosition + 5);
    yPosition += 15;

    const resumenData = [
      ['Total de Incidentes', estadisticas.totalIncidentes.toString()],
      ['Incidentes Activos', estadisticas.incidentesActivos.toString()],
      ['Incidentes Resueltos', estadisticas.incidentesResueltos.toString()],
      ['Total Objetos Perdidos', estadisticas.totalObjetosPerdidos.toString()],
      ['Lab. con más incidentes', estadisticas.laboratorioConMasIncidentes || 'N/A'],
      ['Inconveniente más frecuente', estadisticas.inconvenienteMasFrecuente || 'N/A']
    ];

    const tableStyles = this.getTableStyles();
    autoTable(doc, {
      startY: yPosition,
      head: [['Indicador', 'Valor']],
      body: resumenData,
      ...tableStyles,
      headStyles: {
        ...tableStyles.headStyles,
        fillColor: [27, 94, 32] as [number, number, number] // Verde más oscuro para resumen
      }
    });

    // Nueva página para detalles
    doc.addPage();
    this.addHeader(doc, 'DETALLE POR LABORATORIO');

    yPosition = 70;
    const labData = incidentesLab.map(item => [
      item.laboratorio,
      item.total_incidentes.toString(),
      item.incidentes_activos.toString(),
      item.incidentes_aprobados.toString()
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Laboratorio', 'Total', 'Activos', 'Resueltos']],
      body: labData,
      ...tableStyles
    });

    this.addFooter(doc);

    const fileName = `reporte_completo_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  // Exportar dashboard completo
exportDashboardCompleto(
  incidentesPorLaboratorio: any[],
  objetosPerdidosPorLaboratorio: any[],
  estadisticasResumen: any,
  nombreArchivo: string = 'Dashboard_Completo',
  datosAdicionales?: any  // Parámetro opcional
): void {
    const doc = new jsPDF();

    this.addHeader(doc, 'DASHBOARD COMPLETO - SISTEMA DE GESTIÓN');

    let yPosition = 70;

    // Resumen ejecutivo con estadísticas principales
    doc.setFillColor(232, 245, 233); // Verde muy claro
    doc.roundedRect(15, yPosition, doc.internal.pageSize.getWidth() - 30, 8, 2, 2, 'F');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(27, 94, 32);
    doc.text('RESUMEN EJECUTIVO', 20, yPosition + 5);
    yPosition += 15;

    // Tabla de estadísticas principales
    const estadisticasData = [
      ['Total de Incidentes', estadisticasResumen.totalIncidentes?.toString() || '0'],
      ['Incidentes Activos', estadisticasResumen.incidentesActivos?.toString() || '0'],
      ['Incidentes Resueltos', estadisticasResumen.incidentesResueltos?.toString() || '0'],
      ['Total Objetos Perdidos', estadisticasResumen.totalObjetosPerdidos?.toString() || '0'],
      ['Laboratorios Activos', estadisticasResumen.laboratoriosActivos?.toString() || '0'],
      ['Tasa de Resolución', estadisticasResumen.tasaResolucion ? `${estadisticasResumen.tasaResolucion}%` : '0%']
    ];

    const tableStyles = this.getTableStyles();
    autoTable(doc, {
      startY: yPosition,
      head: [['Indicador', 'Valor']],
      body: estadisticasData,
      ...tableStyles,
      headStyles: {
        ...tableStyles.headStyles,
        fillColor: [27, 94, 32] as [number, number, number] // Verde más oscuro para resumen
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // Verificar si necesitamos nueva página
    if (yPosition > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage();
      this.addHeader(doc, 'DASHBOARD COMPLETO - INCIDENTES POR LABORATORIO');
      yPosition = 70;
    }

    // Sección de Incidentes por Laboratorio
    doc.setFillColor(248, 252, 248);
    doc.roundedRect(15, yPosition, doc.internal.pageSize.getWidth() - 30, 8, 2, 2, 'F');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(27, 94, 32);
    doc.text('INCIDENTES POR LABORATORIO', 20, yPosition + 5);
    yPosition += 15;

    if (incidentesPorLaboratorio && incidentesPorLaboratorio.length > 0) {
      const incidentesData = incidentesPorLaboratorio.map(item => [
        item.laboratorio || 'N/A',
        item.total_incidentes?.toString() || '0',
        item.incidentes_activos?.toString() || '0',
        item.incidentes_aprobados?.toString() || '0',
        item.incidentes_anulados?.toString() || '0',
        item.incidentes_escalados?.toString() || '0'
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Laboratorio', 'Total', 'Activos', 'Aprobados', 'Anulados', 'Escalados']],
        body: incidentesData,
        ...tableStyles
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
    } else {
      doc.setFontSize(10);
      doc.setTextColor(102, 102, 102);
      doc.text('No hay datos de incidentes por laboratorio disponibles', 20, yPosition);
      yPosition += 20;
    }

    // Verificar si necesitamos nueva página para objetos perdidos
    if (yPosition > doc.internal.pageSize.getHeight() - 100) {
      doc.addPage();
      this.addHeader(doc, 'DASHBOARD COMPLETO - OBJETOS PERDIDOS');
      yPosition = 70;
    }

    // Sección de Objetos Perdidos por Laboratorio
    doc.setFillColor(248, 252, 248);
    doc.roundedRect(15, yPosition, doc.internal.pageSize.getWidth() - 30, 8, 2, 2, 'F');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(27, 94, 32);
    doc.text('OBJETOS PERDIDOS POR LABORATORIO', 20, yPosition + 5);
    yPosition += 15;

    if (objetosPerdidosPorLaboratorio && objetosPerdidosPorLaboratorio.length > 0) {
      const objetosData = objetosPerdidosPorLaboratorio.map(item => [
        item.laboratorio || 'N/A',
        item.total_objetos_perdidos?.toString() || item.total_objetos?.toString() || '0',
        item.objetos_recuperados?.toString() || '0',
        item.objetos_pendientes?.toString() || '0'
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Laboratorio', 'Total Perdidos', 'Recuperados', 'Pendientes']],
        body: objetosData,
        ...tableStyles
      });
    } else {
      doc.setFontSize(10);
      doc.setTextColor(102, 102, 102);
      doc.text('No hay datos de objetos perdidos por laboratorio disponibles', 20, yPosition);
    }

    // Agregar información adicional en el pie
    this.addFooter(doc);

    // Generar nombre del archivo con timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `${nombreArchivo}_${timestamp}.pdf`;

    doc.save(fileName);
  }

  // Método auxiliar mejorado para agregar información de filtros
  private addFiltrosInfo(doc: jsPDF, filtros: any, yPosition: number): number {
    if (Object.keys(filtros).some(key => filtros[key])) {
      // Fondo para los filtros
      doc.setFillColor(248, 252, 248);
      doc.roundedRect(15, yPosition - 2, doc.internal.pageSize.getWidth() - 30, 20, 2, 2, 'F');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(27, 94, 32);
      doc.text('Filtros aplicados:', 20, yPosition + 3);
      yPosition += 8;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(76, 175, 80);
      if (filtros.fechaInicio) {
        doc.text(`• Fecha inicio: ${filtros.fechaInicio}`, 25, yPosition);
        yPosition += 4;
      }
      if (filtros.fechaFin) {
        doc.text(`• Fecha fin: ${filtros.fechaFin}`, 25, yPosition);
        yPosition += 4;
      }
      if (filtros.laboratorio) {
        doc.text(`• Laboratorio: ${filtros.laboratorio}`, 25, yPosition);
        yPosition += 4;
      }
      if (filtros.periodoId) {
        doc.text(`• Período: ${filtros.periodoId}`, 25, yPosition);
        yPosition += 4;
      }
      yPosition += 8;
    }
    return yPosition;
  }

  // Método para convertir imagen a base64 (para usar en el componente)
  convertImageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }

  // Método público para actualizar logos manualmente si es necesario
  async updateLogos(logoEspePath?: string, logoSecundarioPath?: string): Promise<void> {
    if (logoEspePath) {
      this.logoEspeBase64 = await this.loadImageAsBase64(logoEspePath);
    }
    if (logoSecundarioPath) {
      this.logoSecundarioBase64 = await this.loadImageAsBase64(logoSecundarioPath);
    }
  }
  exportGraficos(
  barChartData: any,
  estadoChartData: any,
  pieChartData: any,
  inconvenienteChartData: any,
  objetosEstadoChartData: any,
  tendenciaChartData: any,
  filtros: any = {}
): void {
  const doc = new jsPDF();

  const charts = [
    { name: 'Incidentes por Laboratorio', data: barChartData },
    { name: 'Incidentes por Estado', data: estadoChartData },
    { name: 'Objetos Perdidos por Laboratorio', data: pieChartData },
    { name: 'Incidentes por Inconveniente', data: inconvenienteChartData },
    { name: 'Estados de Objetos Perdidos', data: objetosEstadoChartData },
    { name: 'Tendencia de Incidentes', data: tendenciaChartData }
  ];

  charts.forEach((chart, idx) => {
    if (idx > 0) doc.addPage();
    this.addHeader(doc, `GRÁFICO: ${chart.name}`);

    let yPosition = 70;
    if (Object.keys(filtros).length > 0) {
      yPosition = this.addFiltrosInfo(doc, filtros, yPosition);
    }

    if (chart.data && chart.data.labels && chart.data.datasets && chart.data.datasets.length > 0) {
      const headers = ['Categoría', ...chart.data.datasets.map((ds: any) => ds.label || 'Valor')];
      const tableData = chart.data.labels.map((label: string, i: number) => [
        label,
        ...chart.data.datasets.map((ds: any) => ds.data[i])
      ]);
      autoTable(doc, {
        startY: yPosition,
        head: [headers],
        body: tableData,
        ...this.getTableStyles()
      });
    }

    this.addFooter(doc);
  });

  const fileName = `graficos_dashboard_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
}
