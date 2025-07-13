import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

// FontAwesome
import { faEnvelope, faLock, faEye, faEyeSlash, faShieldAlt } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: false
})
export class LoginComponent {
  correo: string = '';
  contrasena: string = '';
  mostrarPassword: boolean = false;
  errorLogin: string = '';

  // FontAwesome icons
  faEnvelope = faEnvelope;
  faLock = faLock;
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faShieldAlt = faShieldAlt;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  onSubmit(): void {
    if (!this.correo || !this.contrasena) {
      this.errorLogin = 'Debes ingresar usuario y contraseña.';
      return;
    }

    this.authService.login(this.correo, this.contrasena).subscribe({
      next: (response: any) => {
        const rolesPermitidos = ['jefe', 'tecnico'];

        if (!rolesPermitidos.includes(response.usuario.rol)) {
          this.authService.logout();
          this.errorLogin = 'Solo usuarios autorizados (jefe/técnico) pueden acceder.';
          return;
        }

        localStorage.setItem('token', response.token);
        localStorage.setItem('usuario', JSON.stringify(response.usuario));

        this.errorLogin = ''; // Limpia errores
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.errorLogin = error?.message || 'Usuario o contraseña incorrectos';
        console.error('Error en login:', this.errorLogin);
      }
    });
  }
}
