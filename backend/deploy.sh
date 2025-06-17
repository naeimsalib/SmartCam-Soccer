#!/bin/bash

# Exit on error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print with color
print_status() {
    echo -e "${GREEN}[+]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[-]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

# Create necessary directories
print_status "Creating directories..."
mkdir -p /home/pi/SmartCam-Soccer/backend
mkdir -p /home/pi/SmartCam-Soccer/backend/temp
mkdir -p /home/pi/SmartCam-Soccer/backend/recordings
mkdir -p /home/pi/SmartCam-Soccer/backend/logs

# Copy service files
print_status "Installing systemd services..."
cp systemd/*.service /etc/systemd/system/

# Set proper permissions
print_status "Setting permissions..."
chown -R pi:pi /home/pi/SmartCam-Soccer
chmod -R 755 /home/pi/SmartCam-Soccer
chmod 644 /etc/systemd/system/*.service

# Reload systemd
print_status "Reloading systemd..."
systemctl daemon-reload

# Enable services
print_status "Enabling services..."
systemctl enable scheduler.service
systemctl enable camera.service
systemctl enable orchestrator.service

# Start services
print_status "Starting services..."
systemctl start scheduler.service
systemctl start camera.service
systemctl start orchestrator.service

# Check service status
print_status "Checking service status..."
echo
echo "Scheduler Service:"
systemctl status scheduler.service --no-pager
echo
echo "Camera Service:"
systemctl status camera.service --no-pager
echo
echo "Orchestrator Service:"
systemctl status orchestrator.service --no-pager

print_status "Deployment completed successfully!"
print_warning "Please check the service statuses above for any errors."
print_warning "You can view logs using: journalctl -u <service-name>" 