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
  return $null
}

Require-Admin
$NSSM = Resolve-Nssm -PathHint $NssmPath

Write-Host "Parando e removendo serviços..." -ForegroundColor Cyan

# Parar o app de monitor da bandeja se estiver rodando
Get-Process -Name ServiceTrayMonitor -ErrorAction SilentlyContinue | Stop-Process -Force

# Finalizar processos node relacionados (client-local/ERP) para evitar reativação por wrappers
try {
  $procs = Get-CimInstance Win32_Process | Where-Object {
    ($_.Name -eq 'node.exe') -and (
      ($_.CommandLine -match 'client-local\\dist\\main.js') -or
      ($_.CommandLine -match 'client-local\\main.js') -or
      ($_.CommandLine -match '--erp-service')
    )
  }
  foreach ($p in $procs) {
    try { Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue } catch {}
  }
} catch {}

# Também tentar encerrar processos pelos PIDs dos serviços, se estiverem rodando
function Stop-ServiceProcessByName {
  param([string]$Name)
  try {
    $svc = Get-CimInstance Win32_Service -Filter "Name='$Name'" -ErrorAction SilentlyContinue
    if ($svc -and $svc.ProcessId -gt 0) {
      try { Stop-Process -Id $svc.ProcessId -Force -ErrorAction SilentlyContinue } catch {}
    }
  } catch {}
}
Stop-ServiceProcessByName -Name $ServiceNameApi
Stop-ServiceProcessByName -Name $ServiceNameErp

function Remove-ServiceSafe {
  param([string]$Name)
  Write-Host "Removendo serviço: $Name" -ForegroundColor Yellow
  # Tenta via NSSM, se disponível
  if ($NSSM) {
    try { & $NSSM stop $Name } catch {}
    try { & $NSSM remove $Name confirm } catch {}
  }
  # Tenta via SC (funciona para serviços registrados por WinSW ou outros)
  try { sc.exe stop $Name | Out-Null } catch {}
  Start-Sleep -Milliseconds 500
  try { sc.exe delete $Name | Out-Null } catch {}
}

# Primeiro, tentar desinstalar wrappers WinSW diretamente se presentes
$ProgramDataRoot = Join-Path $env:ProgramData "FFlow"
$ServiceRoot = Join-Path $ProgramDataRoot "service"
foreach ($svc in @($ServiceNameErp, $ServiceNameApi)) {
  $svcExe = Join-Path $ServiceRoot ("$svc.exe")
  if (Test-Path $svcExe) {
    Write-Host "Parando/uninstall via WinSW: $svcExe" -ForegroundColor Yellow
    try { Start-Process -FilePath $svcExe -ArgumentList 'stop' -NoNewWindow -Wait -ErrorAction SilentlyContinue } catch {}
    Start-Sleep -Milliseconds 300
    try { Start-Process -FilePath $svcExe -ArgumentList 'uninstall' -NoNewWindow -Wait -ErrorAction SilentlyContinue } catch {}
  }
}

# Em seguida, remover serviços via NSSM/SC
foreach ($svc in @($ServiceNameErp, $ServiceNameApi)) {
  Remove-ServiceSafe -Name $svc
}

# Limpeza de artefatos do WinSW (se usados como fallback)
if (Test-Path $ServiceRoot) {
  Write-Host "Limpando configuração do WinSW em: $ServiceRoot" -ForegroundColor Yellow
  try { Remove-Item -Path $ServiceRoot -Recurse -Force -ErrorAction SilentlyContinue } catch {}
}

function Invoke-WinSWUninstallIfPresent {
  param([string]$ServiceName)
  try {
    $svcInfo = sc.exe qc $ServiceName 2>$null | Out-String
    $binPath = $null
    if ($svcInfo -match 'NOME_DO_CAMINHO BINÁRIO\s*:\s*"([^"]+)"') { $binPath = $Matches[1] }
    elseif ($svcInfo -match 'NOME_DO CAMINHO BINÁRIO\s*:\s*"([^"]+)"') { $binPath = $Matches[1] }
    elseif ($svcInfo -match 'NOME_DO_CAMINHO_BINÁRIO\s*:\s*"([^"]+)"') { $binPath = $Matches[1] }
    elseif ($svcInfo -match 'BINARY_PATH_NAME\s*:\s*"([^"]+)"') { $binPath = $Matches[1] }

    if ($binPath) {
      # Detecta wrapper WinSW pelo caminho em ProgramData
      if ($binPath -like (Join-Path $env:ProgramData 'FFlow\service\*')) {
        if (Test-Path $binPath) {
          Write-Host "Detectado WinSW para '$ServiceName'. Executando stop/uninstall no wrapper." -ForegroundColor Yellow
          try { Start-Process -FilePath $binPath -ArgumentList 'stop' -NoNewWindow -Wait -ErrorAction SilentlyContinue } catch {}
          Start-Sleep -Milliseconds 500
          try { Start-Process -FilePath $binPath -ArgumentList 'uninstall' -NoNewWindow -Wait -ErrorAction SilentlyContinue } catch {}
        }
      }
    }
  } catch {}
}

# Se os serviços ainda existirem, tenta desinstalar via WinSW wrapper explicitamente
foreach ($svc in @($ServiceNameErp, $ServiceNameApi)) {
  Invoke-WinSWUninstallIfPresent -ServiceName $svc
  # Verifica novamente e força remoção
  Remove-ServiceSafe -Name $svc
}

Write-Host "Serviços removidos e wrappers WinSW desinstalados (se presentes)." -ForegroundColor Green