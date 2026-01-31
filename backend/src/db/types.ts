import type { Generated, Insertable, Selectable, Updateable } from 'kysely';

export interface Database {
  users: UsersTable;
  breathing_patterns: BreathingPatternsTable;
  sessions: SessionsTable;
  refresh_tokens: RefreshTokensTable;
}

export interface UsersTable {
  id: Generated<string>;
  email: string;
  password_hash: string | null;
  google_id: string | null;
  name: string | null;
  is_admin: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UserUpdate = Updateable<UsersTable>;

export interface BreathingPatternsTable {
  id: Generated<string>;
  user_id: string | null;
  name: string;
  inhale_duration: number;
  inhale_hold_duration: Generated<number>;
  exhale_duration: number;
  exhale_hold_duration: Generated<number>;
  cycles: Generated<number>;
  is_preset: Generated<boolean>;
  theme: Generated<string>;
  sound_type: Generated<string>;
  background_music: string | null;
  created_at: Generated<Date>;
}

export type BreathingPattern = Selectable<BreathingPatternsTable>;
export type NewBreathingPattern = Insertable<BreathingPatternsTable>;
export type BreathingPatternUpdate = Updateable<BreathingPatternsTable>;

export interface SessionsTable {
  id: Generated<string>;
  user_id: string;
  pattern_id: string | null;
  pattern_name: string;
  duration_seconds: number;
  cycles_completed: number;
  completed_at: Generated<Date>;
}

export type Session = Selectable<SessionsTable>;
export type NewSession = Insertable<SessionsTable>;

export interface RefreshTokensTable {
  id: Generated<string>;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Generated<Date>;
}

export type RefreshToken = Selectable<RefreshTokensTable>;
export type NewRefreshToken = Insertable<RefreshTokensTable>;
