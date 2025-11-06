param(
  [string]$InstallRoot = "C:\Program Files\F-Flow Suite",
  [string]$NodePath = "C:\Program Files\nodejs\node.exe",
  [string]$ServiceNameApi = "F-Flow-Client-Local",
  [string]$ServiceNameErp = "F-Flow-ERP-Static",
  [string]$NssmPath = ""
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
  Write-Error "nssm.exe não encontrado. Coloque 'nssm.exe' em '$local' ou instale-o em '$global'."
}

function Install-Service-WithNssm {
  param(
    [string]$SvcName,
    [string]$DisplayName,
    [string]$Exe,
    [string]$Args,
    [string]$WorkDir
  )
  Write-Host "Instalando serviço '$SvcName'..." -ForegroundColor Cyan
  & $script:NSSM install $SvcName $Exe $Args
  & $script:NSSM set $SvcName DisplayName $DisplayName
  & $script:NSSM set $SvcName AppDirectory $WorkDir
  & $script:NSSM set $SvcName Start SERVICE_AUTO_START
  & $script:NSSM set $SvcName AppStopMethodConsole 2000
  & $script:NSSM set $SvcName AppThrottle 5000
  & $script:NSSM set $SvcName AppStdout "C:\ProgramData\FFlow\logs\$SvcName.out.log"
  & $script:NSSM set $SvcName AppStderr "C:\ProgramData\FFlow\logs\$SvcName.err.log"
  & $script:NSSM start $SvcName
}

Require-Admin

# Validar Node
if (-not (Test-Path $NodePath)) {
  $NodePath = "C:\Program Files (x86)\nodejs\node.exe"
}
if (-not (Test-Path $NodePath)) {
  Write-Error "Node.exe não encontrado. Instale o Node.js 18+ antes de continuar."
}

# Resolver NSSM
$script:NSSM = Resolve-Nssm -PathHint $NssmPath

# Criar diretórios de logs
New-Item -ItemType Directory -Force -Path "C:\ProgramData\FFlow\logs" | Out-Null

# Caminhos da aplicação
$ApiScript = Join-Path $InstallRoot "client-local\main.js"
$ErpRoot = Join-Path $InstallRoot "erp\dist"

if (-not (Test-Path $ApiScript)) { Write-Error "Script da API não encontrado: $ApiScript" }
if (-not (Test-Path $ErpRoot)) { Write-Error "Build do ERP não encontrado: $ErpRoot" }

# Instalar serviço da API local (8081)
$apiArgs = "`"$ApiScript`" --service"
Install-Service-WithNssm -SvcName $ServiceNameApi -DisplayName "F-Flow Client Local" -Exe $NodePath -Args $apiArgs -WorkDir (Split-Path $ApiScript -Parent)

# Instalar serviço do ERP estático (8080)
$erpArgs = "`"$ApiScript`" --erp-service --root `"$ErpRoot`" --port 8080"
Install-Service-WithNssm -SvcName $ServiceNameErp -DisplayName "F-Flow ERP Local" -Exe $NodePath -Args $erpArgs -WorkDir (Split-Path $ApiScript -Parent)

Write-Host "Serviços instalados e iniciados:" -ForegroundColor Green
Write-Host " - $ServiceNameApi (API local em 8081)" -ForegroundColor Green
Write-Host " - $ServiceNameErp (ERP estático em 8080)" -ForegroundColor Green