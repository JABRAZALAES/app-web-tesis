import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTrophy, faMedal, faUser, faCrown } from '@fortawesome/free-solid-svg-icons';

// Define una interfaz para los datos del usuario para una mejor seguridad de tipo
interface UserRanking {
  nombre_usuario: string;
  total_actividad: number;
}

@Component({
  selector: 'app-podium-ranking',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <div class="max-w-5xl mx-auto p-6 font-sans bg-gray-50 rounded-lg shadow-xl">
      <div class="bg-gray-100 p-4 rounded-t-lg -mx-6 -mt-6 mb-8 border-b border-gray-200">
        <h3 class="text-xl font-semibold text-gray-700">Podio de Rankings</h3>
      </div>

      <div class="text-center mb-10 pt-4">
        <h3 class="text-3xl font-extrabold text-gray-800 mb-2 drop-shadow-sm">🏆 Top 10 Usuarios Activos 🏆</h3>
        <p class="text-lg text-gray-600">¡Mira quién está liderando el camino con su actividad!</p>
      </div>

      <div *ngIf="!users || users.length === 0" class="text-center py-20 text-gray-400">
        <fa-icon [icon]="faUser" class="text-8xl mb-6 mx-auto text-blue-300 animate-bounce-slow"></fa-icon>
        <h3 class="text-3xl font-bold mb-3 text-gray-700">¡Oops! No hay datos de ranking aún.</h3>
        <p class="text-xl px-4">Parece que no se encontraron usuarios con actividad en el período seleccionado. ¡Anímate a ser el primero!</p>
      </div>

      <div *ngIf="users && users.length > 0" class="flex justify-center items-end gap-6 mb-12 flex-wrap">
        <ng-container *ngIf="users[1]">
          <div class="podium-item podium-second bg-gradient-to-br from-blue-100 to-blue-200 border-b-4 border-blue-500 hover:shadow-2xl transition-all duration-300">
            <div class="relative -top-8 text-gray-500">
              <fa-icon [icon]="faMedal" class="text-4xl text-gray-500 drop-shadow-md"></fa-icon>
            </div>
            <div class="avatar-circle bg-white shadow-lg border-2 border-blue-300">
              <fa-icon [icon]="faUser" class="text-5xl text-blue-500"></fa-icon>
            </div>
            <div class="user-name-container text-center mt-3">
              <h4 class="font-semibold text-gray-800 text-sm leading-snug">{{ users[1].nombre_usuario }}</h4>
            </div>
            <p class="text-xs text-gray-600 mb-2">{{ users[1].total_actividad }} reportes</p>
            <span class="rank-badge bg-blue-500 text-white font-extrabold text-lg">2°</span>
          </div>
        </ng-container>

        <ng-container *ngIf="users[0]">
          <div class="podium-item podium-first bg-gradient-to-br from-yellow-100 to-yellow-200 border-b-4 border-yellow-500 hover:shadow-2xl transition-all duration-300">
            <div class="relative -top-10 text-yellow-600 animate-wiggle">
              <fa-icon [icon]="faCrown" class="text-5xl text-yellow-500 drop-shadow-lg"></fa-icon>
            </div>
            <div class="avatar-circle bg-white shadow-xl border-4 border-yellow-400 w-28 h-28">
              <fa-icon [icon]="faUser" class="text-6xl text-yellow-600"></fa-icon>
            </div>
            <div class="user-name-container text-center mt-4">
              <h4 class="font-extrabold text-gray-900 text-base leading-snug">{{ users[0].nombre_usuario }}</h4>
            </div>
            <p class="text-sm text-gray-700 mb-3">{{ users[0].total_actividad }} reportes</p>
            <span class="rank-badge bg-yellow-500 text-white font-extrabold text-xl">1°</span>
          </div>
        </ng-container>

        <ng-container *ngIf="users[2]">
          <div class="podium-item podium-third bg-gradient-to-br from-orange-100 to-orange-200 border-b-4 border-orange-500 hover:shadow-2xl transition-all duration-300">
            <div class="relative -top-8 text-orange-500">
              <fa-icon [icon]="faMedal" class="text-4xl text-orange-500 drop-shadow-md"></fa-icon>
            </div>
            <div class="avatar-circle bg-white shadow-lg border-2 border-orange-300">
              <fa-icon [icon]="faUser" class="text-5xl text-orange-500"></fa-icon>
            </div>
            <div class="user-name-container text-center mt-3">
              <h4 class="font-semibold text-gray-800 text-sm leading-snug">{{ users[2].nombre_usuario }}</h4>
            </div>
            <p class="text-xs text-gray-600 mb-2">{{ users[2].total_actividad }} reportes</p>
            <span class="rank-badge bg-orange-500 text-white font-extrabold text-lg">3°</span>
          </div>
        </ng-container>
      </div>

      <div *ngIf="users && users.length > 3" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 mb-8">
        <div *ngFor="let user of users.slice(3, 10); let i = index"
             class="bg-white rounded-xl p-2 shadow-md flex items-center gap-3 border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer">
          <div class="text-lg font-extrabold text-blue-600 w-8 text-center">{{ i + 4 }}°</div>
          <div class="bg-blue-50 rounded-full w-10 h-10 flex items-center justify-center shadow-inner">
            <fa-icon [icon]="faUser" class="text-blue-400 text-xl"></fa-icon>
          </div>
          <div class="flex-grow">
            <div class="user-name-container-list">
              <h5 class="font-semibold text-gray-800 text-sm leading-snug">{{ user.nombre_usuario }}</h5>
            </div>
            <p class="text-gray-600 text-xs">{{ user.total_actividad }} reportes</p>
          </div>
        </div>
      </div>

      <div *ngIf="users && users.length > 0 && users.length < 10" class="mt-8 text-center text-gray-500 italic text-xs">
        <p>Solo hay {{ users.length }} usuario{{ users.length === 1 ? '' : 's' }} en el ranking actual. ¡Sigue así para llenar el top 10!</p>
      </div>
    </div>
  `,
  styles: [`
    /* Estilos base para los elementos del podio */
    .podium-item {
      @apply relative rounded-xl p-4 flex flex-col items-center shadow-lg transition-all duration-300 ease-in-out;
      min-width: 140px;
      max-width: 170px;
      text-align: center;
      margin-top: 50px;
      justify-content: space-between; /* Distribuye el espacio verticalmente */
    }

    /* Estilos específicos para cada posición del podio */
    .podium-second {
      @apply w-36 h-68; /* Aumentado de h-64 para más espacio vertical */
      transform: translateY(20px);
    }

    .podium-first {
      @apply w-44 h-72 scale-105; /* Aumentado de h-64 para más espacio vertical y mantener la jerarquía */
      z-index: 10;
    }

    .podium-third {
      @apply w-36 h-68; /* Aumentado de h-64 para más espacio vertical */
      transform: translateY(20px);
    }

    /* Círculo de avatar para todos los elementos del podio */
    .avatar-circle {
      @apply rounded-full w-16 h-16 flex items-center justify-center shadow-md mb-2;
      position: relative;
      top: -15px;
    }

    .podium-first .avatar-circle {
        @apply w-20 h-20;
        top: -20px;
    }

    /* Contenedor para nombres de usuario para permitir el ajuste de línea */
    .user-name-container {
      /* Clases para altura consistente y ajuste de texto */
      @apply h-12 flex items-center justify-center overflow-hidden px-1; /* Aumentado de h-10 a h-12 */
      line-height: 1.3; /* Ajuste del interlineado para una mejor visualización multilinea */
    }

    .podium-first .user-name-container {
      @apply h-14; /* Ligeramente más alto para el nombre del primer lugar */
    }

    .user-name-container-list {
        @apply h-10 flex items-center overflow-hidden px-1; /* Aumentado de h-8 a h-10 */
        line-height: 1.3;
    }


    /* Estilo de la insignia de clasificación */
    .rank-badge {
        @apply absolute -bottom-2 px-2 py-0.5 rounded-full shadow-lg;
    }

    /* Keyframe para un rebote suave */
    @keyframes bounce-slow {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-10px);
      }
    }

    .animate-bounce-slow {
      animation: bounce-slow 3s infinite ease-in-out;
    }

    /* Keyframe para un ligero meneo */
    @keyframes wiggle {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-3deg); }
      75% { transform: rotate(3deg); }
    }

    .animate-wiggle {
      animation: wiggle 0.8s ease-in-out infinite;
    }

  `]
})
export class PodiumRankingComponent implements OnChanges {
  @Input() users: UserRanking[] = [];

  faTrophy = faTrophy;
  faMedal = faMedal;
  faUser = faUser;
  faCrown = faCrown;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['users']) {
      // Lógica para ejecutar cuando el input 'users' cambia
    }
  }
}
