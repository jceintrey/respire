export interface Session {
  id: string;
  user_id: string;
  pattern_id: string | null;
  pattern_name: string;
  duration_seconds: number;
  cycles_completed: number;
  completed_at: string;
}

export interface CreateSessionRequest {
  pattern_id?: string;
  pattern_name: string;
  duration_seconds: number;
  cycles_completed: number;
}

export interface SessionStats {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  weeklyAverage: number;
  lastWeek: Array<{
    date: string;
    sessions: number;
    minutes: number;
  }>;
}

export interface SessionsResponse {
  sessions: Session[];
  total: number;
  limit: number;
  offset: number;
}
