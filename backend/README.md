# SmartCam Soccer Backend

This is the backend service for the SmartCam Soccer application. It consists of three main components:

1. **Scheduler Service**: Checks for upcoming bookings and manages recording schedules
2. **Camera Service**: Handles video recording and file uploads
3. **Orchestrator Service**: Coordinates between the scheduler and camera services

## Prerequisites

- Raspberry Pi (tested on Raspberry Pi OS)
- Python 3.7 or higher
- OpenCV (`pip install opencv-python`)
- Supabase Python client (`pip install supabase`)
- Systemd (should be installed by default on Raspberry Pi OS)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/SmartCam-Soccer.git
cd SmartCam-Soccer/backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file in the `backend` directory with your configuration:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
USER_ID=your_user_id
CAMERA_ID=0
CAMERA_WIDTH=1920
CAMERA_HEIGHT=1080
CAMERA_FPS=30
```

4. Make the deployment script executable:
```bash
chmod +x deploy.sh
```

5. Run the deployment script as root:
```bash
sudo ./deploy.sh
```

## Service Management

### Starting Services
```bash
sudo systemctl start scheduler.service
sudo systemctl start camera.service
sudo systemctl start orchestrator.service
```

### Stopping Services
```bash
sudo systemctl stop scheduler.service
sudo systemctl stop camera.service
sudo systemctl stop orchestrator.service
```

### Checking Service Status
```bash
sudo systemctl status scheduler.service
sudo systemctl status camera.service
sudo systemctl status orchestrator.service
```

### Viewing Logs
```bash
sudo journalctl -u scheduler.service
sudo journalctl -u camera.service
sudo journalctl -u orchestrator.service
```

## Directory Structure

```
backend/
├── src/
│   ├── config.py      # Configuration settings
│   ├── utils.py       # Utility functions
│   ├── scheduler.py   # Scheduler service
│   ├── camera.py      # Camera service
│   └── orchestrator.py # Orchestrator service
├── systemd/
│   ├── scheduler.service
│   ├── camera.service
│   └── orchestrator.service
├── temp/              # Temporary files
├── recordings/        # Recorded videos
├── logs/             # Log files
├── deploy.sh         # Deployment script
└── README.md         # This file
```

## Troubleshooting

1. **Camera not working**:
   - Check if the camera is properly connected
   - Verify the `CAMERA_ID` in your `.env` file
   - Check camera permissions: `sudo usermod -a -G video pi`

2. **Services not starting**:
   - Check service status: `sudo systemctl status <service-name>`
   - View logs: `sudo journalctl -u <service-name>`
   - Verify Python dependencies are installed
   - Check file permissions

3. **Upload issues**:
   - Verify Supabase credentials in `.env`
   - Check internet connection
   - Verify storage bucket exists in Supabase

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 