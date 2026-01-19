import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import {
  BreathingPattern,
  CreatePatternRequest,
  UpdatePatternRequest,
} from '../models/pattern.model';

@Injectable({
  providedIn: 'root',
})
export class PatternService {
  private api = inject(ApiService);

  private patternsSignal = signal<BreathingPattern[]>([]);
  patterns = this.patternsSignal.asReadonly();

  loadPatterns(): Observable<{ patterns: BreathingPattern[] }> {
    return this.api.get<{ patterns: BreathingPattern[] }>('/patterns').pipe(
      tap((response) => {
        this.patternsSignal.set(response.patterns);
      })
    );
  }

  getPattern(id: string): Observable<{ pattern: BreathingPattern }> {
    return this.api.get<{ pattern: BreathingPattern }>(`/patterns/${id}`);
  }

  createPattern(
    data: CreatePatternRequest
  ): Observable<{ pattern: BreathingPattern }> {
    return this.api
      .post<{ pattern: BreathingPattern }>('/patterns', data)
      .pipe(
        tap((response) => {
          this.patternsSignal.update((patterns) => [
            ...patterns,
            response.pattern,
          ]);
        })
      );
  }

  updatePattern(
    id: string,
    data: UpdatePatternRequest
  ): Observable<{ pattern: BreathingPattern }> {
    return this.api
      .put<{ pattern: BreathingPattern }>(`/patterns/${id}`, data)
      .pipe(
        tap((response) => {
          this.patternsSignal.update((patterns) =>
            patterns.map((p) => (p.id === id ? response.pattern : p))
          );
        })
      );
  }

  deletePattern(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/patterns/${id}`).pipe(
      tap(() => {
        this.patternsSignal.update((patterns) =>
          patterns.filter((p) => p.id !== id)
        );
      })
    );
  }

  getPresets(): BreathingPattern[] {
    return this.patternsSignal().filter((p) => p.is_preset);
  }

  getUserPatterns(): BreathingPattern[] {
    return this.patternsSignal().filter((p) => !p.is_preset);
  }
}
