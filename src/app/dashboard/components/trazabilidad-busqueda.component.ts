import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ReportesService } from '../../services/reportes.service';

@Component({
  selector: 'app-trazabilidad-busqueda',
  templateUrl: './trazabilidad-busqueda.component.html',
  styleUrls: ['./trazabilidad-busqueda.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class TrazabilidadBusquedaComponent implements OnInit {


  // Estado del componente
  nombreUsuario: string = '';
  loading: boolean = false;
  error: string | null = null;

  // Datos de trazabilidad
  trazabilidadUsuario: any = null;
  cambiosEstados: any[] = [];

  // Output para emitir el nombre al padre
  @Output() usuarioSeleccionado = new EventEmitter<string>();

  constructor(private reportesService: ReportesService) {}

  ngOnInit(): void {}

  // Buscar trazabilidad del usuario
  buscarTrazabilidad(): void {
    if (!this.nombreUsuario.trim()) {
      this.error = 'Por favor ingrese un nombre de usuario';
      return;
    }

    this.loading = true;
    this.error = null;
    this.trazabilidadUsuario = null;
    this.cambiosEstados = [];

    this.reportesService.buscarTrazabilidadUsuario(this.nombreUsuario.trim()).subscribe({
      next: (response: any) => {
        console.log('✅ Trazabilidad encontrada:', response);
        this.trazabilidadUsuario = response.data.usuario;
        this.cambiosEstados = response.data.cambios_estados;
        this.loading = false;
        // Emitir el nombre al padre
        this.usuarioSeleccionado.emit(this.nombreUsuario.trim());
      },
      error: (error: any) => {
        console.error('❌ Error al buscar trazabilidad:', error);
        this.error = error.error?.message || 'Error al buscar trazabilidad del usuario';
        this.loading = false;
      }
    });
  }

  // Formatear fecha
  formatDate(dateString: string): string {
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



  // Obtener clase CSS según el tipo de entidad
  getEntityClass(tipoEntidad: string): string {
    switch (tipoEntidad?.toLowerCase()) {
      case 'incidente':
        return 'entity-incident';
      case 'objeto_perdido':
        return 'entity-object';
      default:
        return 'entity-other';
    }
  }

  // Limpiar búsqueda
  limpiarBusqueda(): void {
    this.nombreUsuario = '';
    this.trazabilidadUsuario = null;
    this.cambiosEstados = [];
    this.error = null;
  }

  // Método para trackBy del ngFor
  trackByIndex(index: number, item: any): number {
    return index;
  }
}
