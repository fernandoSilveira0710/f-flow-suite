# F-Flow Client Local - Windows Service Uninstaller
# Run as Administrator

param(
    [string]$ServiceName = "F-Flow-Client-Local"
)

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error 'This script must be run as Administrator. Please run PowerShell as Administrator and try again.'
    exit 1
}

Write-Host 'Uninstalling F-Flow Client Local Windows Service...'

try {
    # Check if service exists
    $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    
    if (-not $service) {
        Write-Warning ("Service '{0}' not found. It may already be uninstalled." -f $ServiceName)
        exit 0
    }

    Write-Host ("Found service: {0}" -f $($service.DisplayName))
    Write-Host ("Current status: {0}" -f $($service.Status))

    # Stop the service if it's running
    if ($service.Status -eq "Running") {
        Write-Host 'Stopping service...'
        Stop-Service -Name $ServiceName -Force
        
        # Wait for service to stop
        $timeout = 30
        $elapsed = 0
        while ((Get-Service -Name $ServiceName).Status -eq "Running" -and $elapsed -lt $timeout) {
            Start-Sleep -Seconds 1
            $elapsed++
        }
        
        if ((Get-Service -Name $ServiceName).Status -eq "Running") {
            Write-Warning ("Service did not stop within {0} seconds. Forcing removal..." -f $timeout)
        } else {
            Write-Host 'Service stopped successfully.'
        }
    }

    # Remove the service
    Write-Host 'Removing service...'
    $ProgramDataRoot = Join-Path $env:ProgramData "FFlow"
    $ServiceRoot = Join-Path $ProgramDataRoot "service"
    $winSwExe = Join-Path $ServiceRoot "$ServiceName.exe"

    $removeOk = $false
    if (Test-Path $winSwExe) {
        Write-Host "Uninstalling via WinSW..."
        & $winSwExe stop 2>$null
        & $winSwExe uninstall
        $removeOk = $true
    } else {
        $scResult = sc.exe delete $ServiceName
        $removeOk = ($LASTEXITCODE -eq 0)
    }

    if ($removeOk) {
        Write-Host 'Service uninstalled successfully!' -ForegroundColor Green
    } else {
        Write-Error ("Failed to remove service.")
        exit 1
    }

    # Verify service is removed
    Start-Sleep -Seconds 2
    $verifyService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($verifyService) {
        Write-Warning 'Service still exists after removal attempt.'
    } else {
        Write-Host 'Service removal verified.'
    }

} catch {
    Write-Error ("Failed to uninstall service: {0}" -f $_.Exception.Message)
    exit 1
}

Write-Host ""
Write-Host 'Uninstallation completed.'
Write-Host 'You can now run the application in development mode using: npm run start:dev'