import { db } from '../../db/kysely.js';
import type { User } from '../../db/types.js';
import type { UpdateUserInput } from './admin.schemas.js';

export interface UserWithStats extends User {
  sessionsCount: number;
  patternsCount: number;
}

export class AdminService {
  async getAllUsers(): Promise<UserWithStats[]> {
    const users = await db
      .selectFrom('users')
      .selectAll('users')
      .select((eb) => [
        eb
          .selectFrom('sessions')
          .select(eb.fn.count('id').as('count'))
          .whereRef('sessions.user_id', '=', 'users.id')
          .as('sessionsCount'),
        eb
          .selectFrom('breathing_patterns')
          .select(eb.fn.count('id').as('count'))
          .whereRef('breathing_patterns.user_id', '=', 'users.id')
          .as('patternsCount'),
      ])
      .orderBy('created_at', 'desc')
      .execute();

    return users.map((u) => ({
      ...u,
      sessionsCount: Number(u.sessionsCount) || 0,
      patternsCount: Number(u.patternsCount) || 0,
    }));
  }

  async getUserById(userId: string): Promise<UserWithStats | null> {
    const user = await db
      .selectFrom('users')
      .selectAll('users')
      .select((eb) => [
        eb
          .selectFrom('sessions')
          .select(eb.fn.count('id').as('count'))
          .whereRef('sessions.user_id', '=', 'users.id')
          .as('sessionsCount'),
        eb
          .selectFrom('breathing_patterns')
          .select(eb.fn.count('id').as('count'))
          .whereRef('breathing_patterns.user_id', '=', 'users.id')
          .as('patternsCount'),
      ])
      .where('users.id', '=', userId)
      .executeTakeFirst();

    if (!user) return null;

    return {
      ...user,
      sessionsCount: Number(user.sessionsCount) || 0,
      patternsCount: Number(user.patternsCount) || 0,
    };
  }

  async updateUser(userId: string, input: UpdateUserInput): Promise<User> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.email !== undefined) {
      updateData.email = input.email.toLowerCase();
    }
    if (input.isAdmin !== undefined) {
      updateData.is_admin = input.isAdmin;
    }

    const user = await db
      .updateTable('users')
      .set(updateData)
      .where('id', '=', userId)
      .returningAll()
      .executeTakeFirst();

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    return user;
  }

  async deleteUser(userId: string): Promise<void> {
    const result = await db
      .deleteFrom('users')
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!result.numDeletedRows) {
      throw new Error('Utilisateur non trouvé');
    }
  }

  async getStats(): Promise<{
    totalUsers: number;
    totalSessions: number;
    totalPatterns: number;
    usersLast7Days: number;
    sessionsLast7Days: number;
  }> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [totalUsers, totalSessions, totalPatterns, usersLast7Days, sessionsLast7Days] =
      await Promise.all([
        db
          .selectFrom('users')
          .select(db.fn.count('id').as('count'))
          .executeTakeFirstOrThrow(),
        db
          .selectFrom('sessions')
          .select(db.fn.count('id').as('count'))
          .executeTakeFirstOrThrow(),
        db
          .selectFrom('breathing_patterns')
          .select(db.fn.count('id').as('count'))
          .executeTakeFirstOrThrow(),
        db
          .selectFrom('users')
          .select(db.fn.count('id').as('count'))
          .where('created_at', '>=', sevenDaysAgo)
          .executeTakeFirstOrThrow(),
        db
          .selectFrom('sessions')
          .select(db.fn.count('id').as('count'))
          .where('completed_at', '>=', sevenDaysAgo)
          .executeTakeFirstOrThrow(),
      ]);

    return {
      totalUsers: Number(totalUsers.count),
      totalSessions: Number(totalSessions.count),
      totalPatterns: Number(totalPatterns.count),
      usersLast7Days: Number(usersLast7Days.count),
      sessionsLast7Days: Number(sessionsLast7Days.count),
    };
  }
}

export const adminService = new AdminService();
