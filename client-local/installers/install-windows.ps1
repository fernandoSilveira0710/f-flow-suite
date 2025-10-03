# F-Flow Client Local - Windows Service Installer
# Run as Administrator

param(
    [string]$BinaryPath = "",
    [string]$ServiceName = "F-Flow-Client-Local",
    [string]$DisplayName = "F-Flow Client Local Service",
    [string]$Description = "F-Flow Suite Client Local Server"
)

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "This script must be run as Administrator. Please run PowerShell as Administrator and try again."
    exit 1
}

# Get binary path if not provided
if ([string]::IsNullOrEmpty($BinaryPath)) {
    $BinaryPath = Join-Path $PSScriptRoot "..\build\f-flow-client-win.exe"
}

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

try {
    # Stop service if it exists
    $existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($existingService) {
        Write-Host "Stopping existing service..."
        Stop-Service -Name $ServiceName -Force
        Start-Sleep -Seconds 2
    }

    # Remove existing service
    $scResult = sc.exe delete $ServiceName
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Removed existing service"
        Start-Sleep -Seconds 2
    }

    # Create new service
    Write-Host "Creating service..."
    $scCreateResult = sc.exe create $ServiceName binPath= "`"$BinaryPath`" --service" start= auto DisplayName= $DisplayName
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to create service. Exit code: $LASTEXITCODE"
        exit 1
    }

    # Set service description
    sc.exe description $ServiceName $Description

    # Set service to restart on failure
    sc.exe failure $ServiceName reset= 86400 actions= restart/5000/restart/5000/restart/5000

    # Start the service
    Write-Host "Starting service..."
    Start-Service -Name $ServiceName

    # Verify service is running
    $service = Get-Service -Name $ServiceName
    if ($service.Status -eq "Running") {
        Write-Host "Service installed and started successfully!" -ForegroundColor Green
        Write-Host "Service Name: $ServiceName"
        Write-Host "Status: $($service.Status)"
        Write-Host ""
        Write-Host "You can manage the service using:"
        Write-Host "  - Services.msc (GUI)"
        Write-Host "  - sc.exe start $ServiceName"
        Write-Host "  - sc.exe stop $ServiceName"
        Write-Host "  - Get-Service $ServiceName"
        Write-Host ""
        Write-Host "To uninstall, run: .\uninstall-windows.ps1"
    } else {
        Write-Warning "Service was created but failed to start. Status: $($service.Status)"
        Write-Host "Check Windows Event Logs for more details."
    }

} catch {
    Write-Error "Failed to install service: $($_.Exception.Message)"
    exit 1
}

Write-Host "Installation completed."