# F-Flow Client Local - Service Reinstaller
# Run as Administrator

param(
    [string]$ServiceName = "F-Flow-Client-Local"
)

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "This script must be run as Administrator. Please run PowerShell as Administrator and try again."
    exit 1
}

Write-Host "Reinstalling F-Flow Client Local Windows Service..."

try {
    # First, run uninstall
    Write-Host "Step 1: Uninstalling existing service..."
    & "$PSScriptRoot\uninstall-windows.ps1" -ServiceName $ServiceName
    
    # Wait a moment
    Start-Sleep -Seconds 5
    
    # Then, run install
    Write-Host "Step 2: Installing updated service..."
    & "$PSScriptRoot\install-windows.ps1" -ServiceName $ServiceName
    
    Write-Host "Reinstallation completed successfully!" -ForegroundColor Green
    
} catch {
    Write-Error "Failed to reinstall service: $($_.Exception.Message)"
    exit 1
}