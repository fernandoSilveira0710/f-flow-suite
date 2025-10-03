# F-Flow Client Local - Windows Service Uninstaller
# Run as Administrator

param(
    [string]$ServiceName = "F-Flow-Client-Local"
)

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "This script must be run as Administrator. Please run PowerShell as Administrator and try again."
    exit 1
}

Write-Host "Uninstalling F-Flow Client Local Windows Service..."

try {
    # Check if service exists
    $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    
    if (-not $service) {
        Write-Warning "Service '$ServiceName' not found. It may already be uninstalled."
        exit 0
    }

    Write-Host "Found service: $($service.DisplayName)"
    Write-Host "Current status: $($service.Status)"

    # Stop the service if it's running
    if ($service.Status -eq "Running") {
        Write-Host "Stopping service..."
        Stop-Service -Name $ServiceName -Force
        
        # Wait for service to stop
        $timeout = 30
        $elapsed = 0
        while ((Get-Service -Name $ServiceName).Status -eq "Running" -and $elapsed -lt $timeout) {
            Start-Sleep -Seconds 1
            $elapsed++
        }
        
        if ((Get-Service -Name $ServiceName).Status -eq "Running") {
            Write-Warning "Service did not stop within $timeout seconds. Forcing removal..."
        } else {
            Write-Host "Service stopped successfully."
        }
    }

    # Remove the service
    Write-Host "Removing service..."
    $scResult = sc.exe delete $ServiceName
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Service uninstalled successfully!" -ForegroundColor Green
    } else {
        Write-Error "Failed to remove service. Exit code: $LASTEXITCODE"
        exit 1
    }

    # Verify service is removed
    Start-Sleep -Seconds 2
    $verifyService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($verifyService) {
        Write-Warning "Service still exists after removal attempt."
    } else {
        Write-Host "Service removal verified."
    }

} catch {
    Write-Error "Failed to uninstall service: $($_.Exception.Message)"
    exit 1
}

Write-Host ""
Write-Host "Uninstallation completed."
Write-Host "You can now run the application in development mode using: npm run start:dev"