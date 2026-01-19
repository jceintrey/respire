import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { OAuth2Client } from 'google-auth-library';
import { authService } from './auth.service.js';
import {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  type RegisterInput,
  type LoginInput,
  type GoogleAuthInput,
} from './auth.schemas.js';
import { env } from '../../config/env.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

export async function authRoutes(fastify: FastifyInstance) {
  const googleClient = env.GOOGLE_CLIENT_ID
    ? new OAuth2Client(env.GOOGLE_CLIENT_ID)
    : null;

  // Register
  fastify.post<{ Body: RegisterInput }>(
    '/register',
    async (request, reply) => {
      const parsed = registerSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Validation error',
          details: parsed.error.flatten().fieldErrors,
        });
      }

      try {
        const user = await authService.register(parsed.data);
        const accessToken = fastify.jwt.sign(authService.toUserPayload(user), {
          expiresIn: '15m',
        });
        const refreshToken = await authService.createRefreshToken(user.id);

        reply.setCookie('refreshToken', refreshToken, COOKIE_OPTIONS);

        return {
          user: authService.toUserPayload(user),
          accessToken,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue';
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Login
  fastify.post<{ Body: LoginInput }>('/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Validation error',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    try {
      const user = await authService.login(parsed.data);
      const accessToken = fastify.jwt.sign(authService.toUserPayload(user), {
        expiresIn: '15m',
      });
      const refreshToken = await authService.createRefreshToken(user.id);

      reply.setCookie('refreshToken', refreshToken, COOKIE_OPTIONS);

      return {
        user: authService.toUserPayload(user),
        accessToken,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      return reply.status(401).send({ error: message });
    }
  });

  // Google OAuth
  fastify.post<{ Body: GoogleAuthInput }>('/google', async (request, reply) => {
    if (!googleClient) {
      return reply.status(501).send({ error: 'Google OAuth non configuré' });
    }

    const parsed = googleAuthSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Token invalide' });
    }

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: parsed.data.idToken,
        audience: env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.sub || !payload.email) {
        return reply.status(400).send({ error: 'Token Google invalide' });
      }

      const user = await authService.findOrCreateGoogleUser(
        payload.sub,
        payload.email,
        payload.name || null
      );

      const accessToken = fastify.jwt.sign(authService.toUserPayload(user), {
        expiresIn: '15m',
      });
      const refreshToken = await authService.createRefreshToken(user.id);

      reply.setCookie('refreshToken', refreshToken, COOKIE_OPTIONS);

      return {
        user: authService.toUserPayload(user),
        accessToken,
      };
    } catch (error) {
      console.error('Google auth error:', error);
      return reply.status(401).send({ error: 'Authentification Google échouée' });
    }
  });

  // Refresh token
  fastify.post('/refresh', async (request, reply) => {
    const refreshToken = request.cookies.refreshToken;

    if (!refreshToken) {
      return reply.status(401).send({ error: 'Token de rafraîchissement manquant' });
    }

    const user = await authService.validateRefreshToken(refreshToken);
    if (!user) {
      reply.clearCookie('refreshToken', { path: '/' });
      return reply.status(401).send({ error: 'Token de rafraîchissement invalide' });
    }

    // Rotate refresh token
    await authService.revokeRefreshToken(refreshToken);
    const newRefreshToken = await authService.createRefreshToken(user.id);
    const accessToken = fastify.jwt.sign(authService.toUserPayload(user), {
      expiresIn: '15m',
    });

    reply.setCookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);

    return {
      user: authService.toUserPayload(user),
      accessToken,
    };
  });

  // Logout
  fastify.post('/logout', async (request, reply) => {
    const refreshToken = request.cookies.refreshToken;

    if (refreshToken) {
      await authService.revokeRefreshToken(refreshToken);
    }

    reply.clearCookie('refreshToken', { path: '/' });
    return { message: 'Déconnexion réussie' };
  });

  // Get current user
  fastify.get(
    '/me',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const user = await authService.getUserById(request.user.id);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }
      return { user: authService.toUserPayload(user) };
    }
  );
}
