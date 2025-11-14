param(
  [string]$InstallRoot = "C:\Program Files\F-Flow Suite",
  [string]$NodePath = "C:\Program Files\nodejs\node.exe",
  [string]$ServiceNameApi = "F-Flow-Client-Local",
  [string]$ServiceNameErp = "F-Flow-ERP-Static",
  [string]$NssmPath = "",
  [string]$AppVersion = ""
)

$ErrorActionPreference = 'Stop'

function Require-Admin {
  if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "Este script deve ser executado como Administrador!"
  }
}

function Resolve-Nssm {
  param([string]$PathHint)
  if (-not [string]::IsNullOrWhiteSpace($PathHint) -and (Test-Path $PathHint)) { return (Resolve-Path $PathHint).Path }
  $local = Join-Path $PSScriptRoot "nssm\nssm.exe"
  if (Test-Path $local) { return (Resolve-Path $local).Path }
  $global = "C:\Program Files\nssm\nssm.exe"
  if (Test-Path $global) { return (Resolve-Path $global).Path }
  return $null
}

function Install-Service-WithNssm {
  param(
    [string]$SvcName,
    [string]$DisplayName,
    [string]$Exe,
    [string]$Args,
    [string]$WorkDir
  )
  # Detectar se serviço já existe
  $existing = Get-Service -Name $SvcName -ErrorAction SilentlyContinue
  if ($existing) {
    Write-Host "Atualizando serviço existente '$SvcName'..." -ForegroundColor Yellow
    try { Stop-Service -Name $SvcName -ErrorAction SilentlyContinue } catch {}
    # Atualizar binário/argumentos/diretório
    & $script:NSSM set $SvcName Application $Exe
    & $script:NSSM set $SvcName AppParameters $Args
    & $script:NSSM set $SvcName AppDirectory $WorkDir
    & $script:NSSM set $SvcName DisplayName $DisplayName
    & $script:NSSM set $SvcName Start SERVICE_AUTO_START
    & $script:NSSM set $SvcName AppStopMethodConsole 2000
    & $script:NSSM set $SvcName AppThrottle 5000
    & $script:NSSM set $SvcName AppStdout "C:\ProgramData\FFlow\logs\$SvcName.out.log"
    & $script:NSSM set $SvcName AppStderr "C:\ProgramData\FFlow\logs\$SvcName.err.log"
    # Atualizar variáveis de ambiente (sempre garantir PORT e SKIP_MIGRATIONS)
    $envExtra = "PORT=8081;CLIENT_HTTP_PORT=8081;SKIP_MIGRATIONS=true"
    if (-not [string]::IsNullOrWhiteSpace($AppVersion)) { $envExtra = "APP_VERSION=$AppVersion;VITE_APP_VERSION=$AppVersion;" + $envExtra }
    & $script:NSSM set $SvcName AppEnvironmentExtra $envExtra
    & $script:NSSM restart $SvcName
  } else {
    Write-Host "Instalando serviço '$SvcName'..." -ForegroundColor Cyan
    & $script:NSSM install $SvcName $Exe $Args
    & $script:NSSM set $SvcName DisplayName $DisplayName
    & $script:NSSM set $SvcName AppDirectory $WorkDir
    & $script:NSSM set $SvcName Start SERVICE_AUTO_START
    & $script:NSSM set $SvcName AppStopMethodConsole 2000
    & $script:NSSM set $SvcName AppThrottle 5000
    & $script:NSSM set $SvcName AppStdout "C:\ProgramData\FFlow\logs\$SvcName.out.log"
    & $script:NSSM set $SvcName AppStderr "C:\ProgramData\FFlow\logs\$SvcName.err.log"
    if (-not [string]::IsNullOrWhiteSpace($AppVersion)) {
      # Injeta variáveis de ambiente para propagação da versão ao serviço
      & $script:NSSM set $SvcName AppEnvironmentExtra "APP_VERSION=$AppVersion;VITE_APP_VERSION=$AppVersion;PORT=8081;CLIENT_HTTP_PORT=8081;SKIP_MIGRATIONS=true"
    } else {
      & $script:NSSM set $SvcName AppEnvironmentExtra "PORT=8081;CLIENT_HTTP_PORT=8081;SKIP_MIGRATIONS=true"
    }
    & $script:NSSM start $SvcName
  }
}

function Ensure-WinSW {
  $winswDir = Join-Path $PSScriptRoot "winsw"
  New-Item -ItemType Directory -Force -Path $winswDir | Out-Null
  $WinSwExe = Join-Path $winswDir "WinSW-x64.exe"
  if (Test-Path $WinSwExe) { return $WinSwExe }
  Write-Host "Baixando WinSW-x64.exe..." -ForegroundColor Cyan
  $url = "https://github.com/winsw/winsw/releases/download/v2.12.0/WinSW-x64.exe"
  Invoke-WebRequest -Uri $url -OutFile $WinSwExe -UseBasicParsing
  return $WinSwExe
}

# Garante que nenhum processo esteja segurando o arquivo especificado
function Ensure-FileUnlocked {
  param([string]$FilePath)
  for ($i = 0; $i -lt 20; $i++) {
    $procs = Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $FilePath }
    if (-not $procs) { return }
    foreach ($p in $procs) { try { Stop-Process -Id $p.Id -Force } catch {} }
    Start-Sleep -Milliseconds 250
  }
}

Require-Admin

# Validar Node
if (-not (Test-Path $NodePath)) {
  $NodePath = "C:\Program Files (x86)\nodejs\node.exe"
}
if (-not (Test-Path $NodePath)) {
  throw "Node.exe não encontrado. Instale o Node.js 18+ antes de continuar."
}

# Criar diretórios de logs
New-Item -ItemType Directory -Force -Path "C:\ProgramData\FFlow\logs" | Out-Null

# Resolver diretório do repositório para NODE_PATH e fallback do script
# Em PowerShell, não é permitido usar '-Parent' duas vezes; faça aninhado.
$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$RepoClient = Join-Path $RepoRoot "client-local"
$RepoNodeModules = Join-Path $RepoClient "node_modules"

# Caminhos da aplicação
# Determinar o script da API (preferir InstallRoot; fallback para repositório)
    $ApiScriptCandidate1Dist = Join-Path $InstallRoot "client-local\dist\main.js"
    $ApiScriptCandidate1Flat = Join-Path $InstallRoot "client-local\main.js"
$ApiScriptCandidate2 = Join-Path $RepoClient "dist\main.js"

    if (Test-Path $ApiScriptCandidate1Dist) {
      $ApiScript = $ApiScriptCandidate1Dist
    } elseif (Test-Path $ApiScriptCandidate1Flat) {
      $ApiScript = $ApiScriptCandidate1Flat
    } elseif (Test-Path $ApiScriptCandidate2) {
      $ApiScript = $ApiScriptCandidate2
    } else {
      throw "Script da API não encontrado em '$ApiScriptCandidate1Dist', '$ApiScriptCandidate1Flat' ou '$ApiScriptCandidate2'"
    }

# Detectar raiz válida do ERP: alguns builds geram 'dist\\dist\\index.html'
$ErpRootCandidate1 = Join-Path $InstallRoot "erp\dist"
$ErpRootCandidate2 = Join-Path $InstallRoot "erp\dist\dist"
if (Test-Path (Join-Path $ErpRootCandidate1 'index.html')) {
  $ErpRoot = $ErpRootCandidate1
} elseif (Test-Path (Join-Path $ErpRootCandidate2 'index.html')) {
  $ErpRoot = $ErpRootCandidate2
} else {
  $ErpRoot = $ErpRootCandidate1
}

if (-not (Test-Path $ApiScript)) { throw "Script da API não encontrado: $ApiScript" }
# Validar que exista um index.html na raiz detectada do ERP
if (-not (Test-Path (Join-Path $ErpRoot 'index.html'))) { throw "Build do ERP não encontrado (index.html ausente): $ErpRoot" }

# Pré-gerar Prisma Client no repositório client-local para evitar geração no startup
try {
  Write-Host "Gerando Prisma Client em: $RepoClient" -ForegroundColor Cyan
  Push-Location $RepoClient
  # Use o script npm se existir, senão chame npx diretamente
  if (Test-Path (Join-Path $RepoClient 'package.json')) {
    try { npm run prisma:generate } catch { npx prisma generate }
  } else {
    npx prisma generate
  }
} catch {
  Write-Warning "Falha ao gerar Prisma Client (o serviço pode tentar gerar no startup): $($_.Exception.Message)"
} finally {
  Pop-Location
}

# Criar .env com a versão (ConfigModule padrão lê '.env'; manter compatível criando também '.env.production')
try {
  $dir = (Split-Path $ApiScript -Parent)
  $envFile = Join-Path $dir ".env"
  $envProdFile = Join-Path $dir ".env.production"
  if (-not [string]::IsNullOrWhiteSpace($AppVersion)) {
    "APP_VERSION=$AppVersion`nVITE_APP_VERSION=$AppVersion" | Set-Content -Path $envFile -Encoding UTF8
    "APP_VERSION=$AppVersion`nVITE_APP_VERSION=$AppVersion" | Set-Content -Path $envProdFile -Encoding UTF8
  } else {
    # Fallback: se não vier AppVersion, não criar ou criar vazio para evitar sobrescrever configs do usuário
    if (-not (Test-Path $envFile)) { "# APP_VERSION não definido pelo instalador" | Set-Content -Path $envFile -Encoding UTF8 }
    if (-not (Test-Path $envProdFile)) { "# APP_VERSION não definido pelo instalador" | Set-Content -Path $envProdFile -Encoding UTF8 }
  }
} catch { Write-Warning "Falha ao gravar .env: $($_.Exception.Message)" }

# Tentar NSSM; se não houver, usar WinSW embutido
$script:NSSM = Resolve-Nssm -PathHint $NssmPath
if ($script:NSSM) {
  # Instalar serviço da API local (8081)
  $apiArgs = "`"$ApiScript`" --service --org `"Local`" --port 8081"
  Install-Service-WithNssm -SvcName $ServiceNameApi -DisplayName "F-Flow Client Local" -Exe $NodePath -Args $apiArgs -WorkDir (Split-Path $ApiScript -Parent)

  # Instalar serviço do ERP estático (8080)
  $erpArgs = "`"$ApiScript`" --erp-service --root `"$ErpRoot`" --port 8080"
  Install-Service-WithNssm -SvcName $ServiceNameErp -DisplayName "F-Flow ERP Local" -Exe $NodePath -Args $erpArgs -WorkDir (Split-Path $ApiScript -Parent)
} else {
  # Fallback WinSW
  $ProgramDataRoot = Join-Path $env:ProgramData "FFlow"
  $ServiceRoot = Join-Path $ProgramDataRoot "service"
  New-Item -ItemType Directory -Path $ServiceRoot -Force | Out-Null

  $WinSwExe = Ensure-WinSW
  # Copiar WinSW para o diretório do serviço com o mesmo nome-base do XML (compatível com CLI v2)
  $ApiExe = Join-Path $ServiceRoot ("$ServiceNameApi.exe")
  $ErpExe = Join-Path $ServiceRoot ("$ServiceNameErp.exe")
  # Se já existir, parar e desinstalar serviços antes de sobrescrever o executável
  try { Stop-Service -Name $ServiceNameApi -ErrorAction SilentlyContinue } catch {}
  try { Stop-Service -Name $ServiceNameErp -ErrorAction SilentlyContinue } catch {}
  if (Test-Path $ApiExe) {
    try { & $ApiExe stop } catch {}
    try { & $ApiExe uninstall } catch {}
    Ensure-FileUnlocked -FilePath $ApiExe
  }
  if (Test-Path $ErpExe) {
    try { & $ErpExe stop } catch {}
    try { & $ErpExe uninstall } catch {}
    Ensure-FileUnlocked -FilePath $ErpExe
  }
  Start-Sleep -Milliseconds 500
  Copy-Item -Path $WinSwExe -Destination $ApiExe -Force
  Copy-Item -Path $WinSwExe -Destination $ErpExe -Force

  # API Service
  $ApiXml = Join-Path $ServiceRoot "$ServiceNameApi.xml"
  @"
<service>
  <id>$ServiceNameApi</id>
  <name>F-Flow Client Local Service</name>
  <description>F-Flow Suite Client Local Server</description>
  <executable>$NodePath</executable>
  <arguments>`"$ApiScript`" --service --org `"Local`" --port 8081</arguments>
  <workingdirectory>$(Split-Path $ApiScript -Parent)</workingdirectory>
  <logpath>C:\ProgramData\FFlow\logs\client-local</logpath>
  $(if (-not [string]::IsNullOrWhiteSpace($AppVersion)) { "<env name=`"APP_VERSION`" value=`"$AppVersion`" />`n  <env name=`"VITE_APP_VERSION`" value=`"$AppVersion`" />" } )
  <env name="PORT" value="8081" />
  <env name="CLIENT_HTTP_PORT" value="8081" />
  <env name="SKIP_MIGRATIONS" value="true" />
  <env name="NODE_PATH" value="$RepoNodeModules" />
  <startmode>Automatic</startmode>
  <stoptimeout>15000</stoptimeout>
  <resetfailure>86400</resetfailure>
  <onfailure action="restart" delay="10 sec" />
</service>
"@ | Set-Content -Path $ApiXml -Encoding UTF8

  # ERP Service
  $ErpXml = Join-Path $ServiceRoot "$ServiceNameErp.xml"
  @"
<service>
  <id>$ServiceNameErp</id>
  <name>F-Flow ERP Local Service</name>
  <description>Serves local ERP build with static server</description>
  <executable>$NodePath</executable>
  <arguments>`"$ApiScript`" --erp-service --root `"$ErpRoot`" --port 8080</arguments>
  <workingdirectory>$(Split-Path $ApiScript -Parent)</workingdirectory>
  <logpath>C:\ProgramData\FFlow\logs\erp</logpath>
  $(if (-not [string]::IsNullOrWhiteSpace($AppVersion)) { "<env name=`"APP_VERSION`" value=`"$AppVersion`" />`n  <env name=`"VITE_APP_VERSION`" value=`"$AppVersion`" />" } )
  <env name="NODE_PATH" value="$RepoNodeModules" />
  <startmode>Automatic</startmode>
  <stoptimeout>15000</stoptimeout>
  <resetfailure>86400</resetfailure>
  <onfailure action="restart" delay="10 sec" />
</service>
"@ | Set-Content -Path $ErpXml -Encoding UTF8

  & $ApiExe uninstall 2>$null
  & $ApiExe install
  & $ApiExe start

  & $ErpExe uninstall 2>$null
  & $ErpExe install
  & $ErpExe start
}

Write-Host "Serviços instalados e iniciados:" -ForegroundColor Green
Write-Host " - $ServiceNameApi (API local em 8081)" -ForegroundColor Green
Write-Host " - $ServiceNameErp (ERP estático em 8080)" -ForegroundColor Green