import { Component, OnInit } from '@angular/core';
import { ReportesService } from '../../services/reportes.service';
import { PodiumRankingComponent } from '../../dashboard/components/podium-ranking.component';

@Component({
  selector: 'app-rankings-page',
  standalone: true,
  imports: [PodiumRankingComponent],
  template: `
    <div class="p-6">
      <app-podium-ranking [users]="top10UsuariosPodio"></app-podium-ranking>
    </div>
  `
})
export class RankingsPageComponent implements OnInit {
  top10UsuariosPodio: any[] = [];

  constructor(private reportesService: ReportesService) {}

  ngOnInit(): void {
    this.reportesService.getRankingUsuarios({}).subscribe(resp => {
      this.top10UsuariosPodio = resp.data;
      console.log('👑 Ranking cargado:', this.top10UsuariosPodio);
    });
  }
}
