import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
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
          <h1>Créer un compte</h1>
          <p class="text-secondary">Commencez votre pratique</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="auth-form">
          @if (error()) {
            <div class="error-banner">{{ error() }}</div>
          }

          <div class="form-group">
            <label for="name">Prénom (optionnel)</label>
            <input
              type="text"
              id="name"
              name="name"
              class="input"
              [(ngModel)]="name"
              autocomplete="given-name"
            />
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              class="input"
              [(ngModel)]="email"
              required
              autocomplete="email"
            />
          </div>

          <div class="form-group">
            <label for="password">Mot de passe</label>
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

          <button
            type="submit"
            class="btn btn--primary btn--large"
            [disabled]="loading()"
            style="width: 100%"
          >
            @if (loading()) {
              <span class="spinner"></span>
            } @else {
              Créer mon compte
            }
          </button>
        </form>

        <p class="auth-footer">
          Déjà un compte ?
          <a routerLink="/auth/login">Se connecter</a>
        </p>
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
      }
    }

    .auth-form {
      margin-bottom: var(--space-lg);

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

    .auth-footer {
      text-align: center;
      color: var(--text-secondary);
      font-size: 0.875rem;
    }
  `,
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  name = '';
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  onSubmit(): void {
    if (!this.email || !this.password) return;

    this.loading.set(true);
    this.error.set('');

    this.authService
      .register({
        email: this.email,
        password: this.password,
        name: this.name || undefined,
      })
      .subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.error.set(err.error?.error || "Erreur lors de l'inscription");
          this.loading.set(false);
        },
      });
  }
}
