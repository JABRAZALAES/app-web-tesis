import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, switchMap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { Validators } from '@angular/forms'

import { ReportesService } from '../../services/reportes.service';
import { AuthService, AuthUsuario } from '../../services/auth.service';

@Component({
  selector: 'app-trazabilidad-busqueda',
  templateUrl: './trazabilidad-busqueda.component.html',
  styleUrls: ['./trazabilidad-busqueda.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class TrazabilidadBusquedaComponent implements OnInit {


  // Estado del componente
nombreUsuarioControl = new FormControl('', [Validators.maxLength(50)]);
  sugerenciasUsuarios: AuthUsuario[] = [];
  mostrarSugerencias = false;

  loading: boolean = false;
  error: string | null = null;

  // Datos de trazabilidad
  trazabilidadUsuario: any = null;
  cambiosEstados: any[] = [];
  incidentes: any[] = [];
  objetosPerdidos: any[] = [];

  // Output para emitir el nombre al padre
  @Output() usuarioSeleccionado = new EventEmitter<string>();

  constructor(
    private reportesService: ReportesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.nombreUsuarioControl.valueChanges
      .pipe(
        debounceTime(250),
        switchMap(q => {
          if (!q || !q.trim()) return of([]);
          return this.authService.listarUsuarios(q.trim());
        })
      )
      .subscribe(usuarios => {
        this.sugerenciasUsuarios = usuarios;
        this.mostrarSugerencias = usuarios.length > 0;
      });
  }
onInputBlur() {
  setTimeout(() => this.mostrarSugerencias = false, 100);
}
seleccionarUsuario(usuario: AuthUsuario) {
  this.nombreUsuarioControl.setValue(usuario.nombre, { emitEvent: false });
  this.mostrarSugerencias = false;
  // Quita el foco del input para evitar que el menú vuelva a aparecer
  const input = document.getElementById('nombreUsuario') as HTMLInputElement;
  if (input) {
    input.blur();
  }
}
buscarTrazabilidad(): void {
  const nombre = this.nombreUsuarioControl.value?.trim();
  if (!nombre) {
    this.error = 'Por favor ingrese un nombre de usuario';
    return;
  }

  // Validar que el nombre exista en las sugerencias
  const usuarioValido = this.sugerenciasUsuarios.find(
    u => u.nombre.toLowerCase() === nombre.toLowerCase()
  );
  if (!usuarioValido) {
    this.error = 'Seleccione un usuario válido de la lista';
    return;
  }

  this.loading = true;
  this.error = null;
  this.trazabilidadUsuario = null;
  this.incidentes = [];
  this.objetosPerdidos = [];

  this.reportesService.buscarTrazabilidadUsuario(nombre).subscribe({
    next: (response: any) => {
      this.trazabilidadUsuario = response.usuario;
      this.incidentes = response.incidentes || [];
      this.objetosPerdidos = response.objetos_perdidos || [];
      this.loading = false;
    },
    error: (error: any) => {
      this.error = error.error?.message || 'Error al buscar trazabilidad del usuario';
      this.loading = false;
    }
  });
}

  // Exportar trazabilidad por usuario (Excel o PDF)
  exportarTrazabilidadUsuario(formato: 'excel' | 'pdf' = 'excel'): void {
    const nombre = this.nombreUsuarioControl.value?.trim();
    if (!nombre) return;
    this.loading = true;
    this.reportesService.exportarTrazabilidadPorUsuario(nombre, formato).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trazabilidad-usuario-${nombre}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.loading = false;
      },
      error: () => {
        alert('Error al descargar el reporte');
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
    this.nombreUsuarioControl.setValue('');
    this.trazabilidadUsuario = null;
    this.cambiosEstados = [];
    this.error = null;
    this.sugerenciasUsuarios = [];
    this.mostrarSugerencias = false;
  }

  // Método para trackBy del ngFor
  trackByIndex(index: number, item: any): number {
    return index;
  }
}
