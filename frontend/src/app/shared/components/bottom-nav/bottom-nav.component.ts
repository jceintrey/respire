import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="bottom-nav">
      <a
        routerLink="/"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: true }"
        class="nav-item"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span>Accueil</span>
      </a>

      <a routerLink="/breathe" routerLinkActive="active" class="nav-item nav-item--main">
        <div class="main-button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8M8 12h8" />
          </svg>
        </div>
        <span>Respirer</span>
      </a>

      <a routerLink="/stats" routerLinkActive="active" class="nav-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
        <span>Stats</span>
      </a>
    </nav>
  `,
  styles: `
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-around;
      align-items: flex-end;
      background: var(--surface);
      border-top: 1px solid var(--border);
      padding-bottom: env(safe-area-inset-bottom);
      z-index: 100;
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 8px 16px;
      color: var(--text-muted);
      text-decoration: none;
      transition: color 0.2s;

      svg {
        width: 24px;
        height: 24px;
      }

      span {
        font-size: 0.75rem;
        font-weight: 500;
      }

      &.active {
        color: var(--primary);
      }

      &--main {
        position: relative;
        top: -12px;

        .main-button {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          border-radius: 50%;
          color: white;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);

          svg {
            width: 28px;
            height: 28px;
          }
        }

        span {
          color: var(--text-primary);
        }

        &.active .main-button {
          transform: scale(1.05);
        }
      }
    }
  `,
})
export class BottomNavComponent {}
