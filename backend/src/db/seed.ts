import { db } from './kysely.js';

const PRESET_PATTERNS = [
  {
    name: 'Cohérence 5-5',
    inhale_duration: 50,
    inhale_hold_duration: 0,
    exhale_duration: 50,
    exhale_hold_duration: 0,
    cycles: 6,
    is_preset: true,
    theme: 'ocean',
    sound_type: 'soft-bell',
  },
  {
    name: 'Relaxation 4-7-8',
    inhale_duration: 40,
    inhale_hold_duration: 70,
    exhale_duration: 80,
    exhale_hold_duration: 0,
    cycles: 4,
    is_preset: true,
    theme: 'sunset',
    sound_type: 'chime',
  },
  {
    name: 'Carrée 4x4',
    inhale_duration: 40,
    inhale_hold_duration: 40,
    exhale_duration: 40,
    exhale_hold_duration: 40,
    cycles: 6,
    is_preset: true,
    theme: 'forest',
    sound_type: 'nature',
  },
  {
    name: 'Apaisante 4-6',
    inhale_duration: 40,
    inhale_hold_duration: 0,
    exhale_duration: 60,
    exhale_hold_duration: 0,
    cycles: 8,
    is_preset: true,
    theme: 'night',
    sound_type: 'soft-bell',
  },
  {
    name: 'Énergisante 3-3',
    inhale_duration: 30,
    inhale_hold_duration: 0,
    exhale_duration: 30,
    exhale_hold_duration: 0,
    cycles: 10,
    is_preset: true,
    theme: 'dawn',
    sound_type: 'bright',
  },
];

async function seed() {
  console.log('Seeding preset patterns...');

  for (const pattern of PRESET_PATTERNS) {
    const existing = await db
      .selectFrom('breathing_patterns')
      .select('id')
      .where('name', '=', pattern.name)
      .where('is_preset', '=', true)
      .executeTakeFirst();

    if (!existing) {
      await db.insertInto('breathing_patterns').values(pattern).execute();
      console.log(`Created: ${pattern.name}`);
    } else {
      console.log(`Skipped (exists): ${pattern.name}`);
    }
  }

  console.log('Seeding completed');
  await db.destroy();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
