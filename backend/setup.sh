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

print_status "Updating package lists..."
apt-get update

print_status "Installing system dependencies..."
apt-get install -y \
    python3-pip \
    python3-venv \
    ffmpeg \
    libopencv-dev \
    python3-opencv

print_status "Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

print_status "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

print_status "Setting up camera permissions..."
usermod -a -G video pi

print_status "Creating necessary directories..."
mkdir -p /home/pi/SmartCam-Soccer/backend/temp
mkdir -p /home/pi/SmartCam-Soccer/backend/recordings
mkdir -p /home/pi/SmartCam-Soccer/backend/logs

print_status "Setting permissions..."
chown -R pi:pi /home/pi/SmartCam-Soccer
chmod -R 755 /home/pi/SmartCam-Soccer

print_status "Setup completed successfully!"
print_warning "Please create a .env file in the backend directory with your configuration."
print_warning "Then run 'sudo ./deploy.sh' to start the services." 