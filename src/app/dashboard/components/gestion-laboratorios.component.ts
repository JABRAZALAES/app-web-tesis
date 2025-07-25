import { Component, OnInit } from '@angular/core';
import { GestionLaboratoriosService, PeriodoAcademico, Computadora } from '../../services/gestion-laboratorios.service';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gestion-laboratorios',
  templateUrl: './gestion-laboratorios.component.html',
  styleUrls: ['./gestion-laboratorios.component.scss'],
  imports: [FormsModule, CommonModule]
})
export class GestionLaboratoriosComponent implements OnInit {
  // Periodos académicos
  periodos: PeriodoAcademico[] = [];
  loading = false;
  error: string | null = null;
  mensajeExito: string | null = null;
  creando = false;

  nuevoPeriodo: PeriodoAcademico = {
    nombre: '',
    fecha_inicio: '',
    fecha_fin: '',
    estado_periodo: 'activo' // valor por defecto
  };

  // Computadoras
  computadoras: Computadora[] = [];
  cargandoComputadoras = false;
  errorComputadoras: string | null = null;

  nuevaComputadora: Computadora = {
    nombre: '',
    laboratorio_id: 0,
    especificaciones: '',
    estado: 'ACTIVA',
    numero_serie: ''
  };

  computadoraActiva: Computadora | null = null;
  proximaComputadora: Computadora | null = null;
  laboratorioActivo: any = null;
proximoLaboratorio: any = null;

  // Control de modales
  mostrarModalCrear = false;
  mostrarModalTabla = false;
  mostrarModalComputadoras = false;
  mostrarModalCrearComputadora = false;
  mostrarModalTablaComputadoras = false;

  // Dashboard info
  periodoActivo: PeriodoAcademico | null = null;
  proximoPeriodo: PeriodoAcademico | null = null;
  fechaActualizacion: string = '';

  // Estados para computadoras
  creandoComputadora = false;
  mensajeExitoComputadora: string | null = null;

  constructor(private gestionLaboratoriosService: GestionLaboratoriosService) {}

  ngOnInit(): void {
    this.cargarPeriodos();
  }

  // ===== MÉTODOS PERIODOS ACADÉMICOS =====

  cargarPeriodos(): void {
    this.loading = true;
    this.error = null;
    this.gestionLaboratoriosService.obtenerPeriodos().subscribe({
      next: resp => {
        this.periodos = resp.data;
        this.loading = false;
        this.actualizarEstadisticas();
        this.fechaActualizacion = new Date().toLocaleString();
      },
      error: err => {
        this.error = err.error?.message || 'Error al cargar períodos';
        this.loading = false;
      }
    });
  }


  crearPeriodo(): void {
    const periodoEnviar = {
      nombre: this.nuevoPeriodo.nombre,
      fecha_inicio: this.nuevoPeriodo.fecha_inicio,
      fecha_fin: this.nuevoPeriodo.fecha_fin
    };

    if (!periodoEnviar.nombre || !periodoEnviar.fecha_inicio || !periodoEnviar.fecha_fin) {
      this.error = 'Por favor completa todos los campos obligatorios.';
      return;
    }

    if (new Date(periodoEnviar.fecha_fin) <= new Date(periodoEnviar.fecha_inicio)) {
      this.error = 'La fecha de fin debe ser posterior a la fecha de inicio';
      return;
    }

    this.creando = true;
    this.error = null;
    this.mensajeExito = null;

    this.gestionLaboratoriosService.crearPeriodo(periodoEnviar as PeriodoAcademico).subscribe({
      next: resp => {
        this.mensajeExito = 'Período creado exitosamente';
        this.nuevoPeriodo = { nombre: '', fecha_inicio: '', fecha_fin: '', estado_periodo: 'activo' };
        this.cargarPeriodos();
        this.creando = false;
      },
      error: err => {
        console.error('Error backend:', err);
        this.error = err.error?.message || 'Error al crear período';
        this.creando = false;
      }
    });
  }

  eliminarPeriodo(id?: number): void {
    if (!id) return;
    if (!confirm('¿Estás seguro de eliminar este período académico? Esta acción no se puede deshacer.')) return;

    this.gestionLaboratoriosService.eliminarPeriodo(id).subscribe({
      next: resp => {
        this.mensajeExito = 'Período eliminado exitosamente';
        this.error = null;
        this.cargarPeriodos();
        setTimeout(() => this.mensajeExito = null, 3000);
      },
      error: err => {
        console.error('Error eliminando período:', err);
        this.error = err.error?.message || 'Error al eliminar período';
        this.mensajeExito = null;
        setTimeout(() => this.error = null, 5000);
      }
    });
  }

  editarPeriodo(periodo: PeriodoAcademico): void {
    this.nuevoPeriodo = { ...periodo };
    this.abrirModalCrear();
  }

  actualizarEstadisticas(): void {
    if (!this.periodos.length) {
      this.periodoActivo = null;
      this.proximoPeriodo = null;
      return;
    }

    const hoy = new Date();

    this.periodoActivo = this.periodos.find(p => {
      const inicio = new Date(p.fecha_inicio);
      const fin = new Date(p.fecha_fin);
      return hoy >= inicio && hoy <= fin;
    }) || null;

    this.proximoPeriodo = this.periodos
      .filter(p => new Date(p.fecha_inicio) > hoy)
      .sort((a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime())[0] || null;
  }

  // ===== MÉTODOS COMPUTADORAS =====

  cargarComputadorasPorLaboratorio(laboratorio_id: number): void {
    this.cargandoComputadoras = true;
    this.errorComputadoras = null;

    this.gestionLaboratoriosService.obtenerComputadorasPorLaboratorio(laboratorio_id).subscribe({
      next: resp => {
        this.computadoras = resp;
        this.cargandoComputadoras = false;
        this.actualizarComputadorasDashboard();
      },
      error: err => {
        this.errorComputadoras = err.error?.message || 'Error al cargar computadoras';
        this.cargandoComputadoras = false;
      }
    });
  }
  cargarTodasComputadoras(): void {
  this.cargandoComputadoras = true;
  this.errorComputadoras = null;
  this.gestionLaboratoriosService.obtenerTodasComputadoras().subscribe({
    next: resp => {
      this.computadoras = resp;
      this.cargandoComputadoras = false;
      this.actualizarComputadorasDashboard();
    },
    error: err => {
      this.errorComputadoras = err.error?.message || 'Error al cargar computadoras';
      this.cargandoComputadoras = false;
    }
  });
}

  crearComputadora(): void {
    // Validar campos obligatorios
    if (!this.nuevaComputadora.nombre || !this.nuevaComputadora.laboratorio_id) {
      this.errorComputadoras = 'Nombre y laboratorio son requeridos para crear una computadora.';
      return;
    }

    this.errorComputadoras = null;
    this.mensajeExitoComputadora = null;
    this.creandoComputadora = true;

    this.gestionLaboratoriosService.crearComputadora(this.nuevaComputadora).subscribe({
      next: resp => {
        this.mensajeExitoComputadora = 'Computadora creada exitosamente';
        const laboratorioId = this.nuevaComputadora.laboratorio_id;
        this.nuevaComputadora = {
          nombre: '',
          laboratorio_id: 0,
          especificaciones: '',
          estado: 'ACTIVA',
          numero_serie: ''
        };
        this.cargarComputadorasPorLaboratorio(laboratorioId);
        this.creandoComputadora = false;
      },
      error: err => {
        this.errorComputadoras = err.error?.message || 'Error al crear computadora';
        this.creandoComputadora = false;
        console.error('Error backend:', err);
      }
    });
  }
    getComputadorasPorLaboratorio(labId: number): Computadora[] {
    return this.computadoras?.filter(c => c.laboratorio_id === labId) || [];
  }

eliminarComputadora(id?: number): void {
  if (!id) return;
  if (!confirm('¿Estás seguro de eliminar esta computadora? Esta acción no se puede deshacer.')) return;

  this.gestionLaboratoriosService.eliminarComputadora(id).subscribe({
    next: resp => {
      this.mensajeExitoComputadora = 'Computadora eliminada exitosamente';
      this.errorComputadoras = null;
      this.cargarTodasComputadoras(); // Recarga todas las computadoras
      setTimeout(() => this.mensajeExitoComputadora = null, 3000);
    },
    error: err => {
      this.errorComputadoras = err.error?.message || 'Error al eliminar computadora';
      this.mensajeExitoComputadora = null;
      setTimeout(() => this.errorComputadoras = null, 5000);
    }
  });
}

  actualizarComputadorasDashboard(): void {
    this.computadoraActiva = this.computadoras[0] || null;
    this.proximaComputadora = this.computadoras[1] || null;
  }

  // ===== MÉTODOS LABORATORIOS =====
// ===== MÉTODOS LABORATORIOS =====

laboratorios: any[] = [];
nuevoLaboratorio: any = {
  nombre: '',
  ubicacion: ''
};
laboratorioSeleccionado: any = null;
cargandoLaboratorios = false;
mensajeExitoLaboratorio: string | null = null;
errorLaboratorios: string | null = null;

// Método para actualizar laboratorioActivo y proximoLaboratorio
setLaboratorioActivoYProximo(): void {
  if (this.laboratorios && this.laboratorios.length > 0) {
    this.laboratorioActivo = this.laboratorios[0];
    this.proximoLaboratorio = this.laboratorios.length > 1 ? this.laboratorios[1] : null;
  } else {
    this.laboratorioActivo = null;
    this.proximoLaboratorio = null;
  }
}

// Modifica cargarLaboratorios para llamar este método después de cargar los datos:
cargarLaboratorios(): void {
  this.cargandoLaboratorios = true;
  this.errorLaboratorios = null;
  this.gestionLaboratoriosService.obtenerLaboratorios().subscribe({
    next: resp => {
      this.laboratorios = resp.data;
      this.cargandoLaboratorios = false;
      this.setLaboratorioActivoYProximo(); // <-- Agrega esta línea aquí
    },
    error: err => {
      this.errorLaboratorios = err.error?.message || 'Error al cargar laboratorios';
      this.cargandoLaboratorios = false;
      this.setLaboratorioActivoYProximo(); // <-- Y aquí también
    }
  });
}


// Crear laboratorio
crearLaboratorio(): void {
  if (!this.nuevoLaboratorio.nombre || !this.nuevoLaboratorio.ubicacion) {
    this.errorLaboratorios = 'Nombre y ubicación son requeridos.';
    return;
  }
  this.errorLaboratorios = null;
  this.mensajeExitoLaboratorio = null;
  this.gestionLaboratoriosService.crearLaboratorio(this.nuevoLaboratorio).subscribe({
    next: resp => {
      this.mensajeExitoLaboratorio = 'Laboratorio creado exitosamente';
      this.nuevoLaboratorio = { nombre: '', ubicacion: '' };
      this.cargarLaboratorios();
      setTimeout(() => this.mensajeExitoLaboratorio = null, 3000);
    },
    error: err => {
      this.errorLaboratorios = err.error?.message || 'Error al crear laboratorio';
      this.mensajeExitoLaboratorio = null;
      setTimeout(() => this.errorLaboratorios = null, 5000);
    }
  });
}

// Actualizar laboratorio
actualizarLaboratorio(): void {
  if (!this.laboratorioSeleccionado?.id) return;
  this.errorLaboratorios = null;
  this.mensajeExitoLaboratorio = null;
  this.gestionLaboratoriosService.actualizarLaboratorio(this.laboratorioSeleccionado.id, this.laboratorioSeleccionado).subscribe({
    next: resp => {
      this.mensajeExitoLaboratorio = 'Laboratorio actualizado exitosamente';
      this.laboratorioSeleccionado = null;
      this.cargarLaboratorios();
      setTimeout(() => this.mensajeExitoLaboratorio = null, 3000);
    },
    error: err => {
      this.errorLaboratorios = err.error?.message || 'Error al actualizar laboratorio';
      this.mensajeExitoLaboratorio = null;
      setTimeout(() => this.errorLaboratorios = null, 5000);
    }
  });
}

// Eliminar laboratorio
eliminarLaboratorio(id?: number): void {
  if (!id) return;
  if (!confirm('¿Estás seguro de eliminar este laboratorio? Esta acción no se puede deshacer.')) return;
  this.gestionLaboratoriosService.eliminarLaboratorio(id).subscribe({
    next: resp => {
      this.mensajeExitoLaboratorio = 'Laboratorio eliminado exitosamente';
      this.errorLaboratorios = null;
      this.cargarLaboratorios(); // Recarga la tabla
      setTimeout(() => this.mensajeExitoLaboratorio = null, 3000);
    },
    error: err => {
      this.errorLaboratorios = err.error?.message || 'Error al eliminar laboratorio';
      this.mensajeExitoLaboratorio = null;
      setTimeout(() => this.errorLaboratorios = null, 5000);
    }
  });
}

// Seleccionar laboratorio para editar
seleccionarLaboratorio(lab: any): void {
  this.laboratorioSeleccionado = { ...lab };
}
  // ===== MODALES =====

  abrirModalCrear(): void {
    this.mostrarModalCrear = true;
    this.limpiarFormularioPeriodo();
  }

  cerrarModalCrear(): void {
    this.mostrarModalCrear = false;
    this.limpiarFormularioPeriodo();
    this.mensajeExito = null;
    this.error = null;
  }

  abrirModalTabla(): void {
    this.mostrarModalTabla = true;
    this.cargarPeriodos();
  }

  cerrarModalTabla(): void {
    this.mostrarModalTabla = false;
  }

  abrirModalComputadoras(): void {
    this.mostrarModalComputadoras = true;
  }

  cerrarModalComputadoras(): void {
    this.mostrarModalComputadoras = false;
    this.computadoras = [];
    this.errorComputadoras = null;
  }

  abrirModalCrearComputadora(): void {
    this.mensajeExitoComputadora = null;
    this.errorComputadoras = null;
    this.creandoComputadora = false;
    this.nuevaComputadora = {
      nombre: '',
      laboratorio_id: 0,
      especificaciones: '',
      estado: 'ACTIVA',
      numero_serie: ''
    };
    this.mostrarModalCrearComputadora = true;
  }

  cerrarModalCrearComputadora(): void {
    this.mostrarModalCrearComputadora = false;
    this.nuevaComputadora = {
      nombre: '',
      laboratorio_id: 0,
      especificaciones: '',
      estado: 'ACTIVA',
      numero_serie: ''
    };
    this.errorComputadoras = null;
    this.mensajeExitoComputadora = null;
  }

abrirModalTablaComputadoras(): void {
  this.mostrarModalTablaComputadoras = true;
  this.cargarTodasComputadoras();
}

  cerrarModalTablaComputadoras(): void {
    this.mostrarModalTablaComputadoras = false;
  }

  limpiarFormularioPeriodo(): void {
    this.nuevoPeriodo = {
      nombre: '',
      fecha_inicio: '',
      fecha_fin: '',
      estado_periodo: 'activo'
    };
  }

  // Opcional: para cerrar modales haciendo click fuera del contenido
  onModalBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.cerrarModalCrear();
      this.cerrarModalTabla();
      this.cerrarModalComputadoras();
      this.cerrarModalCrearComputadora();
      this.cerrarModalTablaComputadoras();
    }
  }
    // ===== MODALES LABORATORIOS =====

  mostrarModalCrearLaboratorio: boolean = false;
  mostrarModalTablaLaboratorios: boolean = false;

  // Abrir modal para crear laboratorio
  abrirModalCrearLaboratorio(): void {
    this.mostrarModalCrearLaboratorio = true;
    this.nuevoLaboratorio = { nombre: '', ubicacion: '' };
    this.mensajeExitoLaboratorio = null;
    this.errorLaboratorios = null;
  }

  // Cerrar modal para crear laboratorio
  cerrarModalCrearLaboratorio(): void {
    this.mostrarModalCrearLaboratorio = false;
    this.nuevoLaboratorio = { nombre: '', ubicacion: '' };
    this.mensajeExitoLaboratorio = null;
    this.errorLaboratorios = null;
  }

  // Abrir modal para ver tabla de laboratorios
  abrirModalTablaLaboratorios(): void {
    this.mostrarModalTablaLaboratorios = true;
    this.cargarLaboratorios();
  }

  // Cerrar modal para ver tabla de laboratorios
  cerrarModalTablaLaboratorios(): void {
    this.mostrarModalTablaLaboratorios = false;
  }
}

