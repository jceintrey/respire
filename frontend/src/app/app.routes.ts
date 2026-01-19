import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
    canActivate: [authGuard],
  },
  {
    path: 'breathe',
    loadComponent: () =>
      import('./features/breathing/breathing.component').then(
        (m) => m.BreathingComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'breathe/:patternId',
    loadComponent: () =>
      import('./features/breathing/breathing.component').then(
        (m) => m.BreathingComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'patterns',
    loadComponent: () =>
      import('./features/patterns/patterns.component').then(
        (m) => m.PatternsComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'patterns/new',
    loadComponent: () =>
      import('./features/patterns/pattern-form.component').then(
        (m) => m.PatternFormComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'patterns/:id/edit',
    loadComponent: () =>
      import('./features/patterns/pattern-form.component').then(
        (m) => m.PatternFormComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./features/history/history.component').then(
        (m) => m.HistoryComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'stats',
    loadComponent: () =>
      import('./features/stats/stats.component').then((m) => m.StatsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'auth/register',
    loadComponent: () =>
      import('./features/auth/register.component').then(
        (m) => m.RegisterComponent
      ),
    canActivate: [guestGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
