import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';
import { ApiService } from './api.service';
import {
  User,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from '../models/user.model';

const TOKEN_KEY = 'accessToken';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  private userSignal = signal<User | null>(null);
  private loadingSignal = signal(true);

  user = this.userSignal.asReadonly();
  isAuthenticated = computed(() => !!this.userSignal());
  isLoading = this.loadingSignal.asReadonly();

  constructor() {
    this.checkAuth();
  }

  private checkAuth(): void {
    const token = this.getToken();
    if (!token) {
      this.loadingSignal.set(false);
      return;
    }

    this.api.get<{ user: User }>('/auth/me').subscribe({
      next: (response) => {
        this.userSignal.set(response.user);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.clearToken();
        this.loadingSignal.set(false);
      },
    });
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.api
      .post<AuthResponse>('/auth/register', data, { withCredentials: true })
      .pipe(
        tap((response) => {
          this.setToken(response.accessToken);
          this.userSignal.set(response.user);
        })
      );
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.api
      .post<AuthResponse>('/auth/login', data, { withCredentials: true })
      .pipe(
        tap((response) => {
          this.setToken(response.accessToken);
          this.userSignal.set(response.user);
        })
      );
  }

  loginWithGoogle(idToken: string): Observable<AuthResponse> {
    return this.api
      .post<AuthResponse>('/auth/google', { idToken }, { withCredentials: true })
      .pipe(
        tap((response) => {
          this.setToken(response.accessToken);
          this.userSignal.set(response.user);
        })
      );
  }

  logout(): void {
    this.api.post('/auth/logout', {}, { withCredentials: true }).subscribe({
      complete: () => {
        this.clearToken();
        this.userSignal.set(null);
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        this.clearToken();
        this.userSignal.set(null);
        this.router.navigate(['/auth/login']);
      },
    });
  }

  refreshToken(): Observable<AuthResponse | null> {
    return this.api
      .post<AuthResponse>('/auth/refresh', {}, { withCredentials: true })
      .pipe(
        tap((response) => {
          this.setToken(response.accessToken);
          this.userSignal.set(response.user);
        }),
        catchError(() => {
          this.clearToken();
          this.userSignal.set(null);
          return of(null);
        })
      );
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  private clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }
}
