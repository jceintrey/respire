import { db } from '../../db/kysely.js';
import { sql } from 'kysely';
import type { Session } from '../../db/types.js';
import type { CreateSessionInput } from './sessions.schemas.js';

export interface SessionStats {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  weeklyAverage: number;
  lastWeek: Array<{
    date: string;
    sessions: number;
    minutes: number;
  }>;
}

export class SessionsService {
  async create(userId: string, input: CreateSessionInput): Promise<Session> {
    const session = await db
      .insertInto('sessions')
      .values({
        user_id: userId,
        pattern_id: input.pattern_id || null,
        pattern_name: input.pattern_name,
        duration_seconds: input.duration_seconds,
        cycles_completed: input.cycles_completed,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return session;
  }

  async getHistory(
    userId: string,
    limit: number,
    offset: number
  ): Promise<{ sessions: Session[]; total: number }> {
    const [sessions, countResult] = await Promise.all([
      db
        .selectFrom('sessions')
        .selectAll()
        .where('user_id', '=', userId)
        .orderBy('completed_at', 'desc')
        .limit(limit)
        .offset(offset)
        .execute(),
      db
        .selectFrom('sessions')
        .select(db.fn.count('id').as('count'))
        .where('user_id', '=', userId)
        .executeTakeFirst(),
    ]);

    return {
      sessions,
      total: Number(countResult?.count ?? 0),
    };
  }

  async getStats(userId: string): Promise<SessionStats> {
    // Total sessions and minutes
    const totals = await db
      .selectFrom('sessions')
      .select([
        db.fn.count('id').as('total_sessions'),
        db.fn.sum('duration_seconds').as('total_seconds'),
      ])
      .where('user_id', '=', userId)
      .executeTakeFirst();

    // Last 7 days breakdown
    const lastWeek = await db
      .selectFrom('sessions')
      .select([
        sql<string>`DATE(completed_at)`.as('date'),
        db.fn.count('id').as('sessions'),
        db.fn.sum('duration_seconds').as('seconds'),
      ])
      .where('user_id', '=', userId)
      .where('completed_at', '>=', sql<Date>`NOW() - INTERVAL '7 days'`)
      .groupBy(sql`DATE(completed_at)`)
      .orderBy('date', 'desc')
      .execute();

    // Calculate streaks
    const allDates = await db
      .selectFrom('sessions')
      .select(sql<string>`DISTINCT DATE(completed_at)`.as('date'))
      .where('user_id', '=', userId)
      .orderBy('date', 'desc')
      .execute();

    const { currentStreak, longestStreak } = this.calculateStreaks(
      allDates.map((d) => d.date)
    );

    // Weekly average (last 4 weeks)
    const fourWeeksAgo = await db
      .selectFrom('sessions')
      .select(db.fn.count('id').as('count'))
      .where('user_id', '=', userId)
      .where('completed_at', '>=', sql<Date>`NOW() - INTERVAL '28 days'`)
      .executeTakeFirst();

    const weeklyAverage = Number(fourWeeksAgo?.count ?? 0) / 4;

    return {
      totalSessions: Number(totals?.total_sessions ?? 0),
      totalMinutes: Math.round(Number(totals?.total_seconds ?? 0) / 60),
      currentStreak,
      longestStreak,
      weeklyAverage: Math.round(weeklyAverage * 10) / 10,
      lastWeek: lastWeek.map((day) => ({
        date: day.date,
        sessions: Number(day.sessions),
        minutes: Math.round(Number(day.seconds) / 60),
      })),
    };
  }

  private calculateStreaks(dates: string[]): {
    currentStreak: number;
    longestStreak: number;
  } {
    if (dates.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateSet = new Set(dates);
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Current streak
    let currentStreak = 0;
    let checkDate = dateSet.has(todayStr) ? today : yesterday;

    if (!dateSet.has(todayStr) && !dateSet.has(yesterdayStr)) {
      currentStreak = 0;
    } else {
      while (dateSet.has(checkDate.toISOString().split('T')[0])) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    // Longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    const sortedDates = [...dates].sort();

    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const diffDays = Math.round(
          (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    return { currentStreak, longestStreak };
  }
}

export const sessionsService = new SessionsService();
