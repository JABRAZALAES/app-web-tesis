import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faSort, 
  faSortUp, 
  faSortDown, 
  faDownload, 
  faFileExcel, 
  faFilePdf,
  faSearch,
  faChevronLeft,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  type?: 'text' | 'number' | 'date' | 'percentage' | 'status' | 'action';
  width?: string;
  formatter?: (value: any) => string;
}

export interface TableConfig {
  columns: TableColumn[];
  pageSize?: number;
  showPagination?: boolean;
  showExport?: boolean;
  showSearch?: boolean;
  sortable?: boolean;
}

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, FormsModule]
})
export class DataTableComponent {
  @Input() data: any[] = [];
  @Input() config: TableConfig = { columns: [] };
  @Input() loading = false;
  @Input() title = '';
  @Input() subtitle = '';

  @Output() exportExcel = new EventEmitter<void>();
  @Output() exportPdf = new EventEmitter<void>();
  @Output() rowClick = new EventEmitter<any>();
  @Output() sortChange = new EventEmitter<{ key: string; direction: 'asc' | 'desc'}>();

  // Iconos completos
  faIcons = {
    sort: faSort,
    sortUp: faSortUp,
    sortDown: faSortDown,
    download: faDownload,
    excel: faFileExcel,
    pdf: faFilePdf,
    search: faSearch,
    chevronLeft: faChevronLeft,
    chevronRight: faChevronRight
  };

  // Estado de la tabla
  currentPage = 1;
  itemsPerPage = 10;
  searchTerm = '';
  sortKey = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Datos filtrados y paginados
  get filteredData(): any[] {
    let filtered = this.data;

    // Aplicar búsqueda
    if (this.searchTerm && this.config.showSearch) {
      filtered = filtered.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(this.searchTerm.toLowerCase())
        )
      );
    }

    // Aplicar ordenamiento
    if (this.sortKey && this.config.sortable) {
      filtered.sort((a, b) => {
        const aVal = a[this.sortKey];
        const bVal = b[this.sortKey];
        
        if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }

  get paginatedData(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredData.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredData.length / this.itemsPerPage);
  }

  get totalItems(): number {
    return this.filteredData.length;
  }

  // Métodos de la tabla
  onSort(column: TableColumn): void {
    if (!column.sortable) return;

    if (this.sortKey === column.key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = column.key;
      this.sortDirection = 'asc';
    }

    this.sortChange.emit({ key: this.sortKey, direction: this.sortDirection });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onSearch(): void {
    this.currentPage = 1; // Reset a la primera página al buscar
  }

  onRowClick(row: any): void {
    this.rowClick.emit(row);
  }

  onExportExcel(): void {
    this.exportExcel.emit();
  }

  onExportPdf(): void {
    this.exportPdf.emit();
  }

  // Métodos de formateo
  formatValue(value: any, column: TableColumn): string {
    if (column.formatter) {
      return column.formatter(value);
    }

    switch (column.type) {
      case 'number':
        return this.formatNumber(value);
      case 'date':
        return this.formatDate(value);
      case 'percentage':
        return this.formatPercentage(value);
      case 'status':
        return this.formatStatus(value);
      default:
        return String(value || '-');
    }
  }

  private formatNumber(value: any): string {
    if (value === null || value === undefined) return '-';
    return Number(value).toLocaleString('es-ES');
  }

  private formatDate(value: any): string {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('es-ES');
  }

  private formatPercentage(value: any): string {
    if (value === null || value === undefined || value === '') return '-';
    const numValue = Number(value);
    if (isNaN(numValue)) return '-';
    return `${numValue.toFixed(1)}%`;
  }

  private formatStatus(value: any): string {
    if (!value) return '-';
    return String(value).charAt(0).toUpperCase() + String(value).slice(1);
  }

  // Métodos de utilidad
  getSortIcon(column: TableColumn): any {
    if (!column.sortable || this.sortKey !== column.key) {
      return this.faIcons.sort;
    }
    return this.sortDirection === 'asc' ? this.faIcons.sortUp : this.faIcons.sortDown;
  }

  getSortClass(column: TableColumn): string {
    if (!column.sortable || this.sortKey !== column.key) {
      return 'text-gray-400';
    }
    return this.sortDirection === 'asc' ? 'text-blue-600' : 'text-blue-600';
  }

  // Método para trackBy del ngFor
  trackByIndex(index: number, item: any): number {
    return index;
  }

  // Referencia al objeto Math global
  Math = Math;

  // Generar páginas para paginación
  get pages(): number[] {
    const pages: number[] = [];
    const maxPages = Math.min(5, this.totalPages);
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }
} 