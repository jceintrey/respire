import type { FastifyInstance } from 'fastify';
import { patternsService } from './patterns.service.js';
import {
  createPatternSchema,
  updatePatternSchema,
  type CreatePatternInput,
  type UpdatePatternInput,
} from './patterns.schemas.js';

export async function patternsRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // Get all patterns (presets + user's custom)
  fastify.get('/', async (request) => {
    const patterns = await patternsService.getAll(request.user.id);
    return { patterns };
  });

  // Get single pattern
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const pattern = await patternsService.getById(
      request.params.id,
      request.user.id
    );

    if (!pattern) {
      return reply.status(404).send({ error: 'Pattern non trouvé' });
    }

    return { pattern };
  });

  // Create custom pattern
  fastify.post<{ Body: CreatePatternInput }>('/', async (request, reply) => {
    const parsed = createPatternSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Validation error',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const pattern = await patternsService.create(request.user.id, parsed.data);
    return reply.status(201).send({ pattern });
  });

  // Update custom pattern
  fastify.put<{ Params: { id: string }; Body: UpdatePatternInput }>(
    '/:id',
    async (request, reply) => {
      const parsed = updatePatternSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Validation error',
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const pattern = await patternsService.update(
        request.params.id,
        request.user.id,
        parsed.data
      );

      if (!pattern) {
        return reply.status(404).send({
          error: 'Pattern non trouvé ou non modifiable',
        });
      }

      return { pattern };
    }
  );

  // Delete custom pattern
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const deleted = await patternsService.delete(
      request.params.id,
      request.user.id
    );

    if (!deleted) {
      return reply.status(404).send({
        error: 'Pattern non trouvé ou non supprimable',
      });
    }

    return { message: 'Pattern supprimé' };
  });
}
