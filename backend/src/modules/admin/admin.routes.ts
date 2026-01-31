import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { adminService } from './admin.service.js';
import { updateUserSchema, userIdParamSchema, type UpdateUserInput, type UserIdParam } from './admin.schemas.js';

async function adminGuard(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    if (!request.user.isAdmin) {
      return reply.status(403).send({ error: 'Accès refusé - Admin requis' });
    }
  } catch {
    return reply.status(401).send({ error: 'Non autorisé' });
  }
}

export async function adminRoutes(fastify: FastifyInstance) {
  // All admin routes require admin authentication
  fastify.addHook('preHandler', adminGuard);

  // Get admin stats
  fastify.get('/stats', async () => {
    const stats = await adminService.getStats();
    return { stats };
  });

  // Get all users
  fastify.get('/users', async () => {
    const users = await adminService.getAllUsers();
    return {
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        isAdmin: u.is_admin,
        googleId: u.google_id ? true : false,
        sessionsCount: u.sessionsCount,
        patternsCount: u.patternsCount,
        createdAt: u.created_at,
      })),
    };
  });

  // Get single user
  fastify.get<{ Params: UserIdParam }>('/users/:id', async (request, reply) => {
    const parsed = userIdParamSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID invalide' });
    }

    const user = await adminService.getUserById(parsed.data.id);
    if (!user) {
      return reply.status(404).send({ error: 'Utilisateur non trouvé' });
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.is_admin,
        googleId: user.google_id ? true : false,
        sessionsCount: user.sessionsCount,
        patternsCount: user.patternsCount,
        createdAt: user.created_at,
      },
    };
  });

  // Update user
  fastify.put<{ Params: UserIdParam; Body: UpdateUserInput }>(
    '/users/:id',
    async (request, reply) => {
      const paramsParsed = userIdParamSchema.safeParse(request.params);
      if (!paramsParsed.success) {
        return reply.status(400).send({ error: 'ID invalide' });
      }

      const bodyParsed = updateUserSchema.safeParse(request.body);
      if (!bodyParsed.success) {
        return reply.status(400).send({
          error: 'Données invalides',
          details: bodyParsed.error.flatten().fieldErrors,
        });
      }

      // Prevent self-demotion
      if (paramsParsed.data.id === request.user.id && bodyParsed.data.isAdmin === false) {
        return reply.status(400).send({ error: 'Vous ne pouvez pas retirer vos propres droits admin' });
      }

      try {
        const user = await adminService.updateUser(paramsParsed.data.id, bodyParsed.data);
        return {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            isAdmin: user.is_admin,
          },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue';
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Delete user
  fastify.delete<{ Params: UserIdParam }>('/users/:id', async (request, reply) => {
    const parsed = userIdParamSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID invalide' });
    }

    // Prevent self-deletion
    if (parsed.data.id === request.user.id) {
      return reply.status(400).send({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    try {
      await adminService.deleteUser(parsed.data.id);
      return { message: 'Utilisateur supprimé' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      return reply.status(400).send({ error: message });
    }
  });
}
