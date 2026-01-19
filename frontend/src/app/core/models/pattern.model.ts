export interface BreathingPattern {
  id: string;
  user_id: string | null;
  name: string;
  inhale_duration: number;
  inhale_hold_duration: number;
  exhale_duration: number;
  exhale_hold_duration: number;
  cycles: number;
  is_preset: boolean;
  theme: string;
  sound_type: string;
  background_music: string | null;
  created_at: string;
}

export interface CreatePatternRequest {
  name: string;
  inhale_duration: number;
  inhale_hold_duration?: number;
  exhale_duration: number;
  exhale_hold_duration?: number;
  cycles?: number;
  theme?: string;
  sound_type?: string;
  background_music?: string | null;
}

export type UpdatePatternRequest = Partial<CreatePatternRequest>;

export type BreathingPhase = 'inhale' | 'inhale-hold' | 'exhale' | 'exhale-hold';

export interface PhaseConfig {
  phase: BreathingPhase;
  duration: number;
  label: string;
}
