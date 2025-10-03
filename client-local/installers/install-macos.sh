#!/bin/bash

# F-Flow Client Local - macOS LaunchAgent Installer

set -e

SERVICE_NAME="com.f-flow.client-local"
PLIST_NAME="$SERVICE_NAME.plist"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
BINARY_PATH=""
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --binary-path)
            BINARY_PATH="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--binary-path /path/to/binary]"
            exit 1
            ;;
    esac
done

# Get binary path if not provided
if [ -z "$BINARY_PATH" ]; then
    BINARY_PATH="$SCRIPT_DIR/../build/f-flow-client-macos"
fi

# Check if binary exists
if [ ! -f "$BINARY_PATH" ]; then
    echo "Error: Binary not found at: $BINARY_PATH"
    echo "Please build the application first using: npm run build:pkg"
    exit 1
fi

# Convert to absolute path
BINARY_PATH="$(cd "$(dirname "$BINARY_PATH")" && pwd)/$(basename "$BINARY_PATH")"

echo "Installing F-Flow Client Local as macOS LaunchAgent..."
echo "Binary Path: $BINARY_PATH"

# Create LaunchAgents directory if it doesn't exist
mkdir -p "$LAUNCH_AGENTS_DIR"

# Stop and unload existing service if it exists
PLIST_PATH="$LAUNCH_AGENTS_DIR/$PLIST_NAME"
if [ -f "$PLIST_PATH" ]; then
    echo "Stopping existing service..."
    launchctl unload "$PLIST_PATH" 2>/dev/null || true
    rm -f "$PLIST_PATH"
fi

# Create plist file
echo "Creating LaunchAgent plist..."
cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>$SERVICE_NAME</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>$BINARY_PATH</string>
        <string>--service</string>
    </array>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>KeepAlive</key>
    <dict>
        <key>SuccessfulExit</key>
        <false/>
    </dict>
    
    <key>StandardOutPath</key>
    <string>$HOME/Library/Logs/f-flow-client-local.log</string>
    
    <key>StandardErrorPath</key>
    <string>$HOME/Library/Logs/f-flow-client-local-error.log</string>
    
    <key>WorkingDirectory</key>
    <string>$HOME</string>
    
    <key>ProcessType</key>
    <string>Background</string>
    
    <key>ThrottleInterval</key>
    <integer>10</integer>
</dict>
</plist>
EOF

# Set proper permissions
chmod 644 "$PLIST_PATH"

# Load the service
echo "Loading LaunchAgent..."
if launchctl load "$PLIST_PATH"; then
    echo "✓ Service installed and started successfully!"
    echo "Service Name: $SERVICE_NAME"
    echo "Plist Location: $PLIST_PATH"
    echo ""
    echo "You can manage the service using:"
    echo "  - launchctl start $SERVICE_NAME"
    echo "  - launchctl stop $SERVICE_NAME"
    echo "  - launchctl list | grep f-flow"
    echo ""
    echo "Logs are available at:"
    echo "  - $HOME/Library/Logs/f-flow-client-local.log"
    echo "  - $HOME/Library/Logs/f-flow-client-local-error.log"
    echo ""
    echo "To uninstall, run: ./uninstall-macos.sh"
    
    # Check if service is running
    sleep 2
    if launchctl list | grep -q "$SERVICE_NAME"; then
        echo "✓ Service is running"
    else
        echo "⚠ Service was loaded but may not be running. Check logs for details."
    fi
else
    echo "✗ Failed to load service"
    exit 1
fi

echo "Installation completed."