#!/bin/bash

# F-Flow Client Local - macOS LaunchAgent Uninstaller

set -e

SERVICE_NAME="com.f-flow.client-local"
PLIST_NAME="$SERVICE_NAME.plist"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
PLIST_PATH="$LAUNCH_AGENTS_DIR/$PLIST_NAME"

echo "Uninstalling F-Flow Client Local macOS LaunchAgent..."

# Check if plist exists
if [ ! -f "$PLIST_PATH" ]; then
    echo "Warning: Service plist not found at: $PLIST_PATH"
    echo "Service may already be uninstalled."
    exit 0
fi

echo "Found service plist: $PLIST_PATH"

# Check if service is loaded
if launchctl list | grep -q "$SERVICE_NAME"; then
    echo "Service is currently loaded. Stopping and unloading..."
    
    # Stop the service
    launchctl stop "$SERVICE_NAME" 2>/dev/null || true
    
    # Unload the service
    if launchctl unload "$PLIST_PATH"; then
        echo "✓ Service unloaded successfully"
    else
        echo "⚠ Failed to unload service, but continuing with removal..."
    fi
else
    echo "Service is not currently loaded."
fi

# Remove the plist file
echo "Removing plist file..."
if rm -f "$PLIST_PATH"; then
    echo "✓ Plist file removed successfully"
else
    echo "✗ Failed to remove plist file"
    exit 1
fi

# Verify removal
sleep 1
if launchctl list | grep -q "$SERVICE_NAME"; then
    echo "⚠ Service may still be loaded. Try running:"
    echo "  launchctl remove $SERVICE_NAME"
else
    echo "✓ Service removal verified"
fi

echo ""
echo "✓ Uninstallation completed successfully!"
echo ""
echo "Note: Log files are preserved at:"
echo "  - $HOME/Library/Logs/f-flow-client-local.log"
echo "  - $HOME/Library/Logs/f-flow-client-local-error.log"
echo ""
echo "You can now run the application in development mode using: npm run start:dev"