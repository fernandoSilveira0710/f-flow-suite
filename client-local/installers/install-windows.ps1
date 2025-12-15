# F-Flow Client Local - Windows Service Installer
# Run as Administrator

param(
    [string]$BinaryPath = "",
    [string]$ServiceName = "F-Flow-Client-Local",
    [string]$DisplayName = "F-Flow Client Local Service",
    [string]$Description = "F-Flow Suite Client Local Server",
    [string]$NodePath = "",
    [string]$ScriptPath = ""
)

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "This script must be run as Administrator. Please run PowerShell as Administrator and try again."
    exit 1
}

# Determine run mode first
$runMode = "exe"
if ((-not [string]::IsNullOrEmpty($NodePath)) -or (-not [string]::IsNullOrEmpty($ScriptPath))) {
    $runMode = "node"
}

# For exe mode, set default binary path if not provided
if ($runMode -eq "exe" -and [string]::IsNullOrEmpty($BinaryPath)) {
    $BinaryPath = Join-Path $PSScriptRoot "..\\build\\f-flow-client.exe"
}

if ($runMode -eq "node") {
    if ([string]::IsNullOrEmpty($NodePath)) {
        $NodePath = "C:\\Program Files\\nodejs\\node.exe"
        if (-not (Test-Path $NodePath)) { $NodePath = "C:\\Program Files (x86)\\nodejs\\node.exe" }
    }
    if ([string]::IsNullOrEmpty($ScriptPath)) {
        $ScriptPath = Join-Path $PSScriptRoot "..\dist\main.js"
    }
    if (-not (Test-Path $NodePath)) { Write-Error "Node executable not found at: $NodePath"; exit 1 }
    if (-not (Test-Path $ScriptPath)) { Write-Error "Script not found at: $ScriptPath"; Write-Host "Please build the application first using: npm run build"; exit 1 }
    Write-Host "Installing F-Flow Client Local as Windows Service..."
    Write-Host "Node Path: $NodePath"
    Write-Host "Script Path: $ScriptPath"
} else {
    # Check if binary exists
    if (-not (Test-Path $BinaryPath)) {
        Write-Error "Binary not found at: $BinaryPath"
        Write-Host "Please build the application first using: npm run build:pkg"
        exit 1
    }
    # Convert to absolute path
    $BinaryPath = Resolve-Path $BinaryPath
    Write-Host "Installing F-Flow Client Local as Windows Service..."
    Write-Host "Binary Path: $BinaryPath"
}

try {
    # Stop service if it exists
    $existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($existingService) {
        Write-Host "Stopping existing service..."
        Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 3
    }

    # Remove existing service using sc.exe with proper error handling
    Write-Host "Removing any existing service..."
    $deleteResult = sc.exe delete $ServiceName 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Removed existing service"
    } elseif ($LASTEXITCODE -eq 1060) {
        Write-Host "No existing service found (this is normal)"
    } else {
        Write-Warning "Service deletion returned code $LASTEXITCODE : $deleteResult"
    }
    Start-Sleep -Seconds 3

    # Create new service with proper error handling
    Write-Host "Creating service via WinSW..."

    # Prepare WinSW paths
    $ProgramDataRoot = Join-Path $env:ProgramData "FFlow"
    $ServiceRoot = Join-Path $ProgramDataRoot "service"
    New-Item -ItemType Directory -Path $ServiceRoot -Force | Out-Null

    $winSwExe = Join-Path $ServiceRoot "$ServiceName.exe"
    $winSwXml = Join-Path $ServiceRoot "$ServiceName.xml"

    # Use packaged WinSW if available; otherwise download
    $bundledWinSw = Join-Path $PSScriptRoot "windows\winsw\WinSW-x64.exe"
    if (-not (Test-Path $winSwExe)) {
        if (Test-Path $bundledWinSw) {
            Write-Host "Copying packaged WinSW from $bundledWinSw..."
            Copy-Item -Path $bundledWinSw -Destination $winSwExe -Force
        } else {
            $winswUrl = "https://github.com/winsw/winsw/releases/download/v3.0.2/WinSW-x64.exe"
            Write-Host "Downloading WinSW from $winswUrl..."
            Invoke-WebRequest -Uri $winswUrl -OutFile $winSwExe -UseBasicParsing
        }
    }

    # Build executable and args
    if ($runMode -eq "node") {
        $serviceExecutable = $NodePath
        $serviceArguments = "`"$ScriptPath`" --service"
        # Use app root as working directory so .env at {app} is loaded
        $workingDir = (Resolve-Path (Join-Path (Split-Path -Path $ScriptPath -Parent) ".."))
    } else {
        $serviceExecutable = $BinaryPath
        $serviceArguments = "--service"
        $workingDir = (Split-Path -Path $BinaryPath -Parent)
    }

    # Logs root
    $LogsRoot = Join-Path $ProgramDataRoot "logs"
    $ClientLogs = Join-Path $LogsRoot "client-local"
    New-Item -ItemType Directory -Path $ClientLogs -Force | Out-Null

    # Write WinSW XML config
    $xmlContent = @"
<service>
  <id>$ServiceName</id>
  <name>$DisplayName</name>
  <description>$Description</description>
  <executable>$serviceExecutable</executable>
  <arguments>$serviceArguments</arguments>
  <workingdirectory>$workingDir</workingdirectory>
  <logpath>$ClientLogs</logpath>
  <startmode>Automatic</startmode>
  <stoptimeout>15000</stoptimeout>
  <resetfailure>86400</resetfailure>
  <onfailure>restart</onfailure>
</service>
"@
    Set-Content -Path $winSwXml -Value $xmlContent -Encoding UTF8

    # If legacy service exists, remove it
    $legacySvc = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($legacySvc) {
        Write-Host "Removing legacy service registration..."
        sc.exe delete $ServiceName | Out-Null
        Start-Sleep -Seconds 2
    }

    # Install and start via WinSW
    Write-Host "Installing service with WinSW..."
    & $winSwExe install
    Write-Host "Starting service..."
    & $winSwExe start

    # Verify service
    $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($service -and $service.Status -eq "Running") {
        Write-Host "Service installed and started successfully!" -ForegroundColor Green
        Write-Host "Service Name: $ServiceName"
        Write-Host "Status: $($service.Status)"
        Write-Host "Managed by WinSW at: $ServiceRoot"
        Write-Host "Logs: $ClientLogs"
        Write-Host "To uninstall, run: .\\uninstall-windows.ps1"
    } else {
        Write-Warning "Service did not report Running immediately. WinSW will handle retries."
    }

} catch {
    Write-Error "Failed to install service: $($_.Exception.Message)"
    exit 1
}

Write-Host "Installation completed."

# Create centralized log directories and local DNS/port proxy

$ProgramDataRoot = Join-Path $env:ProgramData "FFlow"
$LogsRoot = Join-Path $ProgramDataRoot "logs"
$ClientLogs = Join-Path $LogsRoot "client-local"
$ErpHost = "erp.local"

try {
    # Ensure directories exist
    New-Item -ItemType Directory -Path $ClientLogs -Force | Out-Null

    # Instalar ERP local como serviço 24/7 na porta 8080
     $AppDir = Join-Path $PSScriptRoot ".."
     $ErpPort = 8080
     $ErpLogs = "C:\ProgramData\FFlow\logs\erp"
     $ErpServiceId = "F-Flow-ERP-Local"
     $WinSWExe = Join-Path $AppDir "installers\windows\winsw\WinSW-x64.exe"
     $ErpServiceXml = Join-Path $AppDir "installers\windows\winsw\${ErpServiceId}.xml"
     $ErpServerExe = Join-Path $AppDir "installers\windows\erp-server.exe"
     $ErpDist = Join-Path $AppDir "erp\dist"

     New-Item -ItemType Directory -Force -Path $ErpLogs | Out-Null

     @"
<service>
  <id>$ErpServiceId</id>
  <name>F-Flow ERP Local Service</name>
  <description>Serves local ERP build with static server</description>
  <executable>$ErpServerExe</executable>
  <arguments>--root "$ErpDist" --port $ErpPort</arguments>
  <logpath>$ErpLogs</logpath>
  <onfailure action="restart" delay="5 sec"/>
  <resetfailure>1 hour</resetfailure>
</service>
"@ | Set-Content -Encoding UTF8 $ErpServiceXml

     try {
       & $WinSWExe uninstall "$ErpServiceXml" | Out-Null
     } catch {}
     & $WinSWExe install "$ErpServiceXml" | Out-Null
     & $WinSWExe start "$ErpServiceXml" | Out-Null
     Write-Host "[ERP] Serviço instalado: $ErpServiceId na porta $ErpPort" -ForegroundColor Green

     try {
       New-NetFirewallRule -DisplayName "F-Flow ERP 8080" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow -Profile Any -ErrorAction SilentlyContinue | Out-Null
       Write-Host "[ERP] Regra de firewall aplicada para porta 8080" -ForegroundColor Green
     } catch {
       Write-Host "[ERP] Falha ao aplicar firewall: $($_.Exception.Message)" -ForegroundColor Yellow
     }
} catch {
    Write-Warning "Failed to configure hosts/portproxy/firewall: $($_.Exception.Message)"
}