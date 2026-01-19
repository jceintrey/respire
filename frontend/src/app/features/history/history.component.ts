import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../core/services/session.service';
import type { Session } from '../../core/models/session.model';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="history-page">
      <header class="page-header">
        <button class="btn btn--ghost btn--icon" routerLink="/">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h1>Historique</h1>
        <div style="width: 48px"></div>
      </header>

      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
        </div>
      } @else if (sessions().length === 0) {
        <div class="empty-state card">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <p>Aucune séance enregistrée</p>
          <a routerLink="/breathe" class="btn btn--primary">
            Commencer une séance
          </a>
        </div>
      } @else {
        <div class="session-list">
          @for (group of groupedSessions(); track group.date) {
            <div class="date-group">
              <h2 class="date-header">{{ formatDateHeader(group.date) }}</h2>
              <div class="sessions">
                @for (session of group.sessions; track session.id) {
                  <div class="session-item card">
                    <div class="session-icon">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="10" opacity="0.3" />
                        <circle cx="12" cy="12" r="5" />
                      </svg>
                    </div>
                    <div class="session-details">
                      <h3>{{ session.pattern_name }}</h3>
                      <p>
                        {{ formatTime(session.completed_at) }} •
                        {{ session.cycles_completed }} cycles •
                        {{ formatDuration(session.duration_seconds) }}
                      </p>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          @if (hasMore()) {
            <button
              class="btn btn--secondary load-more"
              (click)="loadMore()"
              [disabled]="loadingMore()"
            >
              @if (loadingMore()) {
                <span class="spinner"></span>
              } @else {
                Charger plus
              }
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .history-page {
      padding: var(--space-md);
      padding-top: calc(var(--safe-area-top) + var(--space-md));
      padding-bottom: calc(var(--safe-area-bottom) + 100px);
      max-width: 480px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-xl);

      h1 {
        font-size: 1.25rem;
      }

      .btn--icon svg {
        width: 24px;
        height: 24px;
      }
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: var(--space-2xl);
    }

    .empty-state {
      text-align: center;
      padding: var(--space-2xl);

      svg {
        width: 48px;
        height: 48px;
        color: var(--text-muted);
        margin-bottom: var(--space-md);
      }

      p {
        color: var(--text-muted);
        margin-bottom: var(--space-lg);
      }
    }

    .date-group {
      margin-bottom: var(--space-lg);
    }

    .date-header {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: var(--space-sm);
      text-transform: capitalize;
    }

    .sessions {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }

    .session-item {
      display: flex;
      align-items: center;
      gap: var(--space-md);
    }

    .session-icon {
      width: 40px;
      height: 40px;
      color: var(--primary);
      flex-shrink: 0;

      svg {
        width: 100%;
        height: 100%;
      }
    }

    .session-details {
      flex: 1;
      min-width: 0;

      h3 {
        font-size: 1rem;
        margin-bottom: var(--space-xs);
      }

      p {
        font-size: 0.875rem;
        color: var(--text-muted);
      }
    }

    .load-more {
      width: 100%;
      margin-top: var(--space-md);
    }
  `,
})
export class HistoryComponent implements OnInit {
  private sessionService = inject(SessionService);

  sessions = signal<Session[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  hasMore = signal(false);
  private offset = 0;
  private readonly limit = 20;

  groupedSessions = signal<{ date: string; sessions: Session[] }[]>([]);

  ngOnInit(): void {
    this.loadSessions();
  }

  private loadSessions(): void {
    this.sessionService.getHistory(this.limit, this.offset).subscribe({
      next: (response) => {
        this.sessions.set(response.sessions);
        this.hasMore.set(response.sessions.length === this.limit);
        this.offset = response.sessions.length;
        this.updateGrouped();
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  loadMore(): void {
    this.loadingMore.set(true);
    this.sessionService.getHistory(this.limit, this.offset).subscribe({
      next: (response) => {
        this.sessions.update((s) => [...s, ...response.sessions]);
        this.hasMore.set(response.sessions.length === this.limit);
        this.offset += response.sessions.length;
        this.updateGrouped();
        this.loadingMore.set(false);
      },
      error: () => {
        this.loadingMore.set(false);
      },
    });
  }

  private updateGrouped(): void {
    const groups = new Map<string, Session[]>();

    for (const session of this.sessions()) {
      const date = new Date(session.completed_at).toISOString().split('T')[0];
      if (!groups.has(date)) {
        groups.set(date, []);
      }
      groups.get(date)!.push(session);
    }

    this.groupedSessions.set(
      Array.from(groups.entries()).map(([date, sessions]) => ({
        date,
        sessions,
      }))
    );
  }

  formatDateHeader(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    }

    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
