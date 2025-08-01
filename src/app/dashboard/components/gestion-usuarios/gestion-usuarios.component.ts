import { Component, OnInit } from '@angular/core';
import { AuthService, AuthUsuario } from '../../../services/auth.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, switchMap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gestion-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './gestion-usuarios.component.html',
  styleUrls: ['./gestion-usuarios.component.scss']
})
export class GestionUsuariosComponent implements OnInit {
  usuarios: AuthUsuario[] = [];
  busqueda = new FormControl('');
  cargando = false;
  error: string | null = null;
  activos = 0;
  inactivos = 0;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    console.log('🔍 GestionUsuarios iniciado');

    this.busqueda.valueChanges
      .pipe(
        debounceTime(300),
        switchMap(q => {
          this.cargando = true;
          return this.authService.listarUsuarios(q || '');
        })
      )
      .subscribe({
        next: usuarios => {
          console.log('🔍 Usuarios recibidos en búsqueda:', usuarios);
          this.procesarUsuarios(usuarios);
        },
        error: (err) => {
          console.error('❌ Error en búsqueda:', err);
          this.error = 'Error al cargar usuarios';
          this.cargando = false;
        }
      });

    // Carga inicial
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    console.log('🔍 Iniciando carga de usuarios...');
    this.cargando = true;

    this.authService.listarUsuarios().subscribe({
      next: usuarios => {
        console.log('🔍 Usuarios recibidos del servicio:', usuarios);
        this.procesarUsuarios(usuarios);
      },
      error: (err) => {
        console.error('❌ Error al cargar usuarios:', err);
        this.error = 'Error al cargar usuarios';
        this.cargando = false;
      }
    });
  }

  // 🔍 Método centralizado para procesar usuarios
  private procesarUsuarios(usuarios: AuthUsuario[]) {
    console.log('🔍 Procesando usuarios antes del mapeo:', usuarios);

    this.usuarios = usuarios.map((u, index) => {
      const usuarioMapeado = {
        ...u,
        activo: Number(u.activo)
      };

      console.log(`🔍 Usuario ${index + 1} mapeado:`, {
        nombre: u.nombre,
        activo_original: u.activo,
        activo_tipo_original: typeof u.activo,
        activo_mapeado: usuarioMapeado.activo,
        activo_tipo_mapeado: typeof usuarioMapeado.activo
      });

      return usuarioMapeado;
    });

    console.log('🔍 Usuarios finales en componente:', this.usuarios);

    this.contarUsuarios();
    this.cargando = false;
    this.error = null;
  }

  private contarUsuarios() {
    this.activos = this.usuarios.filter(u => u.activo === 1).length;
    this.inactivos = this.usuarios.filter(u => u.activo === 0).length;

    console.log('🔍 Conteo de usuarios:', {
      total: this.usuarios.length,
      activos: this.activos,
      inactivos: this.inactivos,
      detalle: this.usuarios.map(u => ({
        nombre: u.nombre,
        activo: u.activo,
        tipo: typeof u.activo
      }))
    });
  }

  obtenerValorSelect(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }

  obtenerValorSelectEstado(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }

  activarDesactivarUsuario(usuario: AuthUsuario, valor: string) {
    const nuevoEstado = Number(valor);

    console.log('🔍 Cambio de estado solicitado:', {
      usuario: usuario.nombre,
      estadoActual: usuario.activo,
      tipoEstadoActual: typeof usuario.activo,
      nuevoEstado: nuevoEstado,
      tipoNuevoEstado: typeof nuevoEstado,
      valorSelect: valor
    });

    if (usuario.activo !== nuevoEstado) {
      this.authService.cambiarEstadoUsuario(usuario.id, nuevoEstado).subscribe({
        next: (response) => {
          console.log('✅ Estado actualizado exitosamente:', {
            usuario: usuario.nombre,
            estadoAnterior: usuario.activo,
            estadoNuevo: nuevoEstado,
            response: response
          });

          usuario.activo = nuevoEstado;
          this.contarUsuarios();
          this.error = null;

          // 🔍 VERIFICAR QUE EL CAMBIO SE APLICÓ
          console.log('🔍 Usuario después del cambio:', {
            nombre: usuario.nombre,
            activo: usuario.activo,
            tipo: typeof usuario.activo
          });
        },
        error: (err) => {
          console.error('❌ Error al cambiar estado:', err);
          this.error = 'Error al cambiar estado del usuario';
        }
      });
    } else {
      console.log('⚠️ No se hace cambio porque el estado es el mismo');
    }
  }

  cambiarRol(usuario: AuthUsuario, nuevoRol: string) {
    if (usuario.rol !== nuevoRol) {
      this.authService.cambiarRolUsuario(usuario.id, nuevoRol).subscribe({
        next: (response) => {
          console.log('✅ Rol cambiado:', response);
          usuario.rol = nuevoRol;
          this.error = null;
        },
        error: (err) => {
          console.error('❌ Error al cambiar rol:', err);
          this.error = 'Error al cambiar rol';
        }
      });
    }
  }
} 
