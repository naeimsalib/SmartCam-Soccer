# SmartCam Soccer - Reference Repository

This repository has been split into two separate repositories for better organization and maintenance:

## Repository Structure

- **Frontend Repository**: [EZREC-FrontEnd](https://github.com/naeimsalib/EZREC-FrontEnd.git)
  - React/TypeScript frontend application
  - Material-UI components
  - Supabase integration for authentication and data

- **Backend Repository**: [EZREC-BackEnd](https://github.com/naeimsalib/EZREC-BackEnd.git)
  - Python backend services
  - systemd service configurations
  - Camera and recording management
  - Database operations

## Quick Start

### Frontend Development
```bash
git clone https://github.com/naeimsalib/EZREC-FrontEnd.git
cd EZREC-FrontEnd
npm install
npm run dev
```

### Backend Development
```bash
git clone https://github.com/naeimsalib/EZREC-BackEnd.git
cd EZREC-BackEnd
pip install -r requirements.txt
# Follow setup instructions in the backend README
```

## System Overview

The SmartCam Soccer system consists of:

1. **Frontend Application** (EZREC-FrontEnd)
   - Dashboard with real-time system status
   - Live camera preview
   - Field booking system
   - Recording management
   - System settings and configuration

2. **Backend Services** (EZREC-BackEnd)
   - Camera service for video recording
   - Scheduler service for automation
   - Orchestrator service for coordination
   - Database integration with Supabase

3. **Hardware Components**
   - Raspberry Pi for camera operations
   - USB or Pi Camera for video capture
   - Network connectivity for data transmission

## Development Workflow

1. **Frontend Changes**: Work in the EZREC-FrontEnd repository
2. **Backend Changes**: Work in the EZREC-BackEnd repository
3. **Integration**: Both repositories connect via Supabase database
4. **Deployment**: Deploy frontend to static hosting, backend to Raspberry Pi

## Documentation

- **Frontend Documentation**: See [EZREC-FrontEnd README](https://github.com/naeimsalib/EZREC-FrontEnd.git)
- **Backend Documentation**: See [EZREC-BackEnd README](https://github.com/naeimsalib/EZREC-BackEnd.git)

## Contributing

- Frontend contributions: Fork and contribute to [EZREC-FrontEnd](https://github.com/naeimsalib/EZREC-FrontEnd.git)
- Backend contributions: Fork and contribute to [EZREC-BackEnd](https://github.com/naeimsalib/EZREC-BackEnd.git)

## Support

For issues and questions:
- Frontend issues: Create an issue in [EZREC-FrontEnd](https://github.com/naeimsalib/EZREC-FrontEnd.git)
- Backend issues: Create an issue in [EZREC-BackEnd](https://github.com/naeimsalib/EZREC-BackEnd.git)

## License

This project is part of the SmartCam Soccer system. 