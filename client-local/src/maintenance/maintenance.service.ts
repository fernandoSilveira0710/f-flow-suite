import { Injectable } from '@nestjs/common';

@Injectable()
export class MaintenanceService {
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
}