import { Kysely, sql } from 'kysely';
import { db } from './kysely.js';
import * as migration001 from './migrations/001_initial.js';

const migrations = [
  { name: '001_initial', ...migration001 },
];

async function migrate() {
  const direction = process.argv[2];

  // Create migrations table if not exists
  await db.schema
    .createTable('_migrations')
    .ifNotExists()
    .addColumn('name', 'varchar(255)', (col) => col.primaryKey())
    .addColumn('executed_at', 'timestamp', (col) => col.defaultTo(sql`NOW()`))
    .execute();

  if (direction === 'down') {
    // Rollback last migration
    const executed = await db
      .selectFrom('_migrations' as any)
      .select('name')
      .orderBy('executed_at', 'desc')
      .limit(1)
      .execute();

    if (executed.length === 0) {
      console.log('No migrations to rollback');
      process.exit(0);
    }

    const lastMigration = migrations.find((m) => m.name === executed[0].name);
    if (lastMigration) {
      console.log(`Rolling back: ${lastMigration.name}`);
      await lastMigration.down(db as Kysely<any>);
      await db
        .deleteFrom('_migrations' as any)
        .where('name', '=', lastMigration.name)
        .execute();
      console.log(`Rolled back: ${lastMigration.name}`);
    }
  } else {
    // Run pending migrations
    const executed = await db
      .selectFrom('_migrations' as any)
      .select('name')
      .execute();

    const executedNames = new Set(executed.map((r: any) => r.name));

    for (const migration of migrations) {
      if (!executedNames.has(migration.name)) {
        console.log(`Running: ${migration.name}`);
        await migration.up(db as Kysely<any>);
        await db
          .insertInto('_migrations' as any)
          .values({ name: migration.name })
          .execute();
        console.log(`Completed: ${migration.name}`);
      }
    }

    console.log('All migrations completed');
  }

  await db.destroy();
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
