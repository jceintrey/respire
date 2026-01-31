import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PatternService } from '../../core/services/pattern.service';
import { SessionService } from '../../core/services/session.service';
import type { SessionStats } from '../../core/models/session.model';
import type { BreathingPattern } from '../../core/models/pattern.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="home-page">
      <header class="home-header">
        <div>
          <p class="greeting">Bonjour{{ userName() ? ', ' + userName() : '' }}</p>
          <h1>Prêt à respirer ?</h1>
        </div>
        <button class="btn btn--ghost btn--icon" (click)="logout()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </header>

      @if (stats()) {
        <section class="streak-card card">
          <div class="streak-info">
            <div class="streak-number">{{ stats()!.currentStreak }}</div>
            <div class="streak-label">jours consécutifs</div>
          </div>
          <div class="streak-details">
            <div class="stat-item">
              <span class="stat-value">{{ stats()!.totalSessions }}</span>
              <span class="stat-label">séances</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ stats()!.totalMinutes }}</span>
              <span class="stat-label">minutes</span>
            </div>
          </div>
        </section>
      }

      <section class="quick-start">
        <h2>Démarrage rapide</h2>
        <div class="pattern-grid">
          @for (pattern of presets(); track pattern.id) {
            <button
              class="pattern-card card"
              (click)="startSession(pattern)"
            >
              <div class="pattern-icon" [attr.data-theme]="pattern.theme">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" opacity="0.3" />
                  <circle cx="12" cy="12" r="5" />
                </svg>
              </div>
              <div class="pattern-info">
                <h3>{{ pattern.name }}</h3>
                <p>{{ formatDuration(pattern) }}</p>
              </div>
            </button>
          }
        </div>
      </section>

      <section class="actions">
        <a routerLink="/patterns" class="action-link card">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span>Mes exercices</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="chevron">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </a>

        <a routerLink="/history" class="action-link card">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Historique</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="chevron">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </a>

        @if (isAdmin()) {
          <a routerLink="/admin" class="action-link card action-link--admin">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 4.354a4 4 0 1 1 0 5.292M15 21H3v-1a6 6 0 0 1 12 0v1zm0 0h6v-1a6 6 0 0 0-9-5.197M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />
            </svg>
            <span>Administration</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="chevron">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </a>
        }
      </section>
    </div>
  `,
  styles: `
    .home-page {
      padding: var(--space-md);
      padding-top: calc(var(--safe-area-top) + var(--space-md));
      padding-bottom: calc(var(--safe-area-bottom) + 100px);
      max-width: 480px;
      margin: 0 auto;
    }

    .home-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-xl);

      .greeting {
        color: var(--text-secondary);
        font-size: 0.875rem;
        margin-bottom: var(--space-xs);
      }

      h1 {
        font-size: 1.5rem;
      }

      .btn--icon svg {
        width: 20px;
        height: 20px;
      }
    }

    .streak-card {
      display: flex;
      align-items: center;
      gap: var(--space-lg);
      margin-bottom: var(--space-xl);
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      color: white;

      .streak-info {
        text-align: center;
        padding-right: var(--space-lg);
        border-right: 1px solid rgba(255, 255, 255, 0.2);
      }

      .streak-number {
        font-size: 2.5rem;
        font-weight: 700;
        line-height: 1;
      }

      .streak-label {
        font-size: 0.75rem;
        opacity: 0.9;
        margin-top: var(--space-xs);
      }

      .streak-details {
        display: flex;
        gap: var(--space-lg);
      }

      .stat-item {
        text-align: center;
      }

      .stat-value {
        display: block;
        font-size: 1.25rem;
        font-weight: 600;
      }

      .stat-label {
        font-size: 0.75rem;
        opacity: 0.9;
      }
    }

    .quick-start {
      margin-bottom: var(--space-xl);

      h2 {
        font-size: 1rem;
        color: var(--text-secondary);
        margin-bottom: var(--space-md);
      }
    }

    .pattern-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-md);
    }

    .pattern-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: var(--space-lg);
      border: none;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }

      &:active {
        transform: translateY(0);
      }
    }

    .pattern-icon {
      width: 48px;
      height: 48px;
      margin-bottom: var(--space-sm);

      &[data-theme="ocean"] { color: var(--bubble-ocean); }
      &[data-theme="forest"] { color: var(--bubble-forest); }
      &[data-theme="sunset"] { color: var(--bubble-sunset); }
      &[data-theme="night"] { color: var(--bubble-night); }
      &[data-theme="dawn"] { color: var(--bubble-dawn); }

      svg {
        width: 100%;
        height: 100%;
      }
    }

    .pattern-info {
      h3 {
        font-size: 0.875rem;
        margin-bottom: var(--space-xs);
      }

      p {
        font-size: 0.75rem;
        color: var(--text-muted);
      }
    }

    .actions {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }

    .action-link {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      text-decoration: none;
      color: var(--text-primary);

      svg {
        width: 24px;
        height: 24px;
        color: var(--text-secondary);
      }

      span {
        flex: 1;
        font-weight: 500;
      }

      .chevron {
        width: 20px;
        height: 20px;
        color: var(--text-muted);
      }

      &--admin {
        border: 1px solid var(--primary);

        svg:first-child {
          color: var(--primary);
        }
      }
    }
  `,
})
export class HomeComponent implements OnInit {
  private authService = inject(AuthService);
  private patternService = inject(PatternService);
  private sessionService = inject(SessionService);
  private router = inject(Router);

  userName = signal<string | null>(null);
  stats = signal<SessionStats | null>(null);
  presets = signal<BreathingPattern[]>([]);
  isAdmin = signal(false);

  ngOnInit(): void {
    const user = this.authService.user();
    this.userName.set(user?.name || null);
    this.isAdmin.set(user?.isAdmin || false);

    this.patternService.loadPatterns().subscribe({
      next: () => {
        this.presets.set(this.patternService.getPresets().slice(0, 4));
      },
    });

    this.sessionService.getStats().subscribe({
      next: (response) => {
        this.stats.set(response.stats);
      },
    });
  }

  startSession(pattern: BreathingPattern): void {
    this.router.navigate(['/breathe', pattern.id]);
  }

  formatDuration(pattern: BreathingPattern): string {
    const cycleDuration =
      pattern.inhale_duration +
      pattern.inhale_hold_duration +
      pattern.exhale_duration +
      pattern.exhale_hold_duration;
    const totalSeconds = (cycleDuration * pattern.cycles) / 10;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.round(totalSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  logout(): void {
    this.authService.logout();
  }
}
