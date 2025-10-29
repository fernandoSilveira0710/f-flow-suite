#!/usr/bin/env node
// fflow-launcher: abre ERP web e centraliza logs
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEFAULT_URL = process.env.ERP_URL || 'https://erp.f-flow.com';
const LOG_DIR = 'C:/ProgramData/FFlow/logs/launcher';
const LOG_FILE = path.join(LOG_DIR, 'launcher.log');

function ensureLogDir() {
  try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch {}
}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try { fs.appendFileSync(LOG_FILE, line); } catch {}
}

function openUrl(url) {
  // Usa o cmd start para abrir no navegador padrão
  const child = spawn('cmd.exe', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' });
  child.unref();
}

(function main() {
  ensureLogDir();
  const url = process.argv[2] || DEFAULT_URL;
  log(`Launcher iniciado. Abrindo URL: ${url}`);
  try {
    openUrl(url);
    log('URL aberta com sucesso.');
    process.exit(0);
  } catch (err) {
    log(`Falha ao abrir URL: ${err && err.message}`);
    process.exit(1);
  }
})();