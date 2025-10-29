param(
  [string]$ErpRoot = "C:\Program Files\F-Flow\ClientLocal\erp\dist",
  [int]$ErpPort = 8080,
  [int]$ClientPort = 8081
)

$ErrorActionPreference = 'Continue'

$logsRoot = "C:\ProgramData\FFlow\logs"
$launcherLogs = Join-Path $logsRoot "launcher"
New-Item -ItemType Directory -Force -Path $launcherLogs | Out-Null

function Log($msg) {
  $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  $line = "[$ts] $msg"
  Write-Host $line
  Add-Content -Path (Join-Path $launcherLogs "start-both.log") -Value $line
}

$erpExe = "C:\Program Files\F-Flow\ClientLocal\installers\windows\erp-server.exe"
$erpArgs = @('--root', $ErpRoot, '--port', $ErpPort)
$clientExe = "C:\Program Files\F-Flow\ClientLocal\f-flow-client.exe"
$clientArgs = @('--service')

Log "Starting ERP: $erpExe --root '$ErpRoot' --port $ErpPort"
$erpProc = Start-Process -FilePath $erpExe -ArgumentList $erpArgs -PassThru -WorkingDirectory (Split-Path $erpExe -Parent)

Start-Sleep -Seconds 1

Log "Starting Client Local: $clientExe --service (port $ClientPort)"
try {
  $clientProc = Start-Process -FilePath $clientExe -ArgumentList $clientArgs -PassThru -WorkingDirectory (Split-Path $clientExe -Parent)
  Log "Client Local started. PID=$($clientProc.Id)"
} catch {
  Log "Failed to start Client Local: $($_.Exception.Message)"
}

Log "ERP started. PID=$($erpProc.Id). Waiting ERP to exit..."
try {
  Wait-Process -Id $erpProc.Id
} catch {
  Log "ERP process wait failed: $($_.Exception.Message)"
}

Log "Launcher exiting because ERP exited."