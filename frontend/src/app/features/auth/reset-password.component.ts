import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-container">
        <div class="auth-header">
          <div class="logo">
            <svg viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="20" fill="url(#gradient)" />
              <path
                d="M24 14c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10z"
                fill="white"
                opacity="0.3"
              />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="48" y2="48">
                  <stop offset="0%" stop-color="#667eea" />
                  <stop offset="100%" stop-color="#764ba2" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1>Nouveau mot de passe</h1>
          <p class="text-secondary">Choisissez votre nouveau mot de passe</p>
        </div>

        @if (verifying()) {
          <div class="loading-state">
            <span class="spinner"></span>
            <p>Vérification du lien...</p>
          </div>
        } @else if (invalidToken()) {
          <div class="error-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <h2>Lien invalide ou expiré</h2>
            <p>
              Ce lien de réinitialisation n'est plus valide. Veuillez faire une
              nouvelle demande.
            </p>
            <a routerLink="/auth/forgot-password" class="btn btn--primary">
              Nouvelle demande
            </a>
          </div>
        } @else if (success()) {
          <div class="success-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <h2>Mot de passe modifié</h2>
            <p>Votre mot de passe a été modifié avec succès.</p>
            <a routerLink="/auth/login" class="btn btn--primary">
              Se connecter
            </a>
          </div>
        } @else {
          <form (ngSubmit)="onSubmit()" class="auth-form">
            @if (error()) {
              <div class="error-banner">{{ error() }}</div>
            }

            <div class="form-group">
              <label for="password">Nouveau mot de passe</label>
              <input
                type="password"
                id="password"
                name="password"
                class="input"
                [(ngModel)]="password"
                required
                minlength="8"
                autocomplete="new-password"
              />
              <small class="text-muted">Minimum 8 caractères</small>
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirmer le mot de passe</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                class="input"
                [(ngModel)]="confirmPassword"
                required
                autocomplete="new-password"
              />
            </div>

            <button
              type="submit"
              class="btn btn--primary btn--large"
              [disabled]="loading()"
              style="width: 100%"
            >
              @if (loading()) {
                <span class="spinner"></span>
              } @else {
                Modifier le mot de passe
              }
            </button>
          </form>
        }
      </div>
    </div>
  `,
  styles: `
    .auth-page {
      min-height: 100vh;
      min-height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-md);
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
    }

    .auth-container {
      width: 100%;
      max-width: 400px;
      background: var(--surface);
      border-radius: var(--radius-xl);
      padding: var(--space-xl);
      box-shadow: var(--shadow-lg);
    }

    .auth-header {
      text-align: center;
      margin-bottom: var(--space-xl);

      .logo {
        width: 64px;
        height: 64px;
        margin: 0 auto var(--space-md);

        svg {
          width: 100%;
          height: 100%;
        }
      }

      h1 {
        margin-bottom: var(--space-xs);
        font-size: 1.25rem;
      }
    }

    .auth-form {
      small {
        display: block;
        margin-top: var(--space-xs);
        font-size: 0.75rem;
      }
    }

    .error-banner {
      background: #fee2e2;
      color: var(--error);
      padding: var(--space-sm) var(--space-md);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-md);
      font-size: 0.875rem;
    }

    .loading-state,
    .error-state,
    .success-state {
      text-align: center;
      padding: var(--space-xl) 0;

      .spinner {
        width: 48px;
        height: 48px;
        margin-bottom: var(--space-md);
      }

      svg {
        width: 64px;
        height: 64px;
        margin-bottom: var(--space-md);
      }

      h2 {
        font-size: 1.125rem;
        margin-bottom: var(--space-sm);
      }

      p {
        color: var(--text-secondary);
        margin-bottom: var(--space-lg);
      }
    }

    .error-state svg {
      color: var(--error);
    }

    .success-state svg {
      color: #10b981;
    }
  `,
})
export class ResetPasswordComponent implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  password = '';
  confirmPassword = '';
  token = '';

  verifying = signal(true);
  invalidToken = signal(false);
  loading = signal(false);
  error = signal('');
  success = signal(false);

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParams['token'] || '';

    if (!this.token) {
      this.verifying.set(false);
      this.invalidToken.set(true);
      return;
    }

    this.authService.verifyResetToken(this.token).subscribe({
      next: (response) => {
        this.verifying.set(false);
        if (!response.valid) {
          this.invalidToken.set(true);
        }
      },
      error: () => {
        this.verifying.set(false);
        this.invalidToken.set(true);
      },
    });
  }

  onSubmit(): void {
    if (!this.password || !this.confirmPassword) return;

    if (this.password !== this.confirmPassword) {
      this.error.set('Les mots de passe ne correspondent pas');
      return;
    }

    if (this.password.length < 8) {
      this.error.set('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.authService.resetPassword(this.token, this.password).subscribe({
      next: () => {
        this.success.set(true);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Une erreur est survenue');
        this.loading.set(false);
      },
    });
  }
}
