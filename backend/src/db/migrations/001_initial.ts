import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // Enable UUID extension
  await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`.execute(db);

  // Users table
  await db.schema
    .createTable('users')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('email', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('password_hash', 'varchar(255)')
    .addColumn('google_id', 'varchar(255)', (col) => col.unique())
    .addColumn('name', 'varchar(100)')
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`NOW()`).notNull()
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.defaultTo(sql`NOW()`).notNull()
    )
    .execute();

  // Breathing patterns table
  await db.schema
    .createTable('breathing_patterns')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.references('users.id').onDelete('cascade')
    )
    .addColumn('name', 'varchar(100)', (col) => col.notNull())
    .addColumn('inhale_duration', 'integer', (col) => col.notNull())
    .addColumn('inhale_hold_duration', 'integer', (col) =>
      col.defaultTo(0).notNull()
    )
    .addColumn('exhale_duration', 'integer', (col) => col.notNull())
    .addColumn('exhale_hold_duration', 'integer', (col) =>
      col.defaultTo(0).notNull()
    )
    .addColumn('cycles', 'integer', (col) => col.defaultTo(6).notNull())
    .addColumn('is_preset', 'boolean', (col) => col.defaultTo(false).notNull())
    .addColumn('theme', 'varchar(50)', (col) =>
      col.defaultTo('ocean').notNull()
    )
    .addColumn('sound_type', 'varchar(50)', (col) =>
      col.defaultTo('soft-bell').notNull()
    )
    .addColumn('background_music', 'varchar(100)')
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`NOW()`).notNull()
    )
    .execute();

  // Sessions table
  await db.schema
    .createTable('sessions')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.references('users.id').onDelete('cascade').notNull()
    )
    .addColumn('pattern_id', 'uuid', (col) =>
      col.references('breathing_patterns.id').onDelete('set null')
    )
    .addColumn('pattern_name', 'varchar(100)', (col) => col.notNull())
    .addColumn('duration_seconds', 'integer', (col) => col.notNull())
    .addColumn('cycles_completed', 'integer', (col) => col.notNull())
    .addColumn('completed_at', 'timestamp', (col) =>
      col.defaultTo(sql`NOW()`).notNull()
    )
    .execute();

  // Refresh tokens table
  await db.schema
    .createTable('refresh_tokens')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.references('users.id').onDelete('cascade').notNull()
    )
    .addColumn('token_hash', 'varchar(255)', (col) => col.notNull())
    .addColumn('expires_at', 'timestamp', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`NOW()`).notNull()
    )
    .execute();

  // Indexes
  await db.schema
    .createIndex('idx_sessions_user_id')
    .on('sessions')
    .column('user_id')
    .execute();

  await db.schema
    .createIndex('idx_sessions_completed_at')
    .on('sessions')
    .column('completed_at')
    .execute();

  await db.schema
    .createIndex('idx_breathing_patterns_user_id')
    .on('breathing_patterns')
    .column('user_id')
    .execute();

  await db.schema
    .createIndex('idx_refresh_tokens_user_id')
    .on('refresh_tokens')
    .column('user_id')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('refresh_tokens').execute();
  await db.schema.dropTable('sessions').execute();
  await db.schema.dropTable('breathing_patterns').execute();
  await db.schema.dropTable('users').execute();
}
