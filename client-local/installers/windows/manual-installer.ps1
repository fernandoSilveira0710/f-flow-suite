# Manual F-Flow Installer Script
# Simula o comportamento do instalador .exe
param(
    [string]$InstallPath = "C:\Program Files\F-Flow\ClientLocal",
    [switch]$Silent = $false
)

Write-Host "=== F-Flow Client Local + ERP Manual Installer ===" -ForegroundColor Green
Write-Host "Install Path: $InstallPath" -ForegroundColor Yellow

# Verificar se está rodando como administrador
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "Este script deve ser executado como Administrador!"
    exit 1
}

try {
    # Criar diretório de instalação
    Write-Host "Criando diretório de instalação..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
    New-Item -ItemType Directory -Path "$InstallPath\installers\windows" -Force | Out-Null
    New-Item -ItemType Directory -Path "$InstallPath\installers\windows\winsw" -Force | Out-Null
    New-Item -ItemType Directory -Path "$InstallPath\erp\dist" -Force | Out-Null
    New-Item -ItemType Directory -Path "$InstallPath\launchers" -Force | Out-Null

    # Copiar arquivos do Client Local
    Write-Host "Copiando arquivos do Client Local..." -ForegroundColor Cyan
    $SourceDir = Split-Path -Parent $PSScriptRoot
    Copy-Item "$SourceDir\build\f-flow-client.exe" -Destination "$InstallPath\" -Force
    Copy-Item "$SourceDir\.env.example" -Destination "$InstallPath\" -Force
    Copy-Item "$SourceDir\build\query_engine-windows.dll.node" -Destination "$InstallPath\" -Force
    Copy-Item "$SourceDir\build\seed.db" -Destination "$InstallPath\" -Force

    # Copiar migrations do Prisma para execução pelo runner empacotado
    if (Test-Path "$SourceDir\prisma\migrations") {
        Write-Host "Copiando migrations do Prisma..." -ForegroundColor Cyan
        Copy-Item "$SourceDir\prisma\migrations\*" -Destination "$InstallPath\prisma\migrations\" -Recurse -Force
    }

    # Copiar arquivos do ERP
    Write-Host "Copiando arquivos do ERP..." -ForegroundColor Cyan
    Copy-Item "$PSScriptRoot\build\erp-server.exe" -Destination "$InstallPath\installers\windows\" -Force
    Copy-Item "$PSScriptRoot\..\..\..\dist\*" -Destination "$InstallPath\erp\dist\" -Recurse -Force

    # Copiar WinSW
    Write-Host "Copiando WinSW..." -ForegroundColor Cyan
    Copy-Item "$PSScriptRoot\winsw\WinSW-x64.exe" -Destination "$InstallPath\installers\windows\winsw\" -Force

    # Copiar scripts de instalação
    Write-Host "Copiando scripts de instalação..." -ForegroundColor Cyan
    Copy-Item "$PSScriptRoot\install-windows.ps1" -Destination "$InstallPath\installers\" -Force
    Copy-Item "$PSScriptRoot\uninstall-windows.ps1" -Destination "$InstallPath\installers\" -Force

    # Copiar launcher (opcional)
    if (Test-Path "$PSScriptRoot\build\launcher\fflow-launcher.exe") {
        Copy-Item "$PSScriptRoot\build\launcher\fflow-launcher.exe" -Destination "$InstallPath\launchers\" -Force
    }

    # Criar arquivo .env
    Write-Host "Criando arquivo .env..." -ForegroundColor Cyan
    $EnvContent = @"
LOCAL_SERVER_ENABLED=true
CLIENT_HTTP_PORT=8081
HUB_BASE_URL=https://hub.fflow.com.br
DATABASE_URL="file:./local.db"
LOCAL_DATA_DIR=$InstallPath
LOCAL_LOG_DIR=C:\ProgramData\FFlow\logs\client-local
SKIP_MIGRATIONS=false
NODE_ENV=production
"@
    Set-Content -Path "$InstallPath\.env" -Value $EnvContent -Encoding UTF8

    # Executar script de instalação
    Write-Host "Executando instalação dos serviços..." -ForegroundColor Cyan
    $InstallScript = "$InstallPath\installers\install-windows.ps1"
    $BinaryPath = "$InstallPath\f-flow-client.exe"
    
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $InstallScript -BinaryPath $BinaryPath

    # Criar atalhos
    Write-Host "Criando atalhos..." -ForegroundColor Cyan
    
    # Atalho no Menu Iniciar
    $StartMenuPath = "$env:ProgramData\Microsoft\Windows\Start Menu\Programs"
    New-Item -ItemType Directory -Path "$StartMenuPath\F-Flow" -Force | Out-Null
    
    # Atalho para ERP
    $WshShell = New-Object -comObject WScript.Shell
    $ErpShortcut = $WshShell.CreateShortcut("$StartMenuPath\F-Flow\Abrir ERP.lnk")
    $ErpShortcut.TargetPath = "cmd.exe"
    $ErpShortcut.Arguments = "/c start http://127.0.0.1:8080/"
    $ErpShortcut.WorkingDirectory = $InstallPath
    $ErpShortcut.Save()

    # Atalho na área de trabalho
    $DesktopPath = [Environment]::GetFolderPath("CommonDesktopDirectory")
    $ErpDesktopShortcut = $WshShell.CreateShortcut("$DesktopPath\F-Flow ERP.lnk")
    $ErpDesktopShortcut.TargetPath = "cmd.exe"
    $ErpDesktopShortcut.Arguments = "/c start http://127.0.0.1:8080/"
    $ErpDesktopShortcut.WorkingDirectory = $InstallPath
    $ErpDesktopShortcut.Save()

    # Atalho para desinstalar
    $UninstallShortcut = $WshShell.CreateShortcut("$StartMenuPath\F-Flow\Desinstalar Client Local.lnk")
    $UninstallShortcut.TargetPath = "powershell.exe"
    $UninstallShortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$InstallPath\installers\uninstall-windows.ps1`""
    $UninstallShortcut.Save()

    Write-Host ""
    Write-Host "=== INSTALAÇÃO CONCLUÍDA COM SUCESSO! ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "Serviços instalados:" -ForegroundColor Yellow
    Write-Host "  • F-Flow Client Local (porta 8081)" -ForegroundColor White
    Write-Host "  • F-Flow ERP Local (porta 8080)" -ForegroundColor White
    Write-Host ""
    Write-Host "URLs de acesso:" -ForegroundColor Yellow
    Write-Host "  • ERP: http://127.0.0.1:8080/" -ForegroundColor White
    Write-Host "  • Client Local API: http://127.0.0.1:8081/health" -ForegroundColor White
    Write-Host ""
    Write-Host "Logs centralizados em: C:\ProgramData\FFlow\logs\" -ForegroundColor Yellow
    Write-Host "Diretório de instalação: $InstallPath" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Atalhos criados no Menu Iniciar e Área de Trabalho" -ForegroundColor Cyan

} catch {
    Write-Error "Erro durante a instalação: $($_.Exception.Message)"
    exit 1
}