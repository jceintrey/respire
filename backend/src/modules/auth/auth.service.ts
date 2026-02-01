import { db } from '../../db/kysely.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { generateRefreshToken, hashToken } from '../../utils/tokens.js';
import type { RegisterInput, LoginInput } from './auth.schemas.js';
import type { User } from '../../db/types.js';
import crypto from 'crypto';

const REFRESH_TOKEN_EXPIRY_DAYS = 30;
const PASSWORD_RESET_EXPIRY_HOURS = 1;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserPayload {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
}

export class AuthService {
  async register(input: RegisterInput): Promise<User> {
    const existingUser = await db
      .selectFrom('users')
      .select('id')
      .where('email', '=', input.email.toLowerCase())
      .executeTakeFirst();

    if (existingUser) {
      throw new Error('Un compte existe déjà avec cet email');
    }

    const passwordHash = await hashPassword(input.password);

    const user = await db
      .insertInto('users')
      .values({
        email: input.email.toLowerCase(),
        password_hash: passwordHash,
        name: input.name || null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return user;
  }

  async login(input: LoginInput): Promise<User> {
    const user = await db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', input.email.toLowerCase())
      .executeTakeFirst();

    if (!user || !user.password_hash) {
      throw new Error('Email ou mot de passe incorrect');
    }

    const validPassword = await verifyPassword(user.password_hash, input.password);
    if (!validPassword) {
      throw new Error('Email ou mot de passe incorrect');
    }

    return user;
  }

  async findOrCreateGoogleUser(
    googleId: string,
    email: string,
    name: string | null
  ): Promise<User> {
    // Check if user exists with Google ID
    let user = await db
      .selectFrom('users')
      .selectAll()
      .where('google_id', '=', googleId)
      .executeTakeFirst();

    if (user) {
      return user;
    }

    // Check if user exists with email
    user = await db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email.toLowerCase())
      .executeTakeFirst();

    if (user) {
      // Link Google account to existing user
      user = await db
        .updateTable('users')
        .set({ google_id: googleId, updated_at: new Date() })
        .where('id', '=', user.id)
        .returningAll()
        .executeTakeFirstOrThrow();
      return user;
    }

    // Create new user
    user = await db
      .insertInto('users')
      .values({
        email: email.toLowerCase(),
        google_id: googleId,
        name,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return user;
  }

  async createRefreshToken(userId: string): Promise<string> {
    const token = generateRefreshToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await db
      .insertInto('refresh_tokens')
      .values({
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      })
      .execute();

    return token;
  }

  async validateRefreshToken(token: string): Promise<User | null> {
    const tokenHash = hashToken(token);

    const refreshToken = await db
      .selectFrom('refresh_tokens')
      .selectAll()
      .where('token_hash', '=', tokenHash)
      .where('expires_at', '>', new Date())
      .executeTakeFirst();

    if (!refreshToken) {
      return null;
    }

    const user = await db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', refreshToken.user_id)
      .executeTakeFirst();

    return user || null;
  }

  async revokeRefreshToken(token: string): Promise<void> {
    const tokenHash = hashToken(token);
    await db
      .deleteFrom('refresh_tokens')
      .where('token_hash', '=', tokenHash)
      .execute();
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await db
      .deleteFrom('refresh_tokens')
      .where('user_id', '=', userId)
      .execute();
  }

  async getUserById(userId: string): Promise<User | null> {
    const user = await db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', userId)
      .executeTakeFirst();

    return user || null;
  }

  toUserPayload(user: User): UserPayload {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.is_admin,
    };
  }

  async createPasswordResetToken(email: string): Promise<string | null> {
    const user = await db
      .selectFrom('users')
      .select(['id', 'password_hash'])
      .where('email', '=', email.toLowerCase())
      .executeTakeFirst();

    // Don't reveal if user exists, but also don't create token for Google-only accounts
    if (!user || !user.password_hash) {
      return null;
    }

    // Invalidate any existing tokens for this user
    await db
      .updateTable('password_reset_tokens')
      .set({ used_at: new Date() })
      .where('user_id', '=', user.id)
      .where('used_at', 'is', null)
      .execute();

    // Generate new token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + PASSWORD_RESET_EXPIRY_HOURS);

    await db
      .insertInto('password_reset_tokens')
      .values({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      })
      .execute();

    return token;
  }

  async validatePasswordResetToken(token: string): Promise<User | null> {
    const tokenHash = hashToken(token);

    const resetToken = await db
      .selectFrom('password_reset_tokens')
      .selectAll()
      .where('token_hash', '=', tokenHash)
      .where('expires_at', '>', new Date())
      .where('used_at', 'is', null)
      .executeTakeFirst();

    if (!resetToken) {
      return null;
    }

    const user = await db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', resetToken.user_id)
      .executeTakeFirst();

    return user || null;
  }

  async resetPassword(token: string, newPassword: string): Promise<User | null> {
    const tokenHash = hashToken(token);

    const resetToken = await db
      .selectFrom('password_reset_tokens')
      .selectAll()
      .where('token_hash', '=', tokenHash)
      .where('expires_at', '>', new Date())
      .where('used_at', 'is', null)
      .executeTakeFirst();

    if (!resetToken) {
      return null;
    }

    const passwordHash = await hashPassword(newPassword);

    // Update password
    const user = await db
      .updateTable('users')
      .set({
        password_hash: passwordHash,
        updated_at: new Date(),
      })
      .where('id', '=', resetToken.user_id)
      .returningAll()
      .executeTakeFirst();

    // Mark token as used
    await db
      .updateTable('password_reset_tokens')
      .set({ used_at: new Date() })
      .where('id', '=', resetToken.id)
      .execute();

    // Revoke all refresh tokens for security
    if (user) {
      await this.revokeAllUserTokens(user.id);
    }

    return user || null;
  }

  async adminResetPassword(userId: string, newPassword: string): Promise<User | null> {
    const passwordHash = await hashPassword(newPassword);

    const user = await db
      .updateTable('users')
      .set({
        password_hash: passwordHash,
        updated_at: new Date(),
      })
      .where('id', '=', userId)
      .returningAll()
      .executeTakeFirst();

    // Revoke all refresh tokens for security
    if (user) {
      await this.revokeAllUserTokens(user.id);
    }

    return user || null;
  }
}

export const authService = new AuthService();
