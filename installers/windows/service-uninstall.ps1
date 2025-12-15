param(
  [string]$ServiceNameApi = "F-Flow-Client-Local",
  [string]$ServiceNameErp = "F-Flow-ERP-Static",
  [string]$NssmPath = "",
  [string]$LogPath = ""
)

$ErrorActionPreference = 'Continue'

# ==== Logging setup ====
function Initialize-Logging {
  param([string]$Path)
  if ([string]::IsNullOrWhiteSpace($Path)) {
    $logDir = Join-Path $env:ProgramData "FFlow\logs\installer"
    try { New-Item -ItemType Directory -Force -Path $logDir | Out-Null } catch {}
    $ts = Get-Date -Format "yyyyMMdd-HHmmss"
    $script:LogFile = Join-Path $logDir ("uninstall-$ts.log")
  } else {
    $dir = Split-Path $Path -Parent
    if (-not [string]::IsNullOrWhiteSpace($dir)) { try { New-Item -ItemType Directory -Force -Path $dir | Out-Null } catch {} }
    $script:LogFile = $Path
  }
}
function Write-Log {
  param([string]$Message, [string]$Level = 'INFO')
  $line = "[{0}] [{1}] {2}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Level, $Message
  try { Add-Content -Path $script:LogFile -Value $line -Encoding UTF8 } catch {}
  $fg = 'Gray'
  if ($Level -eq 'INFO') { $fg = 'Cyan' } elseif ($Level -eq 'WARN') { $fg = 'Yellow' } elseif ($Level -eq 'ERROR') { $fg = 'Red' }
  Write-Host $line -ForegroundColor $fg
}
Initialize-Logging -Path $LogPath

function Require-Admin {
  if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Log "Este script deve ser executado como Administrador!" 'ERROR'
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

Write-Log ("NSSM resolvido: {0}" -f ($NSSM ?? 'não encontrado'))
Write-Log "Parando e removendo serviços..."

# Normalizar possíveis variações de nomes de serviço (ex.: com espaços ou diferentes capitalizações)
$ApiNameVariants = @(
  $ServiceNameApi,
  'F-Flow Client Local',
  'f-flow-client-local',
  'F-Flow-Client-Local Service'
)
$ErpNameVariants = @(
  $ServiceNameErp,
  'F-Flow ERP Local',
  'f-flow-erp-static',
  'F-Flow-ERP-Local'
)

function Get-ServiceNamesToRemove {
  $names = New-Object System.Collections.Generic.HashSet[string]
  foreach ($n in ($ApiNameVariants + $ErpNameVariants)) { if ($n -and -not [string]::IsNullOrWhiteSpace($n)) { $null = $names.Add($n) } }
  # Detectar por DisplayName também
  try {
    $svcApiByDisplay = Get-CimInstance Win32_Service -Filter "DisplayName='F-Flow Client Local'" -ErrorAction SilentlyContinue
    if ($svcApiByDisplay) { $null = $names.Add($svcApiByDisplay.Name) }
  } catch {}
  try {
    $svcErpByDisplay = Get-CimInstance Win32_Service -Filter "DisplayName='F-Flow ERP Local'" -ErrorAction SilentlyContinue
    if ($svcErpByDisplay) { $null = $names.Add($svcErpByDisplay.Name) }
  } catch {}
  return [string[]]$names
}
${ServicesToRemove} = Get-ServiceNamesToRemove
Write-Log ("Serviços alvo: " + ([string]::Join(', ', ${ServicesToRemove})))

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
    Write-Log ("Encerrando processo node PID={0} CmdLine={1}" -f $p.ProcessId, $p.CommandLine)
    try { Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue } catch { Write-Log ("Falha ao encerrar PID=$($p.ProcessId): $($_.Exception.Message)") 'WARN' }
  }
} catch {}

# Também tentar encerrar processos pelos PIDs dos serviços, se estiverem rodando
function Stop-ServiceProcessByName {
  param([string]$Name)
  try {
    $svc = Get-CimInstance Win32_Service -Filter "Name='$Name'" -ErrorAction SilentlyContinue
    if ($svc -and $svc.ProcessId -gt 0) {
      Write-Log ("Encerrando processo vinculado ao serviço {0} PID={1}" -f $Name, $svc.ProcessId)
      try { Stop-Process -Id $svc.ProcessId -Force -ErrorAction SilentlyContinue } catch { Write-Log ("Falha ao encerrar PID=$($svc.ProcessId) de {0}: $($_.Exception.Message)" -f $Name) 'WARN' }
    }
  } catch {}
}
foreach ($svcName in ${ServicesToRemove}) { Stop-ServiceProcessByName -Name $svcName }

function Remove-ServiceSafe {
  param([string]$Name)
  Write-Log "Removendo serviço: $Name"
  # Tenta via NSSM, se disponível
  if ($NSSM) {
    Write-Log "NSSM stop $Name"
    try { & $NSSM stop $Name } catch { Write-Log ("NSSM stop falhou para $Name: $($_.Exception.Message)") 'WARN' }
    Write-Log "NSSM remove $Name"
    try { & $NSSM remove $Name confirm } catch { Write-Log ("NSSM remove falhou para $Name: $($_.Exception.Message)") 'WARN' }
  }
  # Tenta via SC (funciona para serviços registrados por WinSW ou outros)
  Write-Log "sc stop $Name"
  try { sc.exe stop $Name | Out-Null } catch { Write-Log ("sc stop falhou para $Name: $($_.Exception.Message)") 'WARN' }
  Start-Sleep -Milliseconds 500
  Write-Log "sc delete $Name"
  try { sc.exe delete $Name | Out-Null } catch { Write-Log ("sc delete falhou para $Name: $($_.Exception.Message)") 'WARN' }
}

# Primeiro, tentar desinstalar wrappers WinSW diretamente se presentes
$ProgramDataRoot = Join-Path $env:ProgramData "FFlow"
$ServiceRoot = Join-Path $ProgramDataRoot "service"
foreach ($svc in ${ServicesToRemove}) {
  $svcExe = Join-Path $ServiceRoot ("$svc.exe")
  if (Test-Path $svcExe) {
    Write-Log "WinSW wrapper detectado: $svcExe"
    try { Start-Process -FilePath $svcExe -ArgumentList 'stop' -NoNewWindow -Wait -ErrorAction SilentlyContinue } catch { Write-Log ("WinSW stop falhou: $($_.Exception.Message)") 'WARN' }
    Start-Sleep -Milliseconds 300
    try { Start-Process -FilePath $svcExe -ArgumentList 'uninstall' -NoNewWindow -Wait -ErrorAction SilentlyContinue } catch { Write-Log ("WinSW uninstall falhou: $($_.Exception.Message)") 'WARN' }
  } else {
    Write-Log "Wrapper WinSW não encontrado: $svcExe"
  }
}

# Em seguida, remover serviços via NSSM/SC
foreach ($svc in ${ServicesToRemove}) { Remove-ServiceSafe -Name $svc }

# Limpeza de artefatos do WinSW (se usados como fallback)
if (Test-Path $ServiceRoot) {
  Write-Log "Limpando configuração do WinSW em: $ServiceRoot"
  try { Remove-Item -Path $ServiceRoot -Recurse -Force -ErrorAction SilentlyContinue } catch { Write-Log ("Falha ao limpar configuração WinSW: $($_.Exception.Message)") 'WARN' }
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
          Write-Log "Detectado WinSW para '$ServiceName'. Executando stop/uninstall no wrapper."
          try { Start-Process -FilePath $binPath -ArgumentList 'stop' -NoNewWindow -Wait -ErrorAction SilentlyContinue } catch {}
          Start-Sleep -Milliseconds 500
          try { Start-Process -FilePath $binPath -ArgumentList 'uninstall' -NoNewWindow -Wait -ErrorAction SilentlyContinue } catch {}
        }
      }
    }
  } catch {}
}

# Se os serviços ainda existirem, tenta desinstalar via WinSW wrapper explicitamente
foreach ($svc in ${ServicesToRemove}) {
  Invoke-WinSWUninstallIfPresent -ServiceName $svc
  # Verifica novamente e força remoção
  Remove-ServiceSafe -Name $svc
}

Write-Log "Serviços removidos e wrappers WinSW desinstalados (se presentes)."