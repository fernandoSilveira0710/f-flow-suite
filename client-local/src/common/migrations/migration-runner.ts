import { join } from 'path';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { createHash } from 'crypto';

function sortDirsChronologically(dirs: string[]): string[] {
  // Prisma directories are named with timestamps; sort by name asc
  return dirs.sort();
}

function splitSqlStatements(sql: string): string[] {
  // Naive split by semicolon; keeps statements meaningful and trims empty ones
  return sql
    .split(/;\s*\n|;\s*$/gm)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function ensureMigrationsTable(prisma: any): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "checksum" TEXT NOT NULL,
      "finished_at" DATETIME,
      "migration_name" TEXT NOT NULL,
      "logs" TEXT,
      "rolled_back_at" DATETIME,
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    );
  `);
}

function sha256(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

export interface RunPackagedMigrationsOptions {
  migrationsRoot?: string;
}

export async function runPackagedMigrations(options: RunPackagedMigrationsOptions = {}): Promise<void> {
  const migrationsRoot = options.migrationsRoot || join(process.cwd(), 'prisma', 'migrations');
  if (!existsSync(migrationsRoot)) {
    return; // nothing to do
  }

  // Lazy import PrismaClient to avoid bundling issues
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    await ensureMigrationsTable(prisma);

    const dirs = readdirSync(migrationsRoot)
      .map((d) => join(migrationsRoot, d))
      .filter((p) => {
        try { return statSync(p).isDirectory(); } catch { return false; }
      });
    const ordered = sortDirsChronologically(dirs);

    // Fetch already applied migrations by name
    const appliedRows: Array<{ migration_name: string }> = await prisma.$queryRawUnsafe(
      'SELECT migration_name FROM "_prisma_migrations"'
    );
    const applied = new Set(appliedRows.map((r) => r.migration_name));

    for (const dir of ordered) {
      const name = dir.split(/[\\/]/).pop() as string;
      const filePath = join(dir, 'migration.sql');
      if (!existsSync(filePath)) continue;
      if (applied.has(name)) continue;

      const sql = readFileSync(filePath, 'utf8');
      const checksum = sha256(sql);
      const statements = splitSqlStatements(sql);

      for (const stmt of statements) {
        await prisma.$executeRawUnsafe(stmt);
      }

      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      await prisma.$executeRawUnsafe(
        'INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, applied_steps_count) VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?, NULL, ?)',
        id, checksum, name, '', statements.length
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}