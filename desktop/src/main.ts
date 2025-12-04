import { app, BrowserWindow } from 'electron'
import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'
import http from 'http'
import net from 'net'

let mainWindow: BrowserWindow | null = null
let apiProc: ReturnType<typeof spawn> | null = null
let erpProc: ReturnType<typeof spawn> | null = null
let writeLog: (msg: string) => void = (msg) => { try { console.log(msg) } catch {} }
let logFilePath: string | null = null

// Porta preferida da API local: usar sempre faixa alta pouco comum
// Mantemos 18081 como padrão em qualquer modo, com descoberta dinâmica se ocupado
const PREFERRED_API_PORT = 18081
// Porta preferida do ERP estático: usar sempre faixa alta pouco comum
const PREFERRED_ERP_PORT = 18080

// Resolve a versão do aplicativo para propagar ao client-local
function resolveAppVersion(): string {
  try {
    const v = app.getVersion()
    if (v && typeof v === 'string' && v.trim().length > 0) return v
  } catch {}
  const envV = process.env.APP_VERSION || process.env.VITE_APP_VERSION
  return envV && envV.trim().length > 0 ? envV : '1.0.0'
}
const APP_VERSION_VALUE = resolveAppVersion()

function getResourcePath(rel: string) {
  const base = app.isPackaged ? process.resourcesPath : path.resolve(__dirname, '..', '..')
  return path.join(base, rel)
}

function resolveErpRoot(): string | null {
  const candidates = [
    // Packaged ERP build shipped as extraResource
    path.join(process.resourcesPath || '', 'erp-dist'),
    path.join(process.resourcesPath || '', 'erp-dist', 'dist'),
    // Dev fallbacks
    path.join(path.resolve(__dirname, '..', '..'), 'dist'),
    path.join(path.resolve(__dirname, '..', '..'), 'site', 'dist')
  ]
  for (const p of candidates) {
    if (p && fs.existsSync(path.join(p, 'index.html'))) return p
  }
  writeLog('resolveErpRoot: nenhum caminho válido encontrado para ERP dist')
  return null
}

function resolveClientLocalMain(): string | null {
  const candidates = [
    path.join(process.resourcesPath || '', 'client-local', 'dist', 'main.js'),
    path.join(path.resolve(__dirname, '..', '..'), 'client-local', 'dist', 'main.js')
  ]
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p
  }
  writeLog('resolveClientLocalMain: não encontrado main.js do client-local')
  return null
}

function startApi() {
  const script = resolveClientLocalMain()
  if (!script) return
  const nodePathCandidates = [
    'C\\\\Program Files\\\\nodejs\\\\node.exe',
    'C:\\Program Files\\nodejs\\node.exe'
  ]
  let nodePath = nodePathCandidates.find(p => fs.existsSync(p)) || process.execPath
  const env = { 
    ...process.env, 
    PORT: String(PREFERRED_API_PORT), 
    CLIENT_HTTP_PORT: String(PREFERRED_API_PORT), 
    SKIP_MIGRATIONS: 'false',
    HUB_API_URL: process.env.HUB_API_URL || 'https://f-flow-suite.onrender.com',
    OFFLINE_MAX_DAYS: process.env.OFFLINE_MAX_DAYS || '30',
    APP_VERSION: APP_VERSION_VALUE,
    VITE_APP_VERSION: APP_VERSION_VALUE
  }
  apiProc = spawn(nodePath, [script, '--service', '--org', 'Local', '--port', String(PREFERRED_API_PORT)], {
    env,
    cwd: path.dirname(script),
    stdio: 'ignore',
    windowsHide: true
  })
}

function startErpServer() {
  const script = resolveClientLocalMain()
  const erpRoot = resolveErpRoot()
  if (!script || !erpRoot) return
  const nodePathCandidates = [
    'C\\\\Program Files\\\\nodejs\\\\node.exe',
    'C:\\Program Files\\nodejs\\node.exe'
  ]
  let nodePath = nodePathCandidates.find(p => fs.existsSync(p)) || process.execPath
  const env = {
    ...process.env,
    CLIENT_HTTP_PORT: process.env.CLIENT_HTTP_PORT || String(PREFERRED_API_PORT),
    HUB_API_URL: process.env.HUB_API_URL || 'https://f-flow-suite.onrender.com'
  }
  erpProc = spawn(nodePath, [script, '--erp-service', '--root', erpRoot, '--port', '8080'], {
    env,
    cwd: path.dirname(script),
    stdio: 'ignore',
    windowsHide: true
  })
}

function waitForHttpOk(url: string, timeoutMs = 20000, intervalMs = 500): Promise<boolean> {
  const start = Date.now()
  return new Promise((resolve) => {
    const tryOnce = () => {
      const req = http.get(url, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          res.resume()
          writeLog(`waitForHttpOk: OK ${url}`)
          resolve(true)
        } else {
          res.resume()
          if (Date.now() - start > timeoutMs) return resolve(false)
          setTimeout(tryOnce, intervalMs)
        }
      })
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) return resolve(false)
        setTimeout(tryOnce, intervalMs)
      })
    }
    writeLog(`waitForHttpOk: aguardando ${url} por até ${timeoutMs}ms`)
    tryOnce()
  })
}

function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const srv = net.createServer()
    srv.once('error', () => resolve(false))
    srv.once('listening', () => {
      srv.close(() => resolve(true))
    })
    srv.listen(port, '127.0.0.1')
  })
}

async function findFreePort(preferred: number, candidates: number[], exclude: number[] = []): Promise<number> {
  const all = [preferred, ...candidates]
  for (const p of all) {
    if (exclude.includes(p)) continue
    // eslint-disable-next-line no-await-in-loop
    const free = await isPortFree(p)
    if (free) return p
  }
  // fallback to OS-assigned ephemeral
  return new Promise((resolve) => {
    const srv = net.createServer()
    srv.listen(0, '127.0.0.1', () => {
      const address = srv.address()
      srv.close(() => resolve(typeof address === 'object' && address ? address.port : preferred))
    })
  })
}

/**
 * Descobre um par de portas livres (API, ERP).
 * Preferências: 18081/18080 em pacote; 8081/8080 em dev; com fallback.
 */
async function findFreePortPair(): Promise<{ api: number; erp: number }> {
  // Candidatos para API e ERP
  const apiCandidates = [18081, 18082, 18181, 28181, 38181]
  const erpCandidates = [18080, 18084, 18180, 28180, 38180]

  const api = await findFreePort(PREFERRED_API_PORT, apiCandidates)
  const erp = await findFreePort(PREFERRED_ERP_PORT, erpCandidates, [api])
  return { api, erp }
}

async function createWindow() {
  mainWindow = new BrowserWindow({ width: 1200, height: 800 })
  // Tela de carregamento enquanto serviços sobem
  mainWindow.loadURL(`data:text/html,<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}</style><div><h2>Iniciando...</h2><p>Aguardando API (${PREFERRED_API_PORT}) e ERP (8080)...</p></div>`)

  const apiReady = await waitForHttpOk(`http://127.0.0.1:${PREFERRED_API_PORT}/health`, 25000, 800)
  const erpReady = await waitForHttpOk('http://127.0.0.1:8080/erp', 25000, 800)

  if (apiReady && erpReady) {
    mainWindow.loadURL('http://127.0.0.1:8080/erp/login')
  } else {
    mainWindow.loadURL(`data:text/html,<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}</style><div><h2>Falha ao iniciar serviços</h2><p>Verifique se as portas 8080 (ERP) e ${PREFERRED_API_PORT} (API) estão livres.</p></div>`)
  }
}

function startApiDynamic(port: number) {
  const script = resolveClientLocalMain()
  if (!script) return
  const nodePathCandidates = [
    'C:\\Program Files\\nodejs\\node.exe',
    'C:\\Program Files (x86)\\nodejs\\node.exe'
  ]
  let nodePath = nodePathCandidates.find(p => fs.existsSync(p)) || process.execPath
  const env = { 
    ...process.env, 
    PORT: String(port), 
    CLIENT_HTTP_PORT: String(port), 
    SKIP_MIGRATIONS: 'false',
    HUB_API_URL: process.env.HUB_API_URL || 'https://f-flow-suite.onrender.com',
    OFFLINE_MAX_DAYS: process.env.OFFLINE_MAX_DAYS || '30',
    APP_VERSION: APP_VERSION_VALUE,
    VITE_APP_VERSION: APP_VERSION_VALUE
  }
  writeLog(`startApiDynamic: node=${nodePath} script=${script} port=${port}`)
  apiProc = spawn(nodePath, [script, '--service', '--org', 'Local', '--port', String(port)], {
    env,
    cwd: path.join(path.dirname(script), '..'),
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  })
  apiProc.on('error', (e) => writeLog(`API spawn error: ${e.message}`))
  apiProc.on('exit', (code) => writeLog(`API exited with code ${code}`))
  apiProc.stdout?.on('data', (d) => writeLog(`API> ${String(d).trim()}`))
  apiProc.stderr?.on('data', (d) => writeLog(`API! ${String(d).trim()}`))
}

function startErpServerDynamic(port: number) {
  const script = resolveClientLocalMain()
  const erpRoot = resolveErpRoot()
  if (!script || !erpRoot) return
  const nodePathCandidates = [
    'C:\\Program Files\\nodejs\\node.exe',
    'C:\\Program Files (x86)\\nodejs\\node.exe'
  ]
  let nodePath = nodePathCandidates.find(p => fs.existsSync(p)) || process.execPath
  const env = {
    ...process.env,
    HUB_API_URL: process.env.HUB_API_URL || 'https://f-flow-suite.onrender.com'
  }
  writeLog(`startErpServerDynamic: node=${nodePath} script=${script} root=${erpRoot} port=${port}`)
  erpProc = spawn(nodePath, [script, '--erp-service', '--root', erpRoot, '--port', String(port)], {
    env,
    cwd: path.join(path.dirname(script), '..'),
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  })
  erpProc.on('error', (e) => writeLog(`ERP spawn error: ${e.message}`))
  erpProc.on('exit', (code) => writeLog(`ERP exited with code ${code}`))
  erpProc.stdout?.on('data', (d) => writeLog(`ERP> ${String(d).trim()}`))
  erpProc.stderr?.on('data', (d) => writeLog(`ERP! ${String(d).trim()}`))
}

async function createWindowDynamic() {
  mainWindow = new BrowserWindow({ width: 1200, height: 800 })
  mainWindow.loadURL('data:text/html;charset=utf-8,<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}</style><div><h2>Iniciando...</h2><p>Detectando portas livres e iniciando serviços...</p></div>')

  // Detecta par de portas livres
  const { api: API_PORT, erp: ERP_PORT } = await findFreePortPair()
  writeLog(`createWindowDynamic: portas escolhidas API=${API_PORT} ERP=${ERP_PORT}`)

  // Inicia serviços com as portas escolhidas
  startApiDynamic(API_PORT)
  // Propaga CLIENT_HTTP_PORT também ao ERP para injeção de config
  try { process.env.CLIENT_HTTP_PORT = String(API_PORT) } catch {}
  startErpServerDynamic(ERP_PORT)

  // Aguarda disponibilidade
  const apiReady = await waitForHttpOk(`http://127.0.0.1:${API_PORT}/health`, 30000, 800)
  const erpReady = await waitForHttpOk(`http://127.0.0.1:${ERP_PORT}/erp`, 30000, 800)
  writeLog(`ready-check: api=${apiReady} erp=${erpReady}`)

  if (apiReady && erpReady) {
    const url = `http://127.0.0.1:${ERP_PORT}/erp/login`
    writeLog(`navigation: ${url}`)
    mainWindow.loadURL(url)
  } else {
    const msg = `Falha ao iniciar serviços (API=${API_PORT}, ERP=${ERP_PORT}). Verifique portas em uso. Logs: ${logFilePath || ''}`
    writeLog(msg)
    mainWindow.loadURL(`data:text/html;charset=utf-8,<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}</style><div><h2>Falha ao iniciar serviços</h2><p>${msg}</p></div>`)
  }
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
  app.on('ready', () => {
    app.setLoginItemSettings({ openAtLogin: true })
    try {
      const userData = app.getPath('userData')
      logFilePath = path.join(userData, 'startup.log')
      fs.appendFileSync(logFilePath, `\n--- app start ${new Date().toISOString()} ---\n`)
      writeLog = (msg: string) => {
        try { fs.appendFileSync(logFilePath!, `[${new Date().toISOString()}] ${msg}\n`) } catch {}
      }
      writeLog(`userData=${userData}`)
    } catch {}
    createWindowDynamic()
  })
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
  app.on('before-quit', () => {
    if (apiProc) {
      try { apiProc.kill() } catch {}
      apiProc = null
    }
    if (erpProc) {
      try { erpProc.kill() } catch {}
      erpProc = null
    }
  })
}
