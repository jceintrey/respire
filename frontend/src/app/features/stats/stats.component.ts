import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../core/services/session.service';
import type { SessionStats } from '../../core/models/session.model';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="stats-page">
      <header class="page-header">
        <h1>Statistiques</h1>
      </header>

      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
        </div>
      } @else if (stats()) {
        <section class="stats-overview">
          <div class="stat-card card stat-card--primary">
            <div class="stat-value">{{ stats()!.currentStreak }}</div>
            <div class="stat-label">Jours consécutifs</div>
            <div class="stat-sublabel">
              Record : {{ stats()!.longestStreak }} jours
            </div>
          </div>

          <div class="stat-grid">
            <div class="stat-card card">
              <div class="stat-value">{{ stats()!.totalSessions }}</div>
              <div class="stat-label">Séances</div>
            </div>
            <div class="stat-card card">
              <div class="stat-value">{{ stats()!.totalMinutes }}</div>
              <div class="stat-label">Minutes</div>
            </div>
            <div class="stat-card card">
              <div class="stat-value">{{ stats()!.weeklyAverage }}</div>
              <div class="stat-label">Séances/sem</div>
            </div>
          </div>
        </section>

        <section class="weekly-section">
          <h2>Cette semaine</h2>
          <div class="weekly-chart card">
            <div class="chart-bars">
              @for (day of weekDays(); track day.date) {
                <div class="bar-container">
                  <div
                    class="bar"
                    [style.height.%]="getBarHeight(day.minutes)"
                    [class.active]="day.minutes > 0"
                  ></div>
                  <span class="bar-label">{{ day.label }}</span>
                </div>
              }
            </div>
          </div>
        </section>

        <section class="motivation-section">
          <div class="motivation-card card">
            <div class="motivation-icon">
              @if (stats()!.currentStreak >= 7) {
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              } @else if (stats()!.currentStreak >= 3) {
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.5 3c-1.8 0-3.5.7-4.8 2L12 8.3l3.3-3.3c-1.3-1.3-3-2-4.8-2z" />
                  <path d="M12 21.5l7-7c1.9-1.9 1.9-5 0-6.9l-7 7-7-7c-1.9 1.9-1.9 5 0 6.9l7 7z" />
                </svg>
              } @else {
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" />
                </svg>
              }
            </div>
            <p class="motivation-text">{{ getMotivationText() }}</p>
          </div>
        </section>

        <section class="actions-section">
          <a routerLink="/breathe" class="btn btn--primary btn--large action-btn">
            Nouvelle séance
          </a>
          <a routerLink="/history" class="btn btn--secondary action-btn">
            Voir l'historique
          </a>
        </section>
      }
    </div>
  `,
  styles: `
    .stats-page {
      padding: var(--space-md);
      padding-top: calc(var(--safe-area-top) + var(--space-md));
      padding-bottom: calc(var(--safe-area-bottom) + 100px);
      max-width: 480px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: var(--space-xl);

      h1 {
        font-size: 1.5rem;
      }
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: var(--space-2xl);
    }

    .stats-overview {
      margin-bottom: var(--space-xl);
    }

    .stat-card {
      text-align: center;
      padding: var(--space-lg);

      &--primary {
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        color: white;
        margin-bottom: var(--space-md);
      }

      .stat-value {
        font-size: 2.5rem;
        font-weight: 700;
        line-height: 1;
      }

      .stat-label {
        font-size: 0.875rem;
        margin-top: var(--space-xs);
        opacity: 0.9;
      }

      .stat-sublabel {
        font-size: 0.75rem;
        margin-top: var(--space-xs);
        opacity: 0.7;
      }
    }

    .stat-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-sm);

      .stat-card {
        padding: var(--space-md);

        .stat-value {
          font-size: 1.5rem;
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
      }
    }

    .weekly-section {
      margin-bottom: var(--space-xl);

      h2 {
        font-size: 1rem;
        color: var(--text-secondary);
        margin-bottom: var(--space-md);
      }
    }

    .weekly-chart {
      padding: var(--space-lg);
    }

    .chart-bars {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      height: 120px;
    }

    .bar-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      height: 100%;
    }

    .bar {
      width: 24px;
      background: var(--border);
      border-radius: var(--radius-sm) var(--radius-sm) 0 0;
      margin-top: auto;
      min-height: 4px;
      transition: height 0.3s ease;

      &.active {
        background: linear-gradient(180deg, var(--primary), var(--secondary));
      }
    }

    .bar-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: var(--space-sm);
    }

    .motivation-section {
      margin-bottom: var(--space-xl);
    }

    .motivation-card {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);

      .motivation-icon {
        width: 48px;
        height: 48px;
        flex-shrink: 0;
        color: #ff6b6b;

        svg {
          width: 100%;
          height: 100%;
        }
      }

      .motivation-text {
        font-size: 0.875rem;
        color: #5a4a42;
        line-height: 1.5;
      }
    }

    .actions-section {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }

    .action-btn {
      width: 100%;
      text-align: center;
    }
  `,
})
export class StatsComponent implements OnInit {
  private sessionService = inject(SessionService);

  stats = signal<SessionStats | null>(null);
  loading = signal(true);
  weekDays = signal<{ date: string; label: string; minutes: number }[]>([]);

  private maxMinutes = 0;

  ngOnInit(): void {
    this.sessionService.getStats().subscribe({
      next: (response) => {
        this.stats.set(response.stats);
        this.processWeekData(response.stats);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  private processWeekData(stats: SessionStats): void {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const today = new Date();
    const result = [];

    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = stats.lastWeek.find((d) => d.date === dateStr);

      result.push({
        date: dateStr,
        label: days[date.getDay()],
        minutes: dayData?.minutes || 0,
      });

      if (dayData?.minutes && dayData.minutes > this.maxMinutes) {
        this.maxMinutes = dayData.minutes;
      }
    }

    this.weekDays.set(result);
  }

  getBarHeight(minutes: number): number {
    if (this.maxMinutes === 0) return 5;
    return Math.max(5, (minutes / this.maxMinutes) * 100);
  }

  getMotivationText(): string {
    const s = this.stats();
    if (!s) return '';

    if (s.currentStreak >= 30) {
      return 'Incroyable ! Un mois de pratique quotidienne. Vous êtes un expert de la cohérence cardiaque !';
    }
    if (s.currentStreak >= 14) {
      return 'Deux semaines consécutives ! Votre pratique régulière porte ses fruits.';
    }
    if (s.currentStreak >= 7) {
      return 'Une semaine complète ! La régularité est la clé du bien-être.';
    }
    if (s.currentStreak >= 3) {
      return 'Beau travail ! Continuez sur cette lancée pour créer une habitude durable.';
    }
    if (s.currentStreak >= 1) {
      return 'Chaque séance compte. Revenez demain pour construire votre série !';
    }
    if (s.totalSessions > 0) {
      return "Commencez une nouvelle série aujourd'hui. Votre corps vous remerciera.";
    }
    return 'Bienvenue ! Faites votre première séance pour découvrir les bienfaits de la cohérence cardiaque.';
  }
}
