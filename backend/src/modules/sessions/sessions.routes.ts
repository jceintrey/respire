import type { FastifyInstance } from 'fastify';
import { sessionsService } from './sessions.service.js';
import {
  createSessionSchema,
  sessionsQuerySchema,
  type CreateSessionInput,
  type SessionsQuery,
} from './sessions.schemas.js';

export async function sessionsRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // Create session (record completed breathing session)
  fastify.post<{ Body: CreateSessionInput }>('/', async (request, reply) => {
    const parsed = createSessionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Validation error',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const session = await sessionsService.create(request.user.id, parsed.data);
    return reply.status(201).send({ session });
  });

  // Get session history
  fastify.get<{ Querystring: SessionsQuery }>('/', async (request, reply) => {
    const parsed = sessionsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Validation error',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { limit, offset } = parsed.data;
    const result = await sessionsService.getHistory(
      request.user.id,
      limit,
      offset
    );

    return {
      sessions: result.sessions,
      total: result.total,
      limit,
      offset,
    };
  });

  // Get stats
  fastify.get('/stats', async (request) => {
    const stats = await sessionsService.getStats(request.user.id);
    return { stats };
  });
}
