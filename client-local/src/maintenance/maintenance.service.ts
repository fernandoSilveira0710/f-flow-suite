import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';
import * as path from 'path';

@Injectable()
export class MaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  async runMigrations(): Promise<void> {
    const isPackaged = !!(process as any).pkg;
    if (isPackaged) {
      const { runPackagedMigrations } = await import('../common/migrations/migration-runner');
      const { join, dirname } = await import('path');
      const { execPath } = process as any;
      await runPackagedMigrations({ migrationsRoot: join(dirname(execPath), 'prisma', 'migrations') });
    } else {
      const { spawn } = await import('child_process');
      await new Promise<void>((resolve, reject) => {
        const p = spawn('npx', ['prisma', 'migrate', 'deploy'], {
          stdio: 'pipe',
          shell: true,
          env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
        });
        p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`Exit ${code}`))));
        p.on('error', reject);
      });
    }
  }

  async resetDatabase(): Promise<{ dbPath: string; deleted: boolean }> {
    const dbPath = this.resolveDatabasePath(process.env.DATABASE_URL || '');
    await this.prisma.$disconnect();

    const deletedMain = await this.tryUnlink(dbPath);
    await this.tryUnlink(`${dbPath}-wal`);
    await this.tryUnlink(`${dbPath}-shm`);

    return { dbPath, deleted: deletedMain };
  }

  private resolveDatabasePath(databaseUrl: string): string {
    const raw = databaseUrl.startsWith('file:') ? databaseUrl.slice('file:'.length) : databaseUrl;
    const noLeading = raw.replace(/^\/+/, '');
    const normalized = noLeading.replace(/\//g, path.sep);
    return path.isAbsolute(normalized) ? normalized : path.resolve(process.cwd(), normalized);
  }

  private async tryUnlink(filePath: string): Promise<boolean> {
    if (!filePath || !existsSync(filePath)) return false;
    const attempts = 15;
    for (let i = 0; i < attempts; i++) {
      try {
        await unlink(filePath);
        return true;
      } catch (e: any) {
        const code = String(e?.code || '');
        if (code === 'EPERM' || code === 'EBUSY' || code === 'EACCES') {
          await new Promise((r) => setTimeout(r, 120));
          continue;
        }
        if (code === 'ENOENT') return false;
        throw e;
      }
    }
    return false;
  }
}
