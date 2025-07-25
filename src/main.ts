import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app/app-routing.module';
import { AppComponent } from './app/app.component';
import { AuthGuard } from './app/services/auth.guard';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),
    AuthGuard
  ]
}).catch(err => console.error(err));
