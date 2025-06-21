# SmartCam Soccer - Backend

This repository contains the backend services and system components for the SmartCam Soccer system.

## Repository Structure

This repository has been split into two separate repositories:

- **Backend Repository** (this one): Contains all backend services, systemd configurations, and server-side code
- **Frontend Repository**: [EZREC-FrontEnd](https://github.com/naeimsalib/EZREC-FrontEnd.git) - Contains the React/TypeScript frontend application

## Backend Components

### Services
- **Camera Service**: Handles camera operations and recording
- **Scheduler Service**: Manages recording schedules and automation
- **Orchestrator Service**: Coordinates between different system components

### System Configuration
- **systemd Services**: Service files for automatic startup and management
- **Environment Configuration**: Backend environment variables and settings

### Database
- **Supabase Integration**: Database schema and backend API endpoints
- **Data Models**: Database tables for recordings, bookings, system status, etc.

## Quick Start

### Prerequisites
- Python 3.8+
- Raspberry Pi (for camera services)
- Supabase account and project

### Installation

1. Clone this repository:
```bash
git clone https://github.com/naeimsalib/SmartCam-Soccer.git
cd SmartCam-Soccer
```

2. Set up virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables:
Create a `.env` file with your Supabase credentials and other settings.

5. Set up systemd services (on Raspberry Pi):
```bash
sudo cp backend/systemd/*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable smartcam-camera smartcam-scheduler smartcam-orchestrator
sudo systemctl start smartcam-camera smartcam-scheduler smartcam-orchestrator
```

## Frontend Integration

The frontend application is now in a separate repository. To work with the complete system:

1. Clone the frontend repository:
```bash
git clone https://github.com/naeimsalib/EZREC-FrontEnd.git
cd EZREC-FrontEnd
npm install
```

2. Configure frontend environment variables and run:
```bash
npm run dev
```

## Development

### Backend Development
- All backend code is in the `backend/` directory
- Services are managed via systemd on the Raspberry Pi
- Database schema and migrations are handled through Supabase

### Frontend Development
- Frontend development is done in the separate [EZREC-FrontEnd](https://github.com/naeimsalib/EZREC-FrontEnd.git) repository
- Uses React with TypeScript and Material-UI
- Connects to the backend via Supabase

## Deployment

### Backend Deployment
- Backend services run on Raspberry Pi using systemd
- Database is hosted on Supabase
- Environment variables must be configured for each service

### Frontend Deployment
- Frontend can be deployed to any static hosting service
- Build the frontend with `npm run build`
- Deploy the `dist/` folder to your hosting provider

## Contributing

1. Fork the appropriate repository (backend or frontend)
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the SmartCam Soccer system. 