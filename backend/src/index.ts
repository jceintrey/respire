import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { env } from './config/env.js';
import { jwtPlugin } from './plugins/jwt.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { patternsRoutes } from './modules/patterns/patterns.routes.js';
import { sessionsRoutes } from './modules/sessions/sessions.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';

const fastify = Fastify({
  logger: env.NODE_ENV === 'development'
    ? { level: 'debug' }
    : { level: 'info' },
});

async function start() {
  // Plugins
  await fastify.register(cors, {
    origin: env.NODE_ENV === 'development' ? true : env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await fastify.register(cookie);
  await fastify.register(jwtPlugin);

  // Health check
  fastify.get('/api/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  // Routes
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(patternsRoutes, { prefix: '/api/patterns' });
  await fastify.register(sessionsRoutes, { prefix: '/api/sessions' });
  await fastify.register(adminRoutes, { prefix: '/api/admin' });

  // Start server
  try {
    await fastify.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`🚀 Server running at http://localhost:${env.PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
