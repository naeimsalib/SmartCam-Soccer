import os
from dotenv import load_dotenv
from pathlib import Path
import glob
import cv2

# Load environment variables
load_dotenv()

# Base paths
BASE_DIR = Path(__file__).parent.parent
TEMP_DIR = BASE_DIR / "temp"
UPLOAD_DIR = BASE_DIR / "uploads"
LOG_DIR = BASE_DIR / "logs"
RECORDING_DIR = BASE_DIR / "recordings"

# Create directories if they don't exist
TEMP_DIR.mkdir(exist_ok=True)
UPLOAD_DIR.mkdir(exist_ok=True)
LOG_DIR.mkdir(exist_ok=True)
RECORDING_DIR.mkdir(exist_ok=True)

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")
USER_ID = os.getenv("USER_ID")
CAMERA_ID = os.getenv("CAMERA_ID")
CAMERA_NAME = os.getenv("CAMERA_NAME", "Camera")
CAMERA_LOCATION = os.getenv("CAMERA_LOCATION", "")

# Camera settings
CAMERA_DEVICE = os.getenv("CAMERA_DEVICE")
PREVIEW_WIDTH = int(os.getenv("CAMERA_WIDTH", 640))
PREVIEW_HEIGHT = int(os.getenv("CAMERA_HEIGHT", 480))
RECORD_WIDTH = int(os.getenv("RECORD_WIDTH", 1280))
RECORD_HEIGHT = int(os.getenv("RECORD_HEIGHT", 720))
PREVIEW_FPS = int(os.getenv("PREVIEW_FPS", 24))
RECORD_FPS = int(os.getenv("RECORD_FPS", 30))
HARDWARE_ENCODER = os.getenv("HARDWARE_ENCODER", "h264_omx")

# Recording settings
MAX_RECORDING_DURATION = int(os.getenv("MAX_RECORDING_DURATION", 7200))  # 2 hours in seconds
MIN_RECORDING_DURATION = int(os.getenv("MIN_RECORDING_DURATION", 300))   # 5 minutes in seconds

# Status update intervals
STATUS_UPDATE_INTERVAL = int(os.getenv("STATUS_UPDATE_INTERVAL", 15))  # seconds
BOOKING_CHECK_INTERVAL = int(os.getenv("BOOKING_CHECK_INTERVAL", 60))  # seconds

# File paths
NEXT_BOOKING_FILE = TEMP_DIR / "next_booking.json"
UPLOAD_QUEUE_FILE = TEMP_DIR / "to_upload.txt"


def auto_detect_camera():
    """Auto-detect the first working camera device."""
    video_devices = sorted(glob.glob('/dev/video*'))
    for device in video_devices:
        try:
            cap = cv2.VideoCapture(device)
            if cap.isOpened():
                ret, frame = cap.read()
                cap.release()
                if ret:
                    return device
        except Exception:
            continue
    return None 