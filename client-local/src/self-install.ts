import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import fse from 'fs-extra';

function isWindows(): boolean {
  return process.platform === 'win32';
}

function programFilesDir(): string {
  const pf = process.env['ProgramFiles'] || 'C:/Program Files';
  return pf.replace(/\\/g, '/');
}

function programDataDir(): string {
  const pd = process.env['ProgramData'] || 'C:/ProgramData';
  return pd.replace(/\\/g, '/');
}

function ensureDir(p: string) {
  fse.mkdirpSync(p);
}

function copyFile(src: string, dest: string) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function writeTextFile(dest: string, content: string) {
  ensureDir(path.dirname(dest));
  fs.writeFileSync(dest, content, { encoding: 'utf-8' });
}

function assetPath(...segments: string[]): string {
  // When packaged by pkg, __dirname points to snapshot. Reading is allowed.
  return path.join(__dirname, ...segments);
}

function copyWinswBinaries(winswDir: string) {
  const winswSrc = assetPath('..', 'installers', 'windows', 'winsw', 'WinSW-x64.exe');
  if (!fs.existsSync(winswSrc)) {
    throw new Error(`WinSW asset não encontrado: ${winswSrc}`);
  }
  const clientWinsw = path.join(winswDir, 'F-Flow-Client-Local.exe');
  const erpWinsw = path.join(winswDir, 'F-Flow-ERP-Local.exe');
  copyFile(winswSrc, clientWinsw);
  copyFile(winswSrc, erpWinsw);
  return { clientWinsw, erpWinsw };
}

function writeClientServiceXml(xmlPath: string, installRoot: string, logsRoot: string) {
  const content = [
    '<service>',
    '  <id>F-Flow-Client-Local</id>',
    '  <name>2F System Client Local Service</name>',
    '  <description>2F System - Client Local Server</description>',
    `  <executable>${path.join(installRoot, 'f-flow-client.exe')}</executable>`,
    '  <arguments>--service</arguments>',
    `  <workingdirectory>${installRoot}</workingdirectory>`,
    `  <logpath>${path.join(logsRoot, 'client-local')}</logpath>`,
    '  <env name="PRISMA_CLIENT_ENGINE_TYPE" value="library"/>',
    `  <env name="PRISMA_QUERY_ENGINE_LIBRARY" value="${path.join(installRoot, 'prisma-client', 'query_engine-windows.dll.node')}"/>`,
    `  <env name="LOCAL_DATA_DIR" value="${installRoot}"/>`,
    `  <env name="LOCAL_LOG_DIR" value="${path.join(logsRoot, 'client-local')}"/>`,
    '  <env name="CLIENT_HTTP_PORT" value="8081"/>',
    '  <env name="NODE_ENV" value="production"/>',
    '  <env name="SKIP_MIGRATIONS" value="true"/>',
    '  <env name="LICENSING_ENFORCED" value="false"/>',
    '  <startmode>Automatic</startmode>',
    '  <stoptimeout>15000</stoptimeout>',
    '  <resetfailure>86400</resetfailure>',
    '  <onfailure>restart</onfailure>',
    '</service>',
    '',
  ].join('\n');
  writeTextFile(xmlPath, content);
}

function writeErpServiceXml(xmlPath: string, installRoot: string, logsRoot: string) {
  const erpRoot = path.join(installRoot, 'erp', 'dist');
  const args = `--erp-service --root "${erpRoot}" --port 8080`;
  const content = [
    '<service>',
    '  <id>F-Flow-ERP-Local</id>',
    '  <name>2F System ERP Local Service</name>',
    '  <description>2F System - ERP local (servidor estático)</description>',
    `  <executable>${path.join(installRoot, 'f-flow-client.exe')}</executable>`,
    `  <arguments>${args}</arguments>`,
    `  <logpath>${path.join(logsRoot, 'erp')}</logpath>`,
    '  <onfailure action="restart" delay="5 sec"/>',
    '  <resetfailure>1 hour</resetfailure>',
    '</service>',
    '',
  ].join('\n');
  writeTextFile(xmlPath, content);
}

function writeEnvFile(installRoot: string, logsRoot: string) {
  const envPath = path.join(installRoot, '.env');
  const content = [
    'LOCAL_SERVER_ENABLED=true',
    'CLIENT_HTTP_PORT=8081',
    'HUB_BASE_URL=https://hub.f-flow.com',
    'DATABASE_URL="file:./local.db"',
    `LOCAL_DATA_DIR=${installRoot}`,
    `LOCAL_LOG_DIR=${path.join(logsRoot, 'client-local')}`,
    'PRISMA_CLIENT_ENGINE_TYPE=library',
    `PRISMA_QUERY_ENGINE_LIBRARY=${path.join(installRoot, 'prisma-client', 'query_engine-windows.dll.node')}`,
    'SKIP_MIGRATIONS=true',
    'NODE_ENV=production',
    '',
  ].join('\n');
  writeTextFile(envPath, content);
}

function copyPrismaEngine(installRoot: string) {
  // Try to copy Prisma engine from packaged assets folder we produce at build
  const engineSrc = path.join(path.dirname(process.execPath), 'query_engine-windows.dll.node');
  if (fs.existsSync(engineSrc)) {
    copyFile(engineSrc, path.join(installRoot, 'query_engine-windows.dll.node'));
    copyFile(engineSrc, path.join(installRoot, 'prisma-client', 'query_engine-windows.dll.node'));
  }
}

function copyPrismaClientFolder(installRoot: string) {
  // Prefer bundled prisma-client next to the executable (pkg/distribution)
  const exeDir = path.dirname(process.execPath);
  const bundledClientDir = path.join(exeDir, 'prisma-client');

  if (fs.existsSync(bundledClientDir)) {
    try {
      fse.copySync(bundledClientDir, path.join(installRoot, 'prisma-client'), { overwrite: true });
      return true;
    } catch (err) {
      console.warn('Falha ao copiar pasta prisma-client do diretório do executável:', (err as Error).message);
    }
  }

  // Fallback (dev): try to copy from node_modules/.prisma/client
  const devClientDir = path.join(process.cwd(), 'node_modules', '.prisma', 'client');
  if (fs.existsSync(devClientDir)) {
    try {
      fse.copySync(devClientDir, path.join(installRoot, 'prisma-client'), { overwrite: true });
      return true;
    } catch (err) {
      console.warn('Falha ao copiar pasta prisma-client de node_modules:', (err as Error).message);
    }
  }

  console.warn('Pasta prisma-client não encontrada. O serviço pode falhar ao iniciar o Prisma.');
  return false;
}

function copyErpDistIfAvailable(installRoot: string) {
  const assetErpDist = assetPath('..', '..', 'site', 'dist');
  const target = path.join(installRoot, 'erp', 'dist');
  if (fs.existsSync(assetErpDist)) {
    fse.copySync(assetErpDist, target, { overwrite: true });
    return true;
  }
  return false;
}

function installAndStartService(wrapperExe: string) {
  const install = spawnSync(wrapperExe, ['install'], { stdio: 'inherit' });
  if (install.status !== 0) {
    // If already installed, continue
    console.warn(`Instalação do serviço pode já existir (${wrapperExe}). status=${install.status}`);
  }
  const start = spawnSync(wrapperExe, ['start'], { stdio: 'inherit' });
  if (start.status !== 0) {
    console.error(`Falha ao iniciar serviço (${wrapperExe}). status=${start.status}`);
  }
}

function stopServiceIfExists(wrapperExe: string) {
  try {
    if (fs.existsSync(wrapperExe)) {
      const stop = spawnSync(wrapperExe, ['stop'], { stdio: 'inherit' });
      if (stop.status !== 0) {
        console.warn(`Falha ao parar serviço (${wrapperExe}) ou já parado. status=${stop.status}`);
      }
    }
  } catch (err) {
    console.warn(`Erro ao tentar parar serviço (${wrapperExe}): ${(err as Error).message}`);
  }
}

export async function selfInstallWindows(): Promise<boolean> {
  if (!isWindows()) return false;

  const installRoot = path.join(programFilesDir(), 'F-Flow', 'ClientLocal');
  const winswDir = path.join(installRoot, 'installers', 'windows', 'winsw');
  const logsRoot = path.join(programDataDir(), 'FFlow', 'logs');

  try {
    // Try to create install directory to check permissions
    ensureDir(installRoot);
  } catch (err) {
    console.error('Permissão negada para criar diretório de instalação. Execute como Administrador.');
    throw err;
  }

  // Create required directories
  ensureDir(winswDir);
  ensureDir(path.join(logsRoot, 'client-local'));
  ensureDir(path.join(logsRoot, 'erp'));

  // Preemptively stop services if wrappers exist (upgrade path)
  const existingClientWrapper = path.join(winswDir, 'F-Flow-Client-Local.exe');
  const existingErpWrapper = path.join(winswDir, 'F-Flow-ERP-Local.exe');
  stopServiceIfExists(existingClientWrapper);
  stopServiceIfExists(existingErpWrapper);

  // Copy current executable
  const targetExe = path.join(installRoot, 'f-flow-client.exe');
  copyFile(process.execPath, targetExe);

  // Copy WinSW wrappers
  const { clientWinsw, erpWinsw } = copyWinswBinaries(winswDir);

  // Write service XMLs
  writeClientServiceXml(path.join(winswDir, 'F-Flow-Client-Local.xml'), installRoot, logsRoot);
  writeErpServiceXml(path.join(winswDir, 'F-Flow-ERP-Local.xml'), installRoot, logsRoot);

  // Write environment file
  writeEnvFile(installRoot, logsRoot);

  // Copy Prisma engine if available next to exe
  copyPrismaEngine(installRoot);

  // Copy Prisma client JS bundle (index.js e artefatos gerados)
  copyPrismaClientFolder(installRoot);

  // Copy ERP assets if bundled
  const erpCopied = copyErpDistIfAvailable(installRoot);
  if (!erpCopied) {
    console.warn('Assets do ERP não encontrados nos assets do pacote. O serviço ERP pode não servir a UI local.');
  }

  // Install and start services
  installAndStartService(clientWinsw);
  installAndStartService(erpWinsw);

  return true;
}