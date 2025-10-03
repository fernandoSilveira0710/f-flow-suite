#!/bin/bash

# F-Flow Client Local - Linux systemd Service Uninstaller

set -e

SERVICE_NAME="f-flow-client-local"
SERVICE_FILE="$SERVICE_NAME.service"
SYSTEMD_DIR="/etc/systemd/system"
USER_SYSTEMD_DIR="$HOME/.config/systemd/user"
USER_MODE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --user)
            USER_MODE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [--user]"
            echo ""
            echo "Options:"
            echo "  --user    Uninstall user service"
            echo "  --help    Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

if [ "$USER_MODE" = true ]; then
    echo "Uninstalling F-Flow Client Local user systemd service..."
    INSTALL_DIR="$USER_SYSTEMD_DIR"
    SYSTEMCTL_CMD="systemctl --user"
else
    echo "Uninstalling F-Flow Client Local system systemd service..."
    INSTALL_DIR="$SYSTEMD_DIR"
    SYSTEMCTL_CMD="sudo systemctl"
    
    # Check if running as root or with sudo for system service
    if [ "$EUID" -ne 0 ] && [ -z "$SUDO_USER" ]; then
        echo "Error: System service uninstallation requires sudo privileges."
        echo "Run with sudo or use --user flag for user service uninstallation."
        exit 1
    fi
fi

SERVICE_PATH="$INSTALL_DIR/$SERVICE_FILE"

# Check if service file exists
if [ ! -f "$SERVICE_PATH" ]; then
    echo "Warning: Service file not found at: $SERVICE_PATH"
    echo "Service may already be uninstalled."
    exit 0
fi

echo "Found service file: $SERVICE_PATH"

# Check if service is active
if $SYSTEMCTL_CMD is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
    echo "Service is currently running. Stopping..."
    if $SYSTEMCTL_CMD stop "$SERVICE_NAME"; then
        echo "✓ Service stopped successfully"
    else
        echo "⚠ Failed to stop service, but continuing with removal..."
    fi
else
    echo "Service is not currently running."
fi

# Disable the service
echo "Disabling service..."
if $SYSTEMCTL_CMD disable "$SERVICE_NAME" 2>/dev/null; then
    echo "✓ Service disabled successfully"
else
    echo "⚠ Failed to disable service, but continuing with removal..."
fi

# Remove service file
echo "Removing service file..."
if [ "$USER_MODE" = true ]; then
    if rm -f "$SERVICE_PATH"; then
        echo "✓ Service file removed successfully"
    else
        echo "✗ Failed to remove service file"
        exit 1
    fi
else
    if sudo rm -f "$SERVICE_PATH"; then
        echo "✓ Service file removed successfully"
    else
        echo "✗ Failed to remove service file"
        exit 1
    fi
fi

# Reload systemd
echo "Reloading systemd..."
$SYSTEMCTL_CMD daemon-reload

# Verify removal
sleep 1
if [ -f "$SERVICE_PATH" ]; then
    echo "⚠ Service file still exists after removal attempt"
    exit 1
fi

if $SYSTEMCTL_CMD list-unit-files | grep -q "$SERVICE_NAME"; then
    echo "⚠ Service may still be registered in systemd"
else
    echo "✓ Service removal verified"
fi

echo ""
echo "✓ Uninstallation completed successfully!"
echo ""
echo "You can now run the application in development mode using: npm run start:dev"