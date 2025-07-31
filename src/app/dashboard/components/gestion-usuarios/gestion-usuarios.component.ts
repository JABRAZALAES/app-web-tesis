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

  constructor(private authService: AuthService) {}

  ngOnInit() {
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
          this.usuarios = usuarios.map(u => ({
            ...u,
            rol: u.rol === 'normal' ? 'estudiante' : u.rol
          }));
          this.cargando = false;
        },
        error: () => {
          this.error = 'Error al cargar usuarios';
          this.cargando = false;
        }
      });

    // Carga inicial
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.cargando = true;
    this.authService.listarUsuarios().subscribe({
      next: usuarios => {
        this.usuarios = usuarios.map(u => ({
          ...u,
          rol: u.rol === 'normal' ? 'estudiante' : u.rol
        }));
        this.cargando = false;
      },
      error: () => {
        this.error = 'Error al cargar usuarios';
        this.cargando = false;
      }
    });
  }
    // ...existing code...
  obtenerValorSelect(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }
  // ...existing code...

  cambiarRol(usuario: AuthUsuario, nuevoRol: string) {
    this.authService.cambiarRolUsuario(usuario.id, nuevoRol).subscribe({
      next: () => usuario.rol = nuevoRol === 'normal' ? 'estudiante' : nuevoRol,
      error: () => this.error = 'Error al cambiar rol'
    });
  }
}
