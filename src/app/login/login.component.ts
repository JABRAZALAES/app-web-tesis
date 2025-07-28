import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

interface LoginForm {
  correo: string;
  contrasena: string;
}

interface AuthResponse {
  token: string;
  usuario: {
    id: string;
    correo: string;
    rol: string;
    nombre?: string;
  };
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class LoginComponent implements OnInit, OnDestroy {
  // ===== PROPIEDADES DEL FORMULARIO =====
  correo: string = '';
  contrasena: string = '';
  mostrarPassword: boolean = false;
  errorLogin: string = '';
  isLoading: boolean = false;

  // ===== CONFIGURACIÓN =====
  private readonly ROLES_PERMITIDOS = ['jefe', 'tecnico', 'normal'] as const;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.verificarSesionExistente();
    this.limpiarErroresPrevios();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== MÉTODOS PÚBLICOS =====

  /**
   * Alterna la visibilidad de la contraseña
   */
  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  /**
   * Maneja el envío del formulario de login
   */
  onSubmit(): void {
    if (!this.validarFormulario()) {
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: this.errorLogin,
        confirmButtonColor: '#4B73E8'
      });
      return;
    }

    this.iniciarProcesLogin();

    const credentials: LoginForm = {
      correo: this.correo.trim().toLowerCase(),
      contrasena: this.contrasena
    };

    this.authService.login(credentials.correo, credentials.contrasena)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: AuthResponse) => this.manejarLoginExitoso(response),
        error: (error) => this.manejarErrorLogin(error),
        complete: () => this.finalizarProcesLogin()
      });
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Verifica si ya existe una sesión activa
   */
  private verificarSesionExistente(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  /**
   * Limpia errores previos al inicializar
   */
  private limpiarErroresPrevios(): void {
    this.errorLogin = '';
  }

  /**
   * Valida los campos del formulario antes del envío
   */
  private validarFormulario(): boolean {
    if (!this.correo?.trim() || !this.contrasena?.trim()) {
      this.errorLogin = 'Por favor, complete todos los campos requeridos';
      return false;
    }

    if (!this.esEmailValido(this.correo)) {
      this.errorLogin = 'Por favor, ingrese un correo electrónico válido';
      return false;
    }

    if (this.contrasena.length < 6) {
      this.errorLogin = 'La contraseña debe tener al menos 6 caracteres';
      return false;
    }

    return true;
  }

  /**
   * Valida el formato del email
   */
  private esEmailValido(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Inicia el proceso de login
   */
  private iniciarProcesLogin(): void {
    this.isLoading = true;
    this.errorLogin = '';
  }

  /**
   * Finaliza el proceso de login
   */
  private finalizarProcesLogin(): void {
    this.isLoading = false;
  }

  /**
   * Maneja respuesta exitosa del login
   */
  private manejarLoginExitoso(response: AuthResponse): void {
    try {
      const rolUsuario = response.usuario.rol;

      if (!this.esRolPermitido(rolUsuario)) {
        this.authService.logout();
        Swal.fire({
          icon: 'error',
          title: 'Acceso denegado',
          text: 'Solo usuarios autorizados pueden ingresar',
          confirmButtonColor: '#4B73E8'
        });
        return;
      }

      this.guardarSesion(response);
      this.limpiarFormulario();

      // Mensaje de bienvenida
      Swal.fire({
        icon: 'success',
        title: '¡Bienvenido!',
        text: `Hola, ${response.usuario.nombre || response.usuario.correo}`,
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        // Redirección por rol
        if (rolUsuario === 'normal') {
          this.router.navigate(['/rankings']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      });

    } catch (error) {
      console.error('Error procesando respuesta de login:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error interno',
        text: 'Por favor, intente nuevamente',
        confirmButtonColor: '#4B73E8'
      });
    }
  }

  /**
   * Verifica si el rol está permitido
   */
  private esRolPermitido(rol: string): boolean {
    return this.ROLES_PERMITIDOS.includes(rol as typeof this.ROLES_PERMITIDOS[number]);
  }

  /**
   * Guarda la información de sesión
   */
  private guardarSesion(response: AuthResponse): void {
    localStorage.setItem('token', response.token);
    localStorage.setItem('usuario', JSON.stringify(response.usuario));
  }

  /**
   * Limpia los campos del formulario
   */
  private limpiarFormulario(): void {
    this.correo = '';
    this.contrasena = '';
    this.mostrarPassword = false;
    this.errorLogin = '';
  }

  /**
   * Redirige al dashboard
   */
  private redirigirDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Maneja errores de login
   */
  private manejarErrorLogin(error: any): void {
    try {
      console.error('Error en login:', JSON.stringify(error));

      let mensajeError = 'Ha ocurrido un error inesperado';

      if (error?.status === 401) {
        mensajeError = 'Credenciales incorrectas. Verifique su correo y contraseña';
      } else if (error?.status === 403) {
        mensajeError = 'Acceso denegado. No tiene permisos para acceder al sistema';
      } else if (error?.status === 429) {
        mensajeError = 'Demasiados intentos de login. Intente nuevamente en unos minutos';
      } else if (error?.status === 0) {
        mensajeError = 'Error de conexión. Verifique su conexión a internet';
      } else if (error?.error?.message) {
        mensajeError = error.error.message;
      } else if (error?.message) {
        mensajeError = error.message;
      }

      Swal.fire({
        icon: 'error',
        title: 'Error de inicio de sesión',
        text: mensajeError,
        confirmButtonColor: '#4B73E8'
      });
      this.errorLogin = mensajeError;
    } catch (e) {
      console.error('Error procesando el error de login:', e);
      Swal.fire({
        icon: 'error',
        title: 'Error desconocido',
        text: 'Ocurrió un error inesperado',
        confirmButtonColor: '#4B73E8'
      });
      this.errorLogin = 'Error desconocido';
    }
  }

  // ===== MÉTODOS AUXILIARES PARA TEMPLATE =====

  /**
   * Verifica si el formulario es válido para mostrar estados visuales
   */
  get formularioValido(): boolean {
    return !!(this.correo?.trim() && this.contrasena?.trim() && this.contrasena.length >= 6);
  }

  /**
   * Verifica si se debe mostrar el loading
   */
  get mostrarLoading(): boolean {
    return this.isLoading;
  }
}
