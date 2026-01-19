import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { BottomNavComponent } from './shared/components/bottom-nav/bottom-nav.component';
import { AuthService } from './core/services/auth.service';
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, BottomNavComponent],
  template: `
    @if (authService.isLoading()) {
      <div class="loading-screen">
        <div class="spinner"></div>
      </div>
    } @else {
      <main class="app-main">
        <router-outlet />
      </main>
      @if (authService.isAuthenticated() && !isBreathingPage()) {
        <app-bottom-nav />
      }
    }
  `,
  styles: `
    .loading-screen {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      min-height: 100dvh;
    }

    .app-main {
      min-height: 100vh;
      min-height: 100dvh;
    }
  `,
})
export class App {
  protected authService = inject(AuthService);
  private router = inject(Router);

  isBreathingPage = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects.startsWith('/breathe'))
    ),
    { initialValue: false }
  );
}
