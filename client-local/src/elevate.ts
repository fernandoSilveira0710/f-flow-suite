import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

function programFilesDir(): string {
  const pf = process.env['ProgramFiles'] || 'C:/Program Files';
  return pf.replace(/\\/g, '/');
}

export async function ensureElevation(): Promise<boolean> {
  if (process.platform !== 'win32') return false;

  const testDir = path.join(programFilesDir(), 'F-Flow', 'ClientLocal');
  try {
    // If we can create directories under Program Files, we're already elevated
    fs.mkdirSync(testDir, { recursive: true });
    return false;
  } catch {
    // Not elevated: request UAC elevation and relaunch
    try {
      const exe = process.execPath.replace(/'/g, "''");
      const args = process.argv.slice(1).map((a) => a.replace(/'/g, "''")).join(' ');
      const ps = `Start-Process -FilePath '${exe}' -ArgumentList '${args}' -Verb RunAs`;
      const child = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', ps], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
      return true;
    } catch (err) {
      // If elevation fails, continue without elevation (will likely fail to install)
      return false;
    }
  }
}