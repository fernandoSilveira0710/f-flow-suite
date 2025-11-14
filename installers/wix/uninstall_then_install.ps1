param([switch]$RunInstaller = $true)

$ErrorActionPreference = 'Continue'

Write-Host 'Parando Tray Monitor...' -ForegroundColor Cyan
Get-Process -Name ServiceTrayMonitor -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host 'Parando e removendo serviços...' -ForegroundColor Cyan
$svcs = @('F-Flow-Client-Local','F-Flow-ERP-Static')
foreach ($s in $svcs) {
  try { sc.exe stop $s | Out-Null } catch {}
  try { sc.exe delete $s | Out-Null } catch {}
  Write-Host "Removido serviço: $s" -ForegroundColor Green
}

Write-Host 'Desinstalando F-Flow Suite (MSI)...' -ForegroundColor Cyan
$apps = Get-ItemProperty 'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*','HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*' |
  Where-Object { $_.DisplayName -like 'F-Flow Suite*' }

if ($apps) {
  foreach ($app in $apps) {
    $uninst = $app.UninstallString
    $guid = $null
    if ($uninst -match '{[0-9A-Fa-f-]+}') { $guid = $matches[0] }
    if ($guid) {
      Write-Host "msiexec /x $guid" -ForegroundColor Yellow
      Start-Process msiexec.exe -ArgumentList "/x $guid /qb-!" -Wait
    } elseif ($uninst) {
      Write-Host "Executando UninstallString: $uninst" -ForegroundColor Yellow
      Start-Process -FilePath 'cmd.exe' -ArgumentList "/c $uninst" -Wait
    } else {
      Write-Warning "Não foi possível determinar UninstallString para '$($app.DisplayName)'."
    }
  }
} else {
  Write-Host 'Entrada de desinstalação não encontrada; limpeza manual seguirá.' -ForegroundColor Yellow
}

Write-Host 'Limpando diretórios e registro...' -ForegroundColor Cyan
$instDir = 'C:\Program Files\F-Flow Suite'
if (Test-Path $instDir) { Remove-Item $instDir -Recurse -Force -ErrorAction SilentlyContinue }
Remove-Item -Path 'HKLM:\Software\F-Flow' -Recurse -Force -ErrorAction SilentlyContinue

Write-Host 'Concluído.' -ForegroundColor Green

if ($RunInstaller) {
  $exePath = Join-Path $PSScriptRoot '..\wix\out-wpf\2F Solutions.exe'
  if (Test-Path $exePath) {
    Write-Host "Abrindo instalador: $exePath" -ForegroundColor Cyan
    Start-Process -FilePath $exePath
  } else {
    Write-Warning "Instalador StdBA não encontrado em: $exePath"
  }
}