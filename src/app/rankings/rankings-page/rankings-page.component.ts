import { Component, OnInit } from '@angular/core';
import { ReportesService } from '../../services/reportes.service';
import { PodiumRankingComponent } from '../../dashboard/components/podium-ranking.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-rankings-page',
  standalone: true,
  imports: [PodiumRankingComponent],
  template: `
    <div class="p-6">
      <div class="flex justify-end mb-4">
        <button (click)="logout()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold shadow">
          Cerrar sesión
        </button>
      </div>
      <app-podium-ranking [users]="top10UsuariosPodio"></app-podium-ranking>
    </div>
  `
})
export class RankingsPageComponent implements OnInit {
  top10UsuariosPodio: any[] = [];

  constructor(private reportesService: ReportesService, private authService: AuthService) {}

  ngOnInit(): void {
    this.reportesService.getRankingUsuarios({}).subscribe(resp => {
      this.top10UsuariosPodio = resp.data;
      console.log('👑 Ranking cargado:', this.top10UsuariosPodio);
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
