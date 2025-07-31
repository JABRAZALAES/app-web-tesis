import { Component, OnInit } from '@angular/core';
import { GestionLaboratoriosService, PeriodoAcademico, Computadora } from '../../services/gestion-laboratorios.service';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';
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
  laboratoriosConComputadoras: { laboratorio: any, computadoras: Computadora[] }[] = [];

  // Computadoras
  computadoras: Computadora[] = [];
  cargandoComputadoras = false;
  errorComputadoras: string | null = null;

  nuevaComputadora: Computadora = {
    nombre: '',
    laboratorio_id: 0,
    especificaciones: '',
    estado: 'ACTIVO',
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
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Por favor completa todos los campos obligatorios.'
    });
    return;
  }

  if (new Date(periodoEnviar.fecha_fin) <= new Date(periodoEnviar.fecha_inicio)) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'La fecha de fin debe ser posterior a la fecha de inicio'
    });
    return;
  }

  this.creando = true;
  this.error = null;
  this.mensajeExito = null;

  this.gestionLaboratoriosService.crearPeriodo(periodoEnviar as PeriodoAcademico).subscribe({
    next: resp => {
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Período creado exitosamente',
        timer: 2000,
        showConfirmButton: false
      });
      this.mensajeExito = 'Período creado exitosamente';
      this.nuevoPeriodo = { nombre: '', fecha_inicio: '', fecha_fin: '', estado_periodo: 'activo' };
      this.cargarPeriodos();
      this.creando = false;
      this.cerrarModalCrear();
    },
    error: err => {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.error?.message || 'Error al crear período'
      });
      this.error = err.error?.message || 'Error al crear período';
      this.creando = false;
    }
  });
}


eliminarPeriodo(id?: number): void {
  if (!id) return;
  Swal.fire({
    title: '¿Estás seguro?',
    text: 'Esta acción no se puede deshacer.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  }).then(result => {
    if (result.isConfirmed) {
      this.gestionLaboratoriosService.eliminarPeriodo(id).subscribe({
        next: resp => {
          Swal.fire({
            icon: 'success',
            title: '¡Eliminado!',
            text: 'Período eliminado exitosamente',
            timer: 2000,
            showConfirmButton: false
          });
          this.mensajeExito = 'Período eliminado exitosamente';
          this.error = null;
          this.cargarPeriodos();
        },
        error: err => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.error?.message || 'Error al eliminar período'
          });
          this.error = err.error?.message || 'Error al eliminar período';
          this.mensajeExito = null;
        }
      });
    }
  });
}


editarPeriodo(periodo: any) {
  // Asegúrate de formatear las fechas para el input date
  this.nuevoPeriodo = {
    ...periodo,
    fecha_inicio: this.formatDateForInput(periodo.fecha_inicio),
    fecha_fin: this.formatDateForInput(periodo.fecha_fin)
  };
  this.mostrarModalCrear = true;
}

// Utilidad para formatear la fecha
formatDateForInput(fecha: string): string {
  if (!fecha) return '';
  // Si ya está en formato yyyy-MM-dd, retorna igual
  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return fecha;
  // Si viene en otro formato, intenta convertirlo
  const d = new Date(fecha);
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
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
actualizarPeriodo(): void {
  if (!this.nuevoPeriodo.id) return;
  this.creando = true;
  this.gestionLaboratoriosService.actualizarPeriodo(this.nuevoPeriodo.id, this.nuevoPeriodo).subscribe({
    next: resp => {
      Swal.fire('¡Actualizado!', 'Período actualizado exitosamente.', 'success');
      this.cargarPeriodos();
      this.creando = false;
      this.cerrarModalCrear();
    },
    error: err => {
      const msg = err?.error?.message || 'Error al actualizar período.';
      Swal.fire('Error', msg, 'error');
      this.creando = false;
    }
  });
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
  if (!this.nuevaComputadora.nombre || !this.nuevaComputadora.laboratorio_id) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Nombre y laboratorio son requeridos para crear una computadora.'
    });
    return;
  }

  this.errorComputadoras = null;
  this.mensajeExitoComputadora = null;
  this.creandoComputadora = true;

  this.gestionLaboratoriosService.crearComputadora(this.nuevaComputadora).subscribe({
    next: resp => {
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Computadora creada exitosamente',
        timer: 2000,
        showConfirmButton: false
      });
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
      this.cerrarModalCrearComputadora();
    },
    error: err => {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.error?.message || 'Error al crear computadora'
      });
      this.errorComputadoras = err.error?.message || 'Error al crear computadora';
      this.creandoComputadora = false;
    }
  });
}

eliminarComputadora(id?: number): void {
  if (!id) return;
  Swal.fire({
    title: '¿Estás seguro?',
    text: 'Esta acción no se puede deshacer.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  }).then(result => {
    if (result.isConfirmed) {
      this.gestionLaboratoriosService.eliminarComputadora(id).subscribe({
        next: resp => {
          Swal.fire({
            icon: 'success',
            title: '¡Eliminada!',
            text: 'Computadora eliminada exitosamente',
            timer: 2000,
            showConfirmButton: false
          });
          this.mensajeExitoComputadora = 'Computadora eliminada exitosamente';
          this.errorComputadoras = null;
          this.cargarTodasComputadoras();
        },
        error: err => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.error?.message || 'Error al eliminar computadora'
          });
          this.errorComputadoras = err.error?.message || 'Error al eliminar computadora';
          this.mensajeExitoComputadora = null;
        }
      });
    }
  });
}

editarComputadora(computadora: Computadora): void {
  this.nuevaComputadora = { ...computadora };
  this.cargarLaboratorios(); // <-- Asegúrate de cargar los laboratorios aquí
  this.mostrarModalCrearComputadora = true;
}

actualizarComputadora(): void {
  if (!this.nuevaComputadora.id) return;
  this.creandoComputadora = true;
  this.errorComputadoras = null;
  this.mensajeExitoComputadora = null;
  this.gestionLaboratoriosService.actualizarComputadora(this.nuevaComputadora.id, this.nuevaComputadora).subscribe({
    next: resp => {
      Swal.fire({
        icon: 'success',
        title: '¡Actualizada!',
        text: 'Computadora actualizada exitosamente',
        timer: 2000,
        showConfirmButton: false
      });
      this.mensajeExitoComputadora = 'Computadora actualizada exitosamente';
      this.cargarTodasComputadoras();
      this.creandoComputadora = false;
      this.cerrarModalCrearComputadora();
    },
    error: err => {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.error?.message || 'Error al actualizar computadora'
      });
      this.errorComputadoras = err.error?.message || 'Error al actualizar computadora';
      this.creandoComputadora = false;
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
  // Usa laboratorioSeleccionado en vez de nuevoLaboratorio
  if (!this.laboratorioSeleccionado.nombre || !this.laboratorioSeleccionado.ubicacion) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Nombre y ubicación son requeridos.'
    });
    return;
  }
  this.errorLaboratorios = null;
  this.mensajeExitoLaboratorio = null;
  this.gestionLaboratoriosService.crearLaboratorio(this.laboratorioSeleccionado).subscribe({
    next: resp => {
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Laboratorio creado exitosamente',
        timer: 2000,
        showConfirmButton: false
      });
      this.mensajeExitoLaboratorio = 'Laboratorio creado exitosamente';
      this.laboratorioSeleccionado = { nombre: '', ubicacion: '' };
      this.cargarLaboratorios();
      this.cerrarModalCrearLaboratorio();
    },
    error: err => {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.error?.message || 'Error al crear laboratorio'
      });
      this.errorLaboratorios = err.error?.message || 'Error al crear laboratorio';
      this.mensajeExitoLaboratorio = null;
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
      Swal.fire({
        icon: 'success',
        title: '¡Actualizado!',
        text: 'Laboratorio actualizado exitosamente',
        timer: 2000,
        showConfirmButton: false
      });
      this.mensajeExitoLaboratorio = 'Laboratorio actualizado exitosamente';
      this.laboratorioSeleccionado = null;
      this.cargarLaboratorios();
      this.cerrarModalCrearLaboratorio();
    },
    error: err => {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.error?.message || 'Error al actualizar laboratorio'
      });
      this.errorLaboratorios = err.error?.message || 'Error al actualizar laboratorio';
      this.mensajeExitoLaboratorio = null;
    }
  });
}


// Eliminar laboratorio
eliminarLaboratorio(id?: number): void {
  if (!id) return;
  Swal.fire({
    title: '¿Estás seguro?',
    text: 'Esta acción no se puede deshacer.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  }).then(result => {
    if (result.isConfirmed) {
      this.gestionLaboratoriosService.eliminarLaboratorio(id).subscribe({
        next: resp => {
          Swal.fire({
            icon: 'success',
            title: '¡Eliminado!',
            text: 'Laboratorio eliminado exitosamente',
            timer: 2000,
            showConfirmButton: false
          });
          this.mensajeExitoLaboratorio = 'Laboratorio eliminado exitosamente';
          this.errorLaboratorios = null;
          this.cargarLaboratorios();
        },
        error: err => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.error?.message || 'Error al eliminar laboratorio'
          });
          this.errorLaboratorios = err.error?.message || 'Error al eliminar laboratorio';
          this.mensajeExitoLaboratorio = null;
        }
      });
    }
  });
}
// Seleccionar laboratorio para editar
editarLaboratorio(lab: any): void {
  this.laboratorioSeleccionado = { ...lab };
  this.mostrarModalCrearLaboratorio = true;
  this.mensajeExitoLaboratorio = null;
  this.errorLaboratorios = null;
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
  this.cargarLaboratorios(); // <-- Asegúrate de cargar los laboratorios aquí
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
  this.laboratoriosConComputadoras = [];
  this.cargarLaboratoriosConComputadoras();
}

cargarLaboratoriosConComputadoras(): void {
  this.cargandoComputadoras = true;
  this.gestionLaboratoriosService.obtenerLaboratorios().subscribe({
    next: resp => {
      const labs = resp.data;
      const peticiones = labs.map(lab =>
        this.gestionLaboratoriosService.obtenerComputadorasPorLaboratorio(lab.id)
      );
      forkJoin(peticiones).subscribe({
        next: resultados => {
          this.laboratoriosConComputadoras = labs.map((lab, i) => ({
            laboratorio: lab,
            computadoras: resultados[i]
          }));
          this.cargandoComputadoras = false;
        },
        error: err => {
          this.cargandoComputadoras = false;
          this.laboratoriosConComputadoras = [];
        }
      });
    },
    error: err => {
      this.cargandoComputadoras = false;
      this.laboratoriosConComputadoras = [];
    }
  });
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
  this.laboratorioSeleccionado = { nombre: '', ubicacion: '' }; // <-- Inicializa vacío
  this.mostrarModalCrearLaboratorio = true;
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

