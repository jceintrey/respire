import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PatternService } from '../../core/services/pattern.service';
import type { BreathingPattern } from '../../core/models/pattern.model';

@Component({
  selector: 'app-pattern-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="pattern-form-page">
      <header class="page-header">
        <button class="btn btn--ghost btn--icon" routerLink="/patterns">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h1>{{ isEditing() ? 'Modifier' : 'Nouvel exercice' }}</h1>
        <div style="width: 48px"></div>
      </header>

      <form (ngSubmit)="onSubmit()" class="pattern-form">
        <div class="form-group">
          <label for="name">Nom de l'exercice</label>
          <input
            type="text"
            id="name"
            name="name"
            class="input"
            [(ngModel)]="name"
            required
            placeholder="Ex: Ma respiration"
          />
        </div>

        <div class="timing-section">
          <h2>Durées (en secondes)</h2>

          <div class="timing-grid">
            <div class="form-group">
              <label for="inhale">Inspiration</label>
              <input
                type="number"
                id="inhale"
                name="inhale"
                class="input"
                [(ngModel)]="inhaleDuration"
                min="1"
                max="20"
                required
              />
            </div>

            <div class="form-group">
              <label for="inhaleHold">Blocage (inspi)</label>
              <input
                type="number"
                id="inhaleHold"
                name="inhaleHold"
                class="input"
                [(ngModel)]="inhaleHoldDuration"
                min="0"
                max="20"
              />
            </div>

            <div class="form-group">
              <label for="exhale">Expiration</label>
              <input
                type="number"
                id="exhale"
                name="exhale"
                class="input"
                [(ngModel)]="exhaleDuration"
                min="1"
                max="20"
                required
              />
            </div>

            <div class="form-group">
              <label for="exhaleHold">Blocage (expi)</label>
              <input
                type="number"
                id="exhaleHold"
                name="exhaleHold"
                class="input"
                [(ngModel)]="exhaleHoldDuration"
                min="0"
                max="20"
              />
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="cycles">Nombre de cycles</label>
          <input
            type="number"
            id="cycles"
            name="cycles"
            class="input"
            [(ngModel)]="cycles"
            min="1"
            max="50"
            required
          />
        </div>

        <div class="form-group">
          <label for="theme">Thème visuel</label>
          <div class="theme-selector">
            @for (t of themes; track t.value) {
              <button
                type="button"
                class="theme-option"
                [class.selected]="theme === t.value"
                [attr.data-theme]="t.value"
                (click)="theme = t.value"
              >
                <span class="theme-dot"></span>
                <span class="theme-name">{{ t.label }}</span>
              </button>
            }
          </div>
        </div>

        <div class="preview card">
          <h3>Aperçu</h3>
          <p>{{ formatPreview() }}</p>
          <p class="duration">Durée totale : {{ calculateDuration() }}</p>
        </div>

        <div class="form-actions">
          <button
            type="submit"
            class="btn btn--primary btn--large"
            [disabled]="loading()"
          >
            @if (loading()) {
              <span class="spinner"></span>
            } @else {
              {{ isEditing() ? 'Enregistrer' : 'Créer' }}
            }
          </button>
        </div>
      </form>
    </div>
  `,
  styles: `
    .pattern-form-page {
      padding: var(--space-md);
      padding-top: calc(var(--safe-area-top) + var(--space-md));
      padding-bottom: calc(var(--safe-area-bottom) + 120px);
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

    .pattern-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-lg);
    }

    .timing-section {
      h2 {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: var(--space-md);
      }
    }

    .timing-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-md);
    }

    .theme-selector {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-sm);
    }

    .theme-option {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      padding: var(--space-sm) var(--space-md);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
      cursor: pointer;
      transition: all 0.2s;

      &.selected {
        border-color: var(--primary);
        background: rgba(102, 126, 234, 0.1);
      }

      .theme-dot {
        width: 16px;
        height: 16px;
        border-radius: 50%;
      }

      &[data-theme="ocean"] .theme-dot { background: var(--bubble-ocean); }
      &[data-theme="forest"] .theme-dot { background: var(--bubble-forest); }
      &[data-theme="sunset"] .theme-dot { background: var(--bubble-sunset); }
      &[data-theme="night"] .theme-dot { background: var(--bubble-night); }
      &[data-theme="dawn"] .theme-dot { background: var(--bubble-dawn); }

      .theme-name {
        font-size: 0.875rem;
      }
    }

    .preview {
      background: var(--background);

      h3 {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: var(--space-sm);
      }

      p {
        font-size: 1rem;
        font-weight: 500;
      }

      .duration {
        font-size: 0.875rem;
        color: var(--text-muted);
        margin-top: var(--space-xs);
        font-weight: normal;
      }
    }

    .form-actions {
      margin-top: var(--space-md);

      .btn {
        width: 100%;
      }
    }
  `,
})
export class PatternFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private patternService = inject(PatternService);

  isEditing = signal(false);
  loading = signal(false);
  patternId = '';

  name = '';
  inhaleDuration = 5;
  inhaleHoldDuration = 0;
  exhaleDuration = 5;
  exhaleHoldDuration = 0;
  cycles = 6;
  theme = 'ocean';

  themes = [
    { value: 'ocean', label: 'Océan' },
    { value: 'forest', label: 'Forêt' },
    { value: 'sunset', label: 'Coucher' },
    { value: 'night', label: 'Nuit' },
    { value: 'dawn', label: 'Aurore' },
  ];

  ngOnInit(): void {
    this.patternId = this.route.snapshot.paramMap.get('id') || '';

    if (this.patternId) {
      this.isEditing.set(true);
      this.loadPattern();
    }
  }

  private loadPattern(): void {
    this.patternService.getPattern(this.patternId).subscribe({
      next: (response) => {
        const p = response.pattern;
        this.name = p.name;
        this.inhaleDuration = p.inhale_duration / 10;
        this.inhaleHoldDuration = p.inhale_hold_duration / 10;
        this.exhaleDuration = p.exhale_duration / 10;
        this.exhaleHoldDuration = p.exhale_hold_duration / 10;
        this.cycles = p.cycles;
        this.theme = p.theme;
      },
      error: () => {
        this.router.navigate(['/patterns']);
      },
    });
  }

  formatPreview(): string {
    const parts = [];
    parts.push(`${this.inhaleDuration}s`);
    if (this.inhaleHoldDuration > 0) {
      parts.push(`${this.inhaleHoldDuration}s`);
    }
    parts.push(`${this.exhaleDuration}s`);
    if (this.exhaleHoldDuration > 0) {
      parts.push(`${this.exhaleHoldDuration}s`);
    }
    return parts.join(' - ');
  }

  calculateDuration(): string {
    const cycleDuration =
      this.inhaleDuration +
      this.inhaleHoldDuration +
      this.exhaleDuration +
      this.exhaleHoldDuration;
    const totalSeconds = cycleDuration * this.cycles;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  onSubmit(): void {
    if (!this.name) return;

    this.loading.set(true);

    const data = {
      name: this.name,
      inhale_duration: Math.round(this.inhaleDuration * 10),
      inhale_hold_duration: Math.round(this.inhaleHoldDuration * 10),
      exhale_duration: Math.round(this.exhaleDuration * 10),
      exhale_hold_duration: Math.round(this.exhaleHoldDuration * 10),
      cycles: this.cycles,
      theme: this.theme,
    };

    const request = this.isEditing()
      ? this.patternService.updatePattern(this.patternId, data)
      : this.patternService.createPattern(data);

    request.subscribe({
      next: () => {
        this.router.navigate(['/patterns']);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
