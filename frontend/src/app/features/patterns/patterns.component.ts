import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PatternService } from '../../core/services/pattern.service';
import type { BreathingPattern } from '../../core/models/pattern.model';

@Component({
  selector: 'app-patterns',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="patterns-page">
      <header class="page-header">
        <button class="btn btn--ghost btn--icon" routerLink="/">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h1>Exercices</h1>
        <a routerLink="/patterns/new" class="btn btn--ghost btn--icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </a>
      </header>

      <section class="pattern-section">
        <h2>Exercices prédéfinis</h2>
        <div class="pattern-list">
          @for (pattern of presets(); track pattern.id) {
            <div class="pattern-item card" (click)="startPattern(pattern)">
              <div class="pattern-icon" [attr.data-theme]="pattern.theme">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" opacity="0.3" />
                  <circle cx="12" cy="12" r="5" />
                </svg>
              </div>
              <div class="pattern-details">
                <h3>{{ pattern.name }}</h3>
                <p>{{ formatPattern(pattern) }}</p>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="play-icon">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
          }
        </div>
      </section>

      <section class="pattern-section">
        <h2>Mes exercices</h2>
        @if (userPatterns().length === 0) {
          <div class="empty-state card">
            <p>Aucun exercice personnalisé</p>
            <a routerLink="/patterns/new" class="btn btn--primary">
              Créer un exercice
            </a>
          </div>
        } @else {
          <div class="pattern-list">
            @for (pattern of userPatterns(); track pattern.id) {
              <div class="pattern-item card">
                <div class="pattern-icon" [attr.data-theme]="pattern.theme">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" opacity="0.3" />
                    <circle cx="12" cy="12" r="5" />
                  </svg>
                </div>
                <div class="pattern-details" (click)="startPattern(pattern)">
                  <h3>{{ pattern.name }}</h3>
                  <p>{{ formatPattern(pattern) }}</p>
                </div>
                <div class="pattern-actions">
                  <button class="btn btn--ghost btn--icon" (click)="editPattern(pattern)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button class="btn btn--ghost btn--icon" (click)="deletePattern(pattern)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </section>
    </div>
  `,
  styles: `
    .patterns-page {
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

    .pattern-section {
      margin-bottom: var(--space-xl);

      h2 {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: var(--space-md);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    }

    .pattern-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }

    .pattern-item {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      cursor: pointer;
      transition: transform 0.2s;

      &:active {
        transform: scale(0.98);
      }
    }

    .pattern-icon {
      width: 48px;
      height: 48px;
      flex-shrink: 0;

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

    .pattern-details {
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

    .play-icon {
      width: 24px;
      height: 24px;
      color: var(--primary);
      flex-shrink: 0;
    }

    .pattern-actions {
      display: flex;
      gap: var(--space-xs);

      .btn--icon {
        width: 36px;
        height: 36px;

        svg {
          width: 18px;
          height: 18px;
        }
      }
    }

    .empty-state {
      text-align: center;
      padding: var(--space-xl);

      p {
        color: var(--text-muted);
        margin-bottom: var(--space-md);
      }
    }
  `,
})
export class PatternsComponent implements OnInit {
  private patternService = inject(PatternService);
  private router = inject(Router);

  presets = signal<BreathingPattern[]>([]);
  userPatterns = signal<BreathingPattern[]>([]);

  ngOnInit(): void {
    this.loadPatterns();
  }

  private loadPatterns(): void {
    this.patternService.loadPatterns().subscribe({
      next: () => {
        this.presets.set(this.patternService.getPresets());
        this.userPatterns.set(this.patternService.getUserPatterns());
      },
    });
  }

  startPattern(pattern: BreathingPattern): void {
    this.router.navigate(['/breathe', pattern.id]);
  }

  editPattern(pattern: BreathingPattern): void {
    this.router.navigate(['/patterns', pattern.id, 'edit']);
  }

  deletePattern(pattern: BreathingPattern): void {
    if (confirm(`Supprimer "${pattern.name}" ?`)) {
      this.patternService.deletePattern(pattern.id).subscribe({
        next: () => {
          this.userPatterns.update((patterns) =>
            patterns.filter((p) => p.id !== pattern.id)
          );
        },
      });
    }
  }

  formatPattern(pattern: BreathingPattern): string {
    const parts = [];
    parts.push(`${pattern.inhale_duration / 10}s`);
    if (pattern.inhale_hold_duration > 0) {
      parts.push(`${pattern.inhale_hold_duration / 10}s`);
    }
    parts.push(`${pattern.exhale_duration / 10}s`);
    if (pattern.exhale_hold_duration > 0) {
      parts.push(`${pattern.exhale_hold_duration / 10}s`);
    }
    return `${parts.join(' - ')} • ${pattern.cycles} cycles`;
  }
}
