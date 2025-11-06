param(
  [string]$ServiceNameApi = "F-Flow-Client-Local",
  [string]$ServiceNameErp = "F-Flow-ERP-Static",
  [string]$NssmPath = ""
)

$ErrorActionPreference = 'Continue'

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

Require-Admin
$NSSM = Resolve-Nssm -PathHint $NssmPath

Write-Host "Parando e removendo serviços..." -ForegroundColor Cyan

foreach ($svc in @($ServiceNameErp, $ServiceNameApi)) {
  try { & $NSSM stop $svc } catch {}
  try { & $NSSM remove $svc confirm } catch {}
  Write-Host "Removido: $svc" -ForegroundColor Green
}

Write-Host "Serviços removidos. Agora você pode desinstalar o MSI com segurança." -ForegroundColor Green