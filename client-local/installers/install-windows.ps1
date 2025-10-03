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
    Write-Host "Creating service..."
    $createResult = sc.exe create $ServiceName binPath= "`"$BinaryPath --service`"" start= auto DisplayName= "`"$DisplayName`"" 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to create service. Exit code: $LASTEXITCODE. Output: $createResult"
        
        # Additional troubleshooting info
        Write-Host "Troubleshooting information:"
        Write-Host "- Service Name: $ServiceName"
        Write-Host "- Binary Path: $BinaryPath"
        Write-Host "- Binary Exists: $(Test-Path $BinaryPath)"
        
        # Check if service already exists with different method
        $existingServices = Get-WmiObject -Class Win32_Service | Where-Object { $_.Name -eq $ServiceName }
        if ($existingServices) {
            Write-Host "- Service already exists in WMI"
            foreach ($svc in $existingServices) {
                Write-Host "  State: $($svc.State), Status: $($svc.Status)"
            }
        }
        
        exit 1
    }

    Write-Host "Service created successfully"

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