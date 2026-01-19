import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  computed,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PatternService } from '../../core/services/pattern.service';
import { SessionService } from '../../core/services/session.service';
import { AudioService, type SoundType } from '../../core/services/audio.service';
import type {
  BreathingPattern,
  BreathingPhase,
  PhaseConfig,
} from '../../core/models/pattern.model';

@Component({
  selector: 'app-breathing',
  standalone: true,
  template: `
    <div
      class="breathing-page"
      [attr.data-theme]="pattern()?.theme || 'ocean'"
      [class.session-active]="isActive()"
    >
      @if (!pattern()) {
        <div class="loading">
          <div class="spinner"></div>
        </div>
      } @else {
        <header class="breathing-header">
          <button class="btn btn--ghost btn--icon" (click)="goBack()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <h1>{{ pattern()!.name }}</h1>
          <button class="btn btn--ghost btn--icon" (click)="toggleSound()">
            @if (audioService.isMuted()) {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                <path d="M17 14.3a6 6 0 0 0-4-11.28" />
                <line x1="12" y1="17" x2="12" y2="21" />
                <line x1="8" y1="21" x2="16" y2="21" />
              </svg>
            } @else {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            }
          </button>
        </header>

        <main class="breathing-main">
          <div class="bubble-container">
            <div
              #bubble
              class="bubble"
              [style.transform]="'scale(' + bubbleScale() + ')'"
            >
              <div class="bubble-inner"></div>
            </div>
            <div class="phase-text">{{ phaseText() }}</div>
          </div>

          <div class="timer">
            <span class="timer-value">{{ formatTime(remainingTime()) }}</span>
            <span class="timer-label">
              Cycle {{ currentCycle() }} / {{ pattern()!.cycles }}
            </span>
          </div>
        </main>

        <footer class="breathing-controls">
          @if (!isActive() && !isCompleted()) {
            <button
              class="btn btn--primary btn--large start-btn"
              (click)="start()"
            >
              Commencer
            </button>
          } @else if (isActive()) {
            <div class="control-buttons">
              <button class="btn btn--secondary btn--icon" (click)="stop()">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
              <button
                class="btn btn--primary btn--icon pause-btn"
                (click)="togglePause()"
              >
                @if (isPaused()) {
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                } @else {
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                }
              </button>
            </div>
          } @else {
            <div class="completion">
              <div class="completion-message">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>Séance terminée !</span>
              </div>
              <button class="btn btn--primary btn--large" (click)="restart()">
                Recommencer
              </button>
            </div>
          }
        </footer>
      }
    </div>
  `,
  styles: `
    .breathing-page {
      min-height: 100vh;
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      transition: background 0.5s ease;

      &[data-theme="ocean"] {
        background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
        --bubble-color: #4facfe;
        --bubble-glow: rgba(79, 172, 254, 0.6);
      }

      &[data-theme="forest"] {
        background: linear-gradient(180deg, #134e5e 0%, #71b280 100%);
        --bubble-color: #56ab2f;
        --bubble-glow: rgba(86, 171, 47, 0.6);
      }

      &[data-theme="sunset"] {
        background: linear-gradient(180deg, #ff9a9e 0%, #fecfef 100%);
        --bubble-color: #ff6b6b;
        --bubble-glow: rgba(255, 107, 107, 0.6);
      }

      &[data-theme="night"] {
        background: linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
        --bubble-color: #6366f1;
        --bubble-glow: rgba(99, 102, 241, 0.6);
      }

      &[data-theme="dawn"] {
        background: linear-gradient(180deg, #ffecd2 0%, #fcb69f 100%);
        --bubble-color: #f093fb;
        --bubble-glow: rgba(240, 147, 251, 0.6);
      }
    }

    .loading {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .breathing-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-md);
      padding-top: calc(var(--safe-area-top) + var(--space-md));
      color: white;

      h1 {
        font-size: 1.125rem;
        font-weight: 500;
      }

      .btn--ghost {
        color: white;

        svg {
          width: 24px;
          height: 24px;
        }
      }
    }

    .breathing-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-xl);
    }

    .bubble-container {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: var(--space-2xl);
    }

    .bubble {
      width: 180px;
      height: 180px;
      border-radius: 50%;
      background: radial-gradient(
        circle at 30% 30%,
        rgba(255, 255, 255, 0.9),
        var(--bubble-color) 70%
      );
      box-shadow:
        0 0 80px var(--bubble-glow),
        0 0 120px var(--bubble-glow),
        inset 0 0 40px rgba(255, 255, 255, 0.4);
      transition: transform 0.1s linear;
      will-change: transform;

      .bubble-inner {
        position: absolute;
        top: 15%;
        left: 20%;
        width: 30%;
        height: 20%;
        background: rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        filter: blur(8px);
      }
    }

    .phase-text {
      margin-top: var(--space-xl);
      font-size: 1.25rem;
      font-weight: 500;
      color: white;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      opacity: 0.9;
    }

    .timer {
      text-align: center;
      color: white;

      .timer-value {
        display: block;
        font-size: 3rem;
        font-weight: 300;
        font-variant-numeric: tabular-nums;
      }

      .timer-label {
        font-size: 0.875rem;
        opacity: 0.8;
      }
    }

    .breathing-controls {
      padding: var(--space-xl);
      padding-bottom: calc(var(--safe-area-bottom) + var(--space-xl));
      display: flex;
      justify-content: center;
    }

    .start-btn {
      width: 100%;
      max-width: 280px;
    }

    .control-buttons {
      display: flex;
      gap: var(--space-lg);

      .btn--icon {
        width: 64px;
        height: 64px;

        svg {
          width: 28px;
          height: 28px;
        }
      }

      .pause-btn {
        width: 80px;
        height: 80px;

        svg {
          width: 32px;
          height: 32px;
        }
      }
    }

    .completion {
      text-align: center;
      width: 100%;
      max-width: 280px;

      .completion-message {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-sm);
        color: white;
        margin-bottom: var(--space-lg);

        svg {
          width: 24px;
          height: 24px;
          color: var(--success);
        }

        span {
          font-size: 1.125rem;
          font-weight: 500;
        }
      }

      .btn {
        width: 100%;
      }
    }
  `,
})
export class BreathingComponent implements OnInit, OnDestroy {
  @ViewChild('bubble') bubbleEl!: ElementRef<HTMLDivElement>;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private patternService = inject(PatternService);
  private sessionService = inject(SessionService);
  audioService = inject(AudioService);

  pattern = signal<BreathingPattern | null>(null);
  isActive = signal(false);
  isPaused = signal(false);
  isCompleted = signal(false);

  currentPhase = signal<BreathingPhase>('inhale');
  currentCycle = signal(1);
  phaseTimeRemaining = signal(0);
  totalTimeRemaining = signal(0);

  private animationFrameId: number | null = null;
  private lastTimestamp = 0;
  private phaseStartTime = 0;
  private sessionStartTime = 0;

  bubbleScale = computed(() => {
    const phase = this.currentPhase();
    const pattern = this.pattern();
    if (!pattern || !this.isActive() || this.isPaused()) {
      return 1;
    }

    const phaseDuration = this.getPhaseDuration(phase);
    const elapsed = phaseDuration - this.phaseTimeRemaining();
    const progress = Math.min(elapsed / phaseDuration, 1);

    if (phase === 'inhale') {
      return 1 + progress * 0.5;
    } else if (phase === 'exhale') {
      return 1.5 - progress * 0.5;
    } else if (phase === 'inhale-hold') {
      return 1.5;
    } else {
      return 1;
    }
  });

  phaseText = computed(() => {
    if (!this.isActive()) return 'Prêt';
    const phase = this.currentPhase();
    switch (phase) {
      case 'inhale':
        return 'Inspirez';
      case 'inhale-hold':
        return 'Retenez';
      case 'exhale':
        return 'Expirez';
      case 'exhale-hold':
        return 'Retenez';
      default:
        return '';
    }
  });

  remainingTime = computed(() => this.totalTimeRemaining());

  ngOnInit(): void {
    const patternId = this.route.snapshot.paramMap.get('patternId');

    if (patternId) {
      this.patternService.getPattern(patternId).subscribe({
        next: (response) => {
          this.pattern.set(response.pattern);
          this.initializeSession();
        },
        error: () => {
          this.router.navigate(['/breathe']);
        },
      });
    } else {
      this.patternService.loadPatterns().subscribe({
        next: () => {
          const presets = this.patternService.getPresets();
          if (presets.length > 0) {
            this.pattern.set(presets[0]);
            this.initializeSession();
          }
        },
      });
    }
  }

  ngOnDestroy(): void {
    this.stopAnimation();
  }

  private initializeSession(): void {
    const pattern = this.pattern();
    if (!pattern) return;

    this.totalTimeRemaining.set(this.calculateTotalTime());
    this.currentCycle.set(1);
    this.currentPhase.set('inhale');
    this.phaseTimeRemaining.set(pattern.inhale_duration / 10);
  }

  private calculateTotalTime(): number {
    const pattern = this.pattern();
    if (!pattern) return 0;

    const cycleDuration =
      pattern.inhale_duration +
      pattern.inhale_hold_duration +
      pattern.exhale_duration +
      pattern.exhale_hold_duration;

    return (cycleDuration * pattern.cycles) / 10;
  }

  private getPhaseDuration(phase: BreathingPhase): number {
    const pattern = this.pattern();
    if (!pattern) return 0;

    switch (phase) {
      case 'inhale':
        return pattern.inhale_duration / 10;
      case 'inhale-hold':
        return pattern.inhale_hold_duration / 10;
      case 'exhale':
        return pattern.exhale_duration / 10;
      case 'exhale-hold':
        return pattern.exhale_hold_duration / 10;
    }
  }

  private getNextPhase(current: BreathingPhase): BreathingPhase | null {
    const pattern = this.pattern();
    if (!pattern) return null;

    switch (current) {
      case 'inhale':
        return pattern.inhale_hold_duration > 0 ? 'inhale-hold' : 'exhale';
      case 'inhale-hold':
        return 'exhale';
      case 'exhale':
        return pattern.exhale_hold_duration > 0 ? 'exhale-hold' : null;
      case 'exhale-hold':
        return null;
    }
  }

  start(): void {
    this.isActive.set(true);
    this.isPaused.set(false);
    this.isCompleted.set(false);
    this.sessionStartTime = performance.now();
    this.lastTimestamp = performance.now();
    this.phaseStartTime = performance.now();
    this.playPhaseSound('inhale');
    this.startAnimation();
  }

  togglePause(): void {
    if (this.isPaused()) {
      this.isPaused.set(false);
      this.lastTimestamp = performance.now();
      this.startAnimation();
    } else {
      this.isPaused.set(true);
      this.stopAnimation();
    }
  }

  stop(): void {
    this.stopAnimation();
    this.isActive.set(false);
    this.isPaused.set(false);
    this.initializeSession();
  }

  restart(): void {
    this.isCompleted.set(false);
    this.initializeSession();
    this.start();
  }

  goBack(): void {
    if (this.isActive()) {
      this.stop();
    }
    this.router.navigate(['/']);
  }

  toggleSound(): void {
    this.audioService.toggleMute();
  }

  private playPhaseSound(phase: BreathingPhase): void {
    const pattern = this.pattern();
    if (!pattern) return;

    const soundType = (pattern.sound_type || 'soft-bell') as SoundType;
    const audioPhase = phase === 'inhale-hold' || phase === 'exhale-hold' ? 'hold' : phase;
    this.audioService.playPhaseSound(soundType, audioPhase);
  }

  private startAnimation(): void {
    const animate = (timestamp: number) => {
      if (this.isPaused() || !this.isActive()) return;

      const deltaTime = (timestamp - this.lastTimestamp) / 1000;
      this.lastTimestamp = timestamp;

      this.updateSession(deltaTime);

      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  private stopAnimation(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private updateSession(deltaTime: number): void {
    const pattern = this.pattern();
    if (!pattern) return;

    // Update timers
    this.phaseTimeRemaining.update((t) => Math.max(0, t - deltaTime));
    this.totalTimeRemaining.update((t) => Math.max(0, t - deltaTime));

    // Check if phase is complete
    if (this.phaseTimeRemaining() <= 0) {
      const nextPhase = this.getNextPhase(this.currentPhase());

      if (nextPhase) {
        this.currentPhase.set(nextPhase);
        this.phaseTimeRemaining.set(this.getPhaseDuration(nextPhase));
        this.playPhaseSound(nextPhase);
      } else {
        // End of cycle
        if (this.currentCycle() < pattern.cycles) {
          this.currentCycle.update((c) => c + 1);
          this.currentPhase.set('inhale');
          this.phaseTimeRemaining.set(this.getPhaseDuration('inhale'));
          this.playPhaseSound('inhale');
        } else {
          this.completeSession();
        }
      }
    }
  }

  private completeSession(): void {
    this.stopAnimation();
    this.isActive.set(false);
    this.isCompleted.set(true);
    this.audioService.playSessionComplete();

    const pattern = this.pattern();
    if (!pattern) return;

    const durationSeconds = Math.round(
      (performance.now() - this.sessionStartTime) / 1000
    );

    this.sessionService
      .createSession({
        pattern_id: pattern.id,
        pattern_name: pattern.name,
        duration_seconds: durationSeconds,
        cycles_completed: pattern.cycles,
      })
      .subscribe();
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
