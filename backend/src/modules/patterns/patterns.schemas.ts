import { z } from 'zod';

export const createPatternSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100),
  inhale_duration: z.number().int().min(10).max(200),
  inhale_hold_duration: z.number().int().min(0).max(200).default(0),
  exhale_duration: z.number().int().min(10).max(200),
  exhale_hold_duration: z.number().int().min(0).max(200).default(0),
  cycles: z.number().int().min(1).max(50).default(6),
  theme: z.string().max(50).default('ocean'),
  sound_type: z.string().max(50).default('soft-bell'),
  background_music: z.string().max(100).nullable().optional(),
});

export const updatePatternSchema = createPatternSchema.partial();

export type CreatePatternInput = z.infer<typeof createPatternSchema>;
export type UpdatePatternInput = z.infer<typeof updatePatternSchema>;
