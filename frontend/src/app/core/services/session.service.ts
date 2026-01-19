import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Session,
  CreateSessionRequest,
  SessionStats,
  SessionsResponse,
} from '../models/session.model';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private api = inject(ApiService);

  createSession(data: CreateSessionRequest): Observable<{ session: Session }> {
    return this.api.post<{ session: Session }>('/sessions', data);
  }

  getHistory(
    limit = 20,
    offset = 0
  ): Observable<SessionsResponse> {
    return this.api.get<SessionsResponse>(
      `/sessions?limit=${limit}&offset=${offset}`
    );
  }

  getStats(): Observable<{ stats: SessionStats }> {
    return this.api.get<{ stats: SessionStats }>('/sessions/stats');
  }
}
