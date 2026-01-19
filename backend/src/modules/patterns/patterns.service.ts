import { db } from '../../db/kysely.js';
import type { BreathingPattern, NewBreathingPattern } from '../../db/types.js';
import type { CreatePatternInput, UpdatePatternInput } from './patterns.schemas.js';

export class PatternsService {
  async getAll(userId: string): Promise<BreathingPattern[]> {
    // Get presets and user's custom patterns
    const patterns = await db
      .selectFrom('breathing_patterns')
      .selectAll()
      .where((eb) =>
        eb.or([
          eb('is_preset', '=', true),
          eb('user_id', '=', userId),
        ])
      )
      .orderBy('is_preset', 'desc')
      .orderBy('name', 'asc')
      .execute();

    return patterns;
  }

  async getPresets(): Promise<BreathingPattern[]> {
    return db
      .selectFrom('breathing_patterns')
      .selectAll()
      .where('is_preset', '=', true)
      .orderBy('name', 'asc')
      .execute();
  }

  async getById(id: string, userId: string): Promise<BreathingPattern | null> {
    const pattern = await db
      .selectFrom('breathing_patterns')
      .selectAll()
      .where('id', '=', id)
      .where((eb) =>
        eb.or([
          eb('is_preset', '=', true),
          eb('user_id', '=', userId),
        ])
      )
      .executeTakeFirst();

    return pattern || null;
  }

  async create(userId: string, input: CreatePatternInput): Promise<BreathingPattern> {
    const pattern: NewBreathingPattern = {
      user_id: userId,
      name: input.name,
      inhale_duration: input.inhale_duration,
      inhale_hold_duration: input.inhale_hold_duration ?? 0,
      exhale_duration: input.exhale_duration,
      exhale_hold_duration: input.exhale_hold_duration ?? 0,
      cycles: input.cycles ?? 6,
      theme: input.theme ?? 'ocean',
      sound_type: input.sound_type ?? 'soft-bell',
      background_music: input.background_music ?? null,
      is_preset: false,
    };

    const created = await db
      .insertInto('breathing_patterns')
      .values(pattern)
      .returningAll()
      .executeTakeFirstOrThrow();

    return created;
  }

  async update(
    id: string,
    userId: string,
    input: UpdatePatternInput
  ): Promise<BreathingPattern | null> {
    // Only allow updating user's own patterns (not presets)
    const existing = await db
      .selectFrom('breathing_patterns')
      .select(['id', 'user_id', 'is_preset'])
      .where('id', '=', id)
      .executeTakeFirst();

    if (!existing || existing.is_preset || existing.user_id !== userId) {
      return null;
    }

    const updated = await db
      .updateTable('breathing_patterns')
      .set(input)
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .returningAll()
      .executeTakeFirst();

    return updated || null;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    // Only allow deleting user's own patterns (not presets)
    const result = await db
      .deleteFrom('breathing_patterns')
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .where('is_preset', '=', false)
      .executeTakeFirst();

    return (result.numDeletedRows ?? 0n) > 0n;
  }
}

export const patternsService = new PatternsService();
