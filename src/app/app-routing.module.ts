import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PodiumRankingComponent } from './dashboard/components/podium-ranking.component';
import { AuthGuard } from './services/auth.guard';
import { RankingsPageComponent } from './rankings/rankings-page/rankings-page.component'; // Agrega este import arriba


export const routes: Routes = [

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    data: { roles: ['jefe', 'tecnico'] } // Solo estos roles pueden entrar
  },
{
  path: 'rankings',
  component: RankingsPageComponent,
  canActivate: [AuthGuard],
  data: { roles: ['normal', 'jefe', 'tecnico'] }
},
  {
    path: '**',
    redirectTo: 'login'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
