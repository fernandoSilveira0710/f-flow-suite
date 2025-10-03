#!/bin/bash

# F-Flow Client Local - Linux systemd Service Installer

set -e

SERVICE_NAME="f-flow-client-local"
SERVICE_FILE="$SERVICE_NAME.service"
SYSTEMD_DIR="/etc/systemd/system"
USER_SYSTEMD_DIR="$HOME/.config/systemd/user"
BINARY_PATH=""
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
USER_MODE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --binary-path)
            BINARY_PATH="$2"
            shift 2
            ;;
        --user)
            USER_MODE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [--binary-path /path/to/binary] [--user]"
            echo ""
            echo "Options:"
            echo "  --binary-path    Path to the f-flow-client binary"
            echo "  --user          Install as user service (no sudo required)"
            echo "  --help          Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Get binary path if not provided
if [ -z "$BINARY_PATH" ]; then
    BINARY_PATH="$SCRIPT_DIR/../build/f-flow-client-linux"
fi

# Check if binary exists
if [ ! -f "$BINARY_PATH" ]; then
    echo "Error: Binary not found at: $BINARY_PATH"
    echo "Please build the application first using: npm run build:pkg"
    exit 1
fi

# Convert to absolute path
BINARY_PATH="$(cd "$(dirname "$BINARY_PATH")" && pwd)/$(basename "$BINARY_PATH")"

# Make binary executable
chmod +x "$BINARY_PATH"

if [ "$USER_MODE" = true ]; then
    echo "Installing F-Flow Client Local as user systemd service..."
    INSTALL_DIR="$USER_SYSTEMD_DIR"
    SYSTEMCTL_CMD="systemctl --user"
else
    echo "Installing F-Flow Client Local as system systemd service..."
    INSTALL_DIR="$SYSTEMD_DIR"
    SYSTEMCTL_CMD="sudo systemctl"
    
    # Check if running as root or with sudo
    if [ "$EUID" -ne 0 ] && [ -z "$SUDO_USER" ]; then
        echo "Error: System service installation requires sudo privileges."
        echo "Run with sudo or use --user flag for user service installation."
        exit 1
    fi
fi

echo "Binary Path: $BINARY_PATH"
echo "Install Directory: $INSTALL_DIR"

# Create systemd directory if it doesn't exist (for user mode)
if [ "$USER_MODE" = true ]; then
    mkdir -p "$INSTALL_DIR"
fi

# Stop and disable existing service if it exists
SERVICE_PATH="$INSTALL_DIR/$SERVICE_FILE"
if [ -f "$SERVICE_PATH" ]; then
    echo "Stopping existing service..."
    $SYSTEMCTL_CMD stop "$SERVICE_NAME" 2>/dev/null || true
    $SYSTEMCTL_CMD disable "$SERVICE_NAME" 2>/dev/null || true
fi

# Create service file content
if [ "$USER_MODE" = true ]; then
    SERVICE_CONTENT="[Unit]
Description=F-Flow Client Local Service
After=network.target

[Service]
Type=simple
ExecStart=$BINARY_PATH --service
Restart=always
RestartSec=10
User=$USER
WorkingDirectory=$HOME
Environment=HOME=$HOME

[Install]
WantedBy=default.target"
else
    # Get the user who invoked sudo (if any)
    ACTUAL_USER="${SUDO_USER:-$USER}"
    ACTUAL_HOME=$(eval echo "~$ACTUAL_USER")
    
    SERVICE_CONTENT="[Unit]
Description=F-Flow Client Local Service
After=network.target

[Service]
Type=simple
ExecStart=$BINARY_PATH --service
Restart=always
RestartSec=10
User=$ACTUAL_USER
Group=$ACTUAL_USER
WorkingDirectory=$ACTUAL_HOME
Environment=HOME=$ACTUAL_HOME

[Install]
WantedBy=multi-user.target"
fi

# Write service file
echo "Creating systemd service file..."
if [ "$USER_MODE" = true ]; then
    echo "$SERVICE_CONTENT" > "$SERVICE_PATH"
else
    echo "$SERVICE_CONTENT" | sudo tee "$SERVICE_PATH" > /dev/null
fi

# Set proper permissions
if [ "$USER_MODE" = false ]; then
    sudo chmod 644 "$SERVICE_PATH"
fi

# Reload systemd
echo "Reloading systemd..."
$SYSTEMCTL_CMD daemon-reload

# Enable and start the service
echo "Enabling and starting service..."
if $SYSTEMCTL_CMD enable "$SERVICE_NAME"; then
    echo "✓ Service enabled successfully"
else
    echo "✗ Failed to enable service"
    exit 1
fi

if $SYSTEMCTL_CMD start "$SERVICE_NAME"; then
    echo "✓ Service started successfully"
else
    echo "✗ Failed to start service"
    exit 1
fi

# Check service status
sleep 2
if $SYSTEMCTL_CMD is-active --quiet "$SERVICE_NAME"; then
    echo "✓ Service is running!"
    echo ""
    echo "Service Name: $SERVICE_NAME"
    echo "Service File: $SERVICE_PATH"
    echo ""
    echo "You can manage the service using:"
    if [ "$USER_MODE" = true ]; then
        echo "  - systemctl --user start $SERVICE_NAME"
        echo "  - systemctl --user stop $SERVICE_NAME"
        echo "  - systemctl --user status $SERVICE_NAME"
        echo "  - systemctl --user restart $SERVICE_NAME"
        echo "  - journalctl --user -u $SERVICE_NAME -f"
    else
        echo "  - sudo systemctl start $SERVICE_NAME"
        echo "  - sudo systemctl stop $SERVICE_NAME"
        echo "  - sudo systemctl status $SERVICE_NAME"
        echo "  - sudo systemctl restart $SERVICE_NAME"
        echo "  - sudo journalctl -u $SERVICE_NAME -f"
    fi
    echo ""
    echo "To uninstall, run: ./uninstall-linux.sh"
    if [ "$USER_MODE" = true ]; then
        echo "  (with --user flag if installed as user service)"
    fi
else
    echo "⚠ Service was installed but is not running. Check status with:"
    if [ "$USER_MODE" = true ]; then
        echo "  systemctl --user status $SERVICE_NAME"
    else
        echo "  sudo systemctl status $SERVICE_NAME"
    fi
fi

echo "Installation completed."