import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminUser, AdminStats } from './admin.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterLink, DatePipe, FormsModule],
  template: `
    <div class="admin-page">
      <header class="admin-header">
        <div>
          <a routerLink="/" class="back-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </a>
          <h1>Administration</h1>
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
        <section class="stats-section card">
          <h2>Statistiques</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-value">{{ stats()!.totalUsers }}</span>
              <span class="stat-label">Utilisateurs</span>
              <span class="stat-sub">+{{ stats()!.usersLast7Days }} cette semaine</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{{ stats()!.totalSessions }}</span>
              <span class="stat-label">Séances</span>
              <span class="stat-sub">+{{ stats()!.sessionsLast7Days }} cette semaine</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{{ stats()!.totalPatterns }}</span>
              <span class="stat-label">Exercices</span>
            </div>
          </div>
        </section>
      }

      <section class="users-section">
        <h2>Utilisateurs</h2>

        @if (loading()) {
          <div class="loading">Chargement...</div>
        } @else {
          <div class="users-list">
            @for (user of users(); track user.id) {
              <div class="user-card card">
                <div class="user-info">
                  <div class="user-main">
                    <span class="user-email">{{ user.email }}</span>
                    @if (user.isAdmin) {
                      <span class="badge badge--admin">Admin</span>
                    }
                    @if (user.googleId) {
                      <span class="badge badge--google">Google</span>
                    }
                  </div>
                  <div class="user-meta">
                    <span>{{ user.name || 'Sans nom' }}</span>
                    <span class="separator">•</span>
                    <span>{{ user.sessionsCount }} séances</span>
                    <span class="separator">•</span>
                    <span>{{ user.createdAt | date:'dd/MM/yyyy' }}</span>
                  </div>
                </div>
                <div class="user-actions">
                  <button
                    class="btn btn--sm btn--ghost"
                    (click)="openEditModal(user)"
                  >
                    Modifier
                  </button>
                  <button
                    class="btn btn--sm btn--ghost btn--danger"
                    (click)="confirmDelete(user)"
                    [disabled]="user.id === currentUserId()"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            } @empty {
              <p class="empty-message">Aucun utilisateur</p>
            }
          </div>
        }
      </section>

      @if (editingUser()) {
        <div class="modal-overlay" (click)="closeEditModal()">
          <div class="modal card" (click)="$event.stopPropagation()">
            <h3>Modifier l'utilisateur</h3>
            <form (ngSubmit)="saveUser()">
              <div class="form-group">
                <label for="name">Nom</label>
                <input
                  type="text"
                  id="name"
                  [(ngModel)]="editForm.name"
                  name="name"
                  class="input"
                />
              </div>
              <div class="form-group">
                <label for="email">Email</label>
                <input
                  type="email"
                  id="email"
                  [(ngModel)]="editForm.email"
                  name="email"
                  class="input"
                />
              </div>
              <div class="form-group form-group--checkbox">
                <label>
                  <input
                    type="checkbox"
                    [(ngModel)]="editForm.isAdmin"
                    name="isAdmin"
                    [disabled]="editingUser()!.id === currentUserId()"
                  />
                  Administrateur
                </label>
              </div>
              <div class="modal-actions">
                <button type="button" class="btn btn--ghost" (click)="closeEditModal()">
                  Annuler
                </button>
                <button type="submit" class="btn btn--primary" [disabled]="saving()">
                  {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      @if (deletingUser()) {
        <div class="modal-overlay" (click)="closeDeleteModal()">
          <div class="modal card" (click)="$event.stopPropagation()">
            <h3>Confirmer la suppression</h3>
            <p>
              Voulez-vous vraiment supprimer l'utilisateur
              <strong>{{ deletingUser()!.email }}</strong> ?
            </p>
            <p class="warning">
              Cette action supprimera également toutes ses séances et exercices personnalisés.
            </p>
            <div class="modal-actions">
              <button class="btn btn--ghost" (click)="closeDeleteModal()">
                Annuler
              </button>
              <button
                class="btn btn--danger"
                (click)="deleteUser()"
                [disabled]="deleting()"
              >
                {{ deleting() ? 'Suppression...' : 'Supprimer' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .admin-page {
      padding: var(--space-md);
      padding-top: calc(var(--safe-area-top) + var(--space-md));
      padding-bottom: calc(var(--safe-area-bottom) + var(--space-xl));
      max-width: 800px;
      margin: 0 auto;
    }

    .admin-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-xl);

      > div {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
      }

      h1 {
        font-size: 1.5rem;
      }

      .back-link {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        color: var(--text-secondary);

        svg {
          width: 24px;
          height: 24px;
        }
      }

      .btn--icon svg {
        width: 20px;
        height: 20px;
      }
    }

    .stats-section {
      margin-bottom: var(--space-xl);

      h2 {
        font-size: 1rem;
        margin-bottom: var(--space-md);
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-md);
    }

    .stat-card {
      text-align: center;

      .stat-value {
        display: block;
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--primary);
      }

      .stat-label {
        display: block;
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .stat-sub {
        display: block;
        font-size: 0.75rem;
        color: var(--text-muted);
        margin-top: var(--space-xs);
      }
    }

    .users-section {
      h2 {
        font-size: 1rem;
        margin-bottom: var(--space-md);
      }
    }

    .users-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }

    .user-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-md);
    }

    .user-info {
      flex: 1;
      min-width: 0;
    }

    .user-main {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      flex-wrap: wrap;
    }

    .user-email {
      font-weight: 500;
      word-break: break-all;
    }

    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: var(--radius-full);
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;

      &--admin {
        background: var(--primary);
        color: white;
      }

      &--google {
        background: var(--surface-hover);
        color: var(--text-secondary);
      }
    }

    .user-meta {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: var(--space-xs);

      .separator {
        margin: 0 var(--space-xs);
      }
    }

    .user-actions {
      display: flex;
      gap: var(--space-xs);
      flex-shrink: 0;
    }

    .btn--danger {
      color: var(--error);

      &:hover:not(:disabled) {
        background: rgba(239, 68, 68, 0.1);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .btn--sm {
      padding: var(--space-xs) var(--space-sm);
      font-size: 0.75rem;
    }

    .loading,
    .empty-message {
      text-align: center;
      color: var(--text-muted);
      padding: var(--space-xl);
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-md);
      z-index: 1000;
    }

    .modal {
      width: 100%;
      max-width: 400px;

      h3 {
        font-size: 1.125rem;
        margin-bottom: var(--space-md);
      }

      p {
        margin-bottom: var(--space-md);
      }

      .warning {
        font-size: 0.875rem;
        color: var(--error);
      }
    }

    .form-group {
      margin-bottom: var(--space-md);

      label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        margin-bottom: var(--space-xs);
      }

      &--checkbox label {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        cursor: pointer;

        input {
          width: 18px;
          height: 18px;
          accent-color: var(--primary);
        }
      }
    }

    .input {
      width: 100%;
      padding: var(--space-sm) var(--space-md);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--background);
      font-size: 1rem;

      &:focus {
        outline: none;
        border-color: var(--primary);
      }
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-sm);
      margin-top: var(--space-lg);
    }

    @media (max-width: 480px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .user-card {
        flex-direction: column;
        align-items: flex-start;
      }

      .user-actions {
        width: 100%;
        justify-content: flex-end;
      }
    }
  `,
})
export class AdminComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);
  private router = inject(Router);

  stats = signal<AdminStats | null>(null);
  users = signal<AdminUser[]>([]);
  loading = signal(true);

  editingUser = signal<AdminUser | null>(null);
  editForm = { name: '', email: '', isAdmin: false };
  saving = signal(false);

  deletingUser = signal<AdminUser | null>(null);
  deleting = signal(false);

  currentUserId = signal<string | null>(null);

  ngOnInit(): void {
    const user = this.authService.user();
    this.currentUserId.set(user?.id || null);

    this.loadData();
  }

  loadData(): void {
    this.adminService.getStats().subscribe({
      next: (response) => this.stats.set(response.stats),
    });

    this.adminService.getUsers().subscribe({
      next: (response) => {
        this.users.set(response.users);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  openEditModal(user: AdminUser): void {
    this.editingUser.set(user);
    this.editForm = {
      name: user.name || '',
      email: user.email,
      isAdmin: user.isAdmin,
    };
  }

  closeEditModal(): void {
    this.editingUser.set(null);
  }

  saveUser(): void {
    const user = this.editingUser();
    if (!user) return;

    this.saving.set(true);
    this.adminService.updateUser(user.id, this.editForm).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeEditModal();
        this.loadData();
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  confirmDelete(user: AdminUser): void {
    this.deletingUser.set(user);
  }

  closeDeleteModal(): void {
    this.deletingUser.set(null);
  }

  deleteUser(): void {
    const user = this.deletingUser();
    if (!user) return;

    this.deleting.set(true);
    this.adminService.deleteUser(user.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.closeDeleteModal();
        this.loadData();
      },
      error: () => {
        this.deleting.set(false);
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
