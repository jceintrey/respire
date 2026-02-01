import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { RecaptchaService } from '../../core/services/recaptcha.service';

@Component({
  selector: 'app-forgot-password',
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
          <h1>Mot de passe oublié</h1>
          <p class="text-secondary">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        @if (success()) {
          <div class="success-banner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <p>
              Si un compte existe avec cet email, vous recevrez un lien de
              réinitialisation dans quelques instants.
            </p>
          </div>
          <p class="auth-footer">
            <a routerLink="/auth/login">Retour à la connexion</a>
          </p>
        } @else {
          <form (ngSubmit)="onSubmit()" class="auth-form">
            @if (error()) {
              <div class="error-banner">{{ error() }}</div>
            }

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

            <button
              type="submit"
              class="btn btn--primary btn--large"
              [disabled]="loading()"
              style="width: 100%"
            >
              @if (loading()) {
                <span class="spinner"></span>
              } @else {
                Envoyer le lien
              }
            </button>
          </form>

          <p class="auth-footer">
            <a routerLink="/auth/login">Retour à la connexion</a>
          </p>
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
      margin-bottom: var(--space-lg);
    }

    .error-banner {
      background: #fee2e2;
      color: var(--error);
      padding: var(--space-sm) var(--space-md);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-md);
      font-size: 0.875rem;
    }

    .success-banner {
      background: #d1fae5;
      color: #065f46;
      padding: var(--space-md);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-lg);
      display: flex;
      gap: var(--space-sm);
      align-items: flex-start;

      svg {
        width: 24px;
        height: 24px;
        flex-shrink: 0;
        margin-top: 2px;
      }

      p {
        font-size: 0.875rem;
        margin: 0;
      }
    }

    .auth-footer {
      text-align: center;
      color: var(--text-secondary);
      font-size: 0.875rem;
    }
  `,
})
export class ForgotPasswordComponent implements OnInit {
  private authService = inject(AuthService);
  private recaptchaService = inject(RecaptchaService);

  email = '';
  loading = signal(false);
  error = signal('');
  success = signal(false);

  ngOnInit(): void {
    this.recaptchaService.loadScript();
  }

  async onSubmit(): Promise<void> {
    if (!this.email) return;

    this.loading.set(true);
    this.error.set('');

    try {
      const recaptchaToken = await this.recaptchaService.execute('forgot_password');

      this.authService.forgotPassword(this.email, recaptchaToken).subscribe({
        next: () => {
          this.success.set(true);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.error || 'Une erreur est survenue');
          this.loading.set(false);
        },
      });
    } catch {
      this.error.set('Erreur de vérification reCAPTCHA');
      this.loading.set(false);
    }
  }
}
