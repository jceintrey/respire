import { z } from 'zod';

export const createSessionSchema = z.object({
  pattern_id: z.string().uuid().optional(),
  pattern_name: z.string().min(1).max(100),
  duration_seconds: z.number().int().min(1),
  cycles_completed: z.number().int().min(1),
});

export const sessionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type SessionsQuery = z.infer<typeof sessionsQuerySchema>;
