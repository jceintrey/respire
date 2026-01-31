import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
  googleId: boolean;
  sessionsCount: number;
  patternsCount: number;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalSessions: number;
  totalPatterns: number;
  usersLast7Days: number;
  sessionsLast7Days: number;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  isAdmin?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private api = inject(ApiService);

  getStats(): Observable<{ stats: AdminStats }> {
    return this.api.get('/admin/stats');
  }

  getUsers(): Observable<{ users: AdminUser[] }> {
    return this.api.get('/admin/users');
  }

  getUser(id: string): Observable<{ user: AdminUser }> {
    return this.api.get(`/admin/users/${id}`);
  }

  updateUser(id: string, data: UpdateUserRequest): Observable<{ user: AdminUser }> {
    return this.api.put(`/admin/users/${id}`, data);
  }

  deleteUser(id: string): Observable<{ message: string }> {
    return this.api.delete(`/admin/users/${id}`);
  }
}
