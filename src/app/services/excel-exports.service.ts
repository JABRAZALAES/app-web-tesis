import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';



@Injectable({
  providedIn: 'root'
})
export class ExcelExportService {

  constructor() { }

  // Configuración de estilos para Excel
  private getHeaderStyle() {
    return {
      font: { bold: true, color: { rgb: "FFFFFF" }, size: 12 },
      fill: { patternType: "solid", fgColor: { rgb: "388E3C" } }, // Verde medio
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      },
      alignment: { horizontal: "center", vertical: "center" }
    };
  }

  private getTitleStyle() {
    return {
      font: { bold: true, color: { rgb: "1B5E20" }, size: 16 },
      fill: { patternType: "solid", fgColor: { rgb: "E8F5E9" } }, // Verde muy claro
      border: {
        top: { style: "thin", color: { rgb: "4CAF50" } },
        bottom: { style: "thin", color: { rgb: "4CAF50" } },
        left: { style: "thin", color: { rgb: "4CAF50" } },
        right: { style: "thin", color: { rgb: "4CAF50" } }
      },
      alignment: { horizontal: "center", vertical: "center" }
    };
  }

  private getDataStyle(isAlternate: boolean = false) {
    return {
      font: { color: { rgb: "000000" }, size: 10 },
      fill: {
        patternType: "solid",
        fgColor: { rgb: isAlternate ? "F8FCF8" : "FFFFFF" } // Verde muy claro alternado
      },
      border: {
        top: { style: "thin", color: { rgb: "E0E0E0" } },
        bottom: { style: "thin", color: { rgb: "E0E0E0" } },
        left: { style: "thin", color: { rgb: "E0E0E0" } },
        right: { style: "thin", color: { rgb: "E0E0E0" } }
      },
      alignment: { horizontal: "center", vertical: "center" }
    };
  }

  private getUniversityHeaderStyle() {
    return {
      font: { bold: true, color: { rgb: "1B5E20" }, size: 14 },
      fill: { patternType: "solid", fgColor: { rgb: "E8F5E9" } },
      alignment: { horizontal: "center", vertical: "center" }
    };
  }

  private getFilterStyle() {
    return {
      font: { color: { rgb: "4CAF50" }, size: 10, italic: true },
      fill: { patternType: "solid", fgColor: { rgb: "F8FCF8" } },
      alignment: { horizontal: "left", vertical: "center" }
    };
  }

  // Crear encabezado universitario
  private createUniversityHeader(ws: XLSX.WorkSheet, title: string, startRow: number = 0): number {
    const universityData = [
      ['UNIVERSIDAD DE LAS FUERZAS ARMADAS - ESPE'],
      ['INNOVACIÓN PARA LA EXCELENCIA'],
      [''],
      [title],
      [''],
      [`Generado el: ${new Date().toLocaleString('es-EC')}`]
    ];

    // Agregar datos del encabezado
    universityData.forEach((row, index) => {
      const cellAddress = XLSX.utils.encode_cell({ r: startRow + index, c: 0 });
      ws[cellAddress] = { v: row[0], t: 's' };

      // Aplicar estilos específicos
      if (index === 0 || index === 1) {
        ws[cellAddress].s = this.getUniversityHeaderStyle();
      } else if (index === 3) {
        ws[cellAddress].s = this.getTitleStyle();
      } else if (index === 5) {
        ws[cellAddress].s = this.getFilterStyle();
      }
    });

    return startRow + universityData.length + 1;
  }

  // Agregar información de filtros
  private addFiltersInfo(ws: XLSX.WorkSheet, filtros: any, startRow: number): number {
    if (!filtros || Object.keys(filtros).length === 0) return startRow;

    let currentRow = startRow;

    // Título de filtros
    const filterTitleCell = XLSX.utils.encode_cell({ r: currentRow, c: 0 });
    ws[filterTitleCell] = { v: 'Filtros aplicados:', t: 's' };
    ws[filterTitleCell].s = {
      font: { bold: true, color: { rgb: "1B5E20" }, size: 11 },
      fill: { patternType: "solid", fgColor: { rgb: "E8F5E9" } }
    };
    currentRow++;

    // Agregar cada filtro
    Object.keys(filtros).forEach(key => {
      if (filtros[key]) {
        const filterCell = XLSX.utils.encode_cell({ r: currentRow, c: 0 });
        let filterText = '';

        switch (key) {
          case 'fechaInicio':
            filterText = `• Fecha inicio: ${filtros[key]}`;
            break;
          case 'fechaFin':
            filterText = `• Fecha fin: ${filtros[key]}`;
            break;
          case 'laboratorio':
            filterText = `• Laboratorio: ${filtros[key]}`;
            break;
          case 'periodoId':
            filterText = `• Período: ${filtros[key]}`;
            break;
          default:
            filterText = `• ${key}: ${filtros[key]}`;
        }

        ws[filterCell] = { v: filterText, t: 's' };
        ws[filterCell].s = this.getFilterStyle();
        currentRow++;
      }
    });

    return currentRow + 1;
  }

  // Crear tabla con datos
  private createTable(ws: XLSX.WorkSheet, headers: string[], data: any[][], startRow: number): void {
    const headerRow = startRow;
    const dataStartRow = startRow + 1;

    // Agregar encabezados
    headers.forEach((header, colIndex) => {
      const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c: colIndex });
      ws[cellAddress] = { v: header, t: 's' };
      ws[cellAddress].s = this.getHeaderStyle();
    });

    // Agregar datos
    data.forEach((row, rowIndex) => {
      const isAlternate = rowIndex % 2 === 1;
      row.forEach((cell, colIndex) => {
        const cellAddress = XLSX.utils.encode_cell({ r: dataStartRow + rowIndex, c: colIndex });
        ws[cellAddress] = { v: cell, t: typeof cell === 'number' ? 'n' : 's' };
        ws[cellAddress].s = this.getDataStyle(isAlternate);
      });
    });

    // Establecer ancho de columnas
    const colWidths = headers.map(() => ({ wch: 20 }));
    ws['!cols'] = colWidths;

    // Establecer rango de la hoja
    const range = XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: dataStartRow + data.length - 1, c: headers.length - 1 }
    });
    ws['!ref'] = range;
  }

  // Exportar incidentes por laboratorio
  exportIncidentesPorLaboratorio(data: any[], filtros: any = {}): void {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([]);

    let currentRow = this.createUniversityHeader(ws, 'REPORTE DE INCIDENTES POR LABORATORIO');
    currentRow = this.addFiltersInfo(ws, filtros, currentRow);

    const headers = ['Laboratorio', 'Total', 'Activos', 'Aprobados', 'Anulados', 'Escalados'];
    const tableData = data.map(item => [
      item.laboratorio,
      item.total_incidentes,
      item.incidentes_activos,
      item.incidentes_aprobados,
      item.incidentes_anulados,
      item.incidentes_escalados
    ]);

    this.createTable(ws, headers, tableData, currentRow);

    XLSX.utils.book_append_sheet(wb, ws, 'Incidentes por Laboratorio');

    const fileName = `incidentes_por_laboratorio_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  // Exportar incidentes por estado
  exportIncidentesPorEstado(data: any[], filtros: any = {}): void {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([]);

    let currentRow = this.createUniversityHeader(ws, 'REPORTE DE INCIDENTES POR ESTADO');
    currentRow = this.addFiltersInfo(ws, filtros, currentRow);

    const totalIncidentes = data.reduce((sum, item) => sum + item.total_incidentes, 0);
    const headers = ['Estado', 'Total Incidentes', 'Porcentaje'];
    const tableData = data.map(item => [
      item.estado,
      item.total_incidentes,
      `${((item.total_incidentes / totalIncidentes) * 100).toFixed(1)}%`
    ]);

    this.createTable(ws, headers, tableData, currentRow);

    XLSX.utils.book_append_sheet(wb, ws, 'Incidentes por Estado');

    const fileName = `incidentes_por_estado_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  // Exportar incidentes por período
  exportIncidentesPorPeriodo(data: any[], filtros: any = {}): void {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([]);

    let currentRow = this.createUniversityHeader(ws, 'REPORTE DETALLADO DE INCIDENTES POR PERÍODO');
    currentRow = this.addFiltersInfo(ws, filtros, currentRow);

    const headers = ['Código', 'Fecha Reporte', 'Descripción', 'Laboratorio', 'Estado', 'Período', 'Fecha Resolución'];
    const tableData = data.map(item => [
      item.codigo,
      new Date(item.fecha_reporte).toLocaleDateString('es-EC'),
      item.descripcion,
      item.laboratorio_id,
      item.estadoId,
      item.periodo_academico,
      item.fecha_resolucion ? new Date(item.fecha_resolucion).toLocaleDateString('es-EC') : 'Pendiente'
    ]);

    this.createTable(ws, headers, tableData, currentRow);

    // Ajustar ancho de columna de descripción
    if (ws['!cols']) {
      ws['!cols'][2] = { wch: 40 }; // Descripción más ancha
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Incidentes por Período');

    const fileName = `incidentes_por_periodo_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  // Exportar incidentes por inconveniente
  exportIncidentesPorInconveniente(data: any[], filtros: any = {}): void {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([]);

    let currentRow = this.createUniversityHeader(ws, 'REPORTE DE INCIDENTES POR TIPO DE INCONVENIENTE');
    currentRow = this.addFiltersInfo(ws, filtros, currentRow);

    const totalIncidentes = data.reduce((sum, item) => sum + item.total_incidentes, 0);
    const headers = ['Tipo de Inconveniente', 'Total Incidentes', 'Porcentaje'];
    const tableData = data.map(item => [
      item.inconveniente,
      item.total_incidentes,
      `${((item.total_incidentes / totalIncidentes) * 100).toFixed(1)}%`
    ]);

    this.createTable(ws, headers, tableData, currentRow);

    // Ajustar ancho de columna de inconveniente
    if (ws['!cols']) {
      ws['!cols'][0] = { wch: 35 }; // Tipo de inconveniente más ancho
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Incidentes por Inconveniente');

    const fileName = `incidentes_por_inconveniente_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  // Exportar objetos perdidos por laboratorio
  exportObjetosPerdidosPorLaboratorio(data: any[], filtros: any = {}): void {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([]);

    let currentRow = this.createUniversityHeader(ws, 'REPORTE DE OBJETOS PERDIDOS POR LABORATORIO');
    currentRow = this.addFiltersInfo(ws, filtros, currentRow);

    const headers = ['Laboratorio', 'Total Objetos Perdidos'];
    const tableData = data.map(item => [
      item.laboratorio,
      item.total_objetos_perdidos
    ]);

    this.createTable(ws, headers, tableData, currentRow);

    XLSX.utils.book_append_sheet(wb, ws, 'Objetos Perdidos por Lab');

    const fileName = `objetos_perdidos_por_laboratorio_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  // Exportar objetos perdidos por estado
  exportObjetosPerdidosPorEstado(data: any[], filtros: any = {}): void {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([]);

    let currentRow = this.createUniversityHeader(ws, 'REPORTE DE OBJETOS PERDIDOS POR ESTADO');
    currentRow = this.addFiltersInfo(ws, filtros, currentRow);

    const headers = ['Estado', 'Total Objetos'];
    const tableData = data.map(item => [
      item.estado,
      item.total_objetos
    ]);

    this.createTable(ws, headers, tableData, currentRow);

    XLSX.utils.book_append_sheet(wb, ws, 'Objetos Perdidos por Estado');

    const fileName = `objetos_perdidos_por_estado_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  // Exportar reporte completo con múltiples hojas
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
    const wb = XLSX.utils.book_new();

    // Hoja 1: Resumen Ejecutivo
    const wsResumen = XLSX.utils.aoa_to_sheet([]);
    let currentRow = this.createUniversityHeader(wsResumen, 'REPORTE EJECUTIVO COMPLETO');
    currentRow = this.addFiltersInfo(wsResumen, filtros, currentRow);

    const resumenHeaders = ['Indicador', 'Valor'];
    const resumenData = [
      ['Total de Incidentes', estadisticas.totalIncidentes],
      ['Incidentes Activos', estadisticas.incidentesActivos],
      ['Incidentes Resueltos', estadisticas.incidentesResueltos],
      ['Total Objetos Perdidos', estadisticas.totalObjetosPerdidos],
      ['Laboratorio con más incidentes', estadisticas.laboratorioConMasIncidentes || 'N/A'],
      ['Inconveniente más frecuente', estadisticas.inconvenienteMasFrecuente || 'N/A']
    ];

    this.createTable(wsResumen, resumenHeaders, resumenData, currentRow);
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Ejecutivo');

    // Hoja 2: Incidentes por Laboratorio
    if (incidentesLab.length > 0) {
      const wsIncLab = XLSX.utils.aoa_to_sheet([]);
      let row = this.createUniversityHeader(wsIncLab, 'INCIDENTES POR LABORATORIO');

      const headers = ['Laboratorio', 'Total', 'Activos', 'Aprobados', 'Anulados', 'Escalados'];
      const tableData = incidentesLab.map(item => [
        item.laboratorio,
        item.total_incidentes,
        item.incidentes_activos,
        item.incidentes_aprobados,
        item.incidentes_anulados,
        item.incidentes_escalados
      ]);

      this.createTable(wsIncLab, headers, tableData, row);
      XLSX.utils.book_append_sheet(wb, wsIncLab, 'Incidentes por Lab');
    }

    // Hoja 3: Incidentes por Estado
    if (incidentesEstado.length > 0) {
      const wsIncEst = XLSX.utils.aoa_to_sheet([]);
      let row = this.createUniversityHeader(wsIncEst, 'INCIDENTES POR ESTADO');

      const totalIncidentes = incidentesEstado.reduce((sum, item) => sum + item.total_incidentes, 0);
      const headers = ['Estado', 'Total Incidentes', 'Porcentaje'];
      const tableData = incidentesEstado.map(item => [
        item.estado,
        item.total_incidentes,
        `${((item.total_incidentes / totalIncidentes) * 100).toFixed(1)}%`
      ]);

      this.createTable(wsIncEst, headers, tableData, row);
      XLSX.utils.book_append_sheet(wb, wsIncEst, 'Incidentes por Estado');
    }

    // Hoja 4: Detalle de Incidentes (solo primeros 1000 registros para evitar archivos muy grandes)
    if (incidentesPeriodo.length > 0) {
      const wsDetalle = XLSX.utils.aoa_to_sheet([]);
      let row = this.createUniversityHeader(wsDetalle, 'DETALLE DE INCIDENTES');

      const headers = ['Código', 'Fecha Reporte', 'Descripción', 'Laboratorio', 'Estado', 'Período', 'Fecha Resolución'];
      const tableData = incidentesPeriodo.slice(0, 1000).map(item => [
        item.codigo,
        new Date(item.fecha_reporte).toLocaleDateString('es-EC'),
        item.descripcion,
        item.laboratorio_id,
        item.estadoId,
        item.periodo_academico,
        item.fecha_resolucion ? new Date(item.fecha_resolucion).toLocaleDateString('es-EC') : 'Pendiente'
      ]);

      this.createTable(wsDetalle, headers, tableData, row);

      // Ajustar ancho de columnas
      if (wsDetalle['!cols']) {
        wsDetalle['!cols'][2] = { wch: 40 }; // Descripción más ancha
      }

      XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle Incidentes');
    }

    const fileName = `reporte_completo_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  // Método para exportar datos personalizados
  exportCustomData(
    title: string,
    headers: string[],
    data: any[][],
    filtros: any = {},
    sheetName: string = 'Datos'
  ): void {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([]);

    let currentRow = this.createUniversityHeader(ws, title);
    currentRow = this.addFiltersInfo(ws, filtros, currentRow);

    this.createTable(ws, headers, data, currentRow);

    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const fileName = `${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
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
  const wb = XLSX.utils.book_new();

  // Ejemplo: Guardar solo los datos de los gráficos como tablas
  const charts = [
    { name: 'Incidentes por Laboratorio', data: barChartData },
    { name: 'Incidentes por Estado', data: estadoChartData },
    { name: 'Objetos Perdidos por Laboratorio', data: pieChartData },
    { name: 'Incidentes por Inconveniente', data: inconvenienteChartData },
    { name: 'Estados de Objetos Perdidos', data: objetosEstadoChartData },
    { name: 'Tendencia de Incidentes', data: tendenciaChartData }
  ];

  charts.forEach(chart => {
    const ws = XLSX.utils.aoa_to_sheet([]);
    let row = this.createUniversityHeader(ws, `GRÁFICO: ${chart.name}`);
    row = this.addFiltersInfo(ws, filtros, row);

    // Si el gráfico tiene labels y datasets
    if (chart.data && chart.data.labels && chart.data.datasets && chart.data.datasets.length > 0) {
      const headers = ['Categoría', ...chart.data.datasets.map((ds: any) => ds.label || 'Valor')];
      const tableData = chart.data.labels.map((label: string, i: number) => [
        label,
        ...chart.data.datasets.map((ds: any) => ds.data[i])
      ]);
      this.createTable(ws, headers, tableData, row);
    }

    XLSX.utils.book_append_sheet(wb, ws, chart.name.substring(0, 30));
  });

  const fileName = `graficos_dashboard_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
}

