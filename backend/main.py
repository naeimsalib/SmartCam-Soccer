# This to fi
# transition between intro video and recordings is not working

import os
import cv2
import numpy as np
import time
import datetime
import subprocess
from supabase import create_client, Client
from dotenv import load_dotenv
import threading
import queue
import json
from enum import Enum
import shutil
import socket
import signal
import sys
import queue as pyqueue
import multiprocessing
from concurrent.futures import ThreadPoolExecutor
import logging
from logging.handlers import RotatingFileHandler
from src.config import (
    CAMERA_DEVICE, PREVIEW_WIDTH, PREVIEW_HEIGHT, RECORD_WIDTH, RECORD_HEIGHT, PREVIEW_FPS, RECORD_FPS, HARDWARE_ENCODER
)
from src.camera_interface import CameraInterface
from src.utils import send_heartbeat, start_heartbeat_thread, stop_heartbeat_thread

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        RotatingFileHandler('camera.log', maxBytes=1024*1024, backupCount=3),
        logging.StreamHandler()
    ]
)

class LogLevel(Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    SUCCESS = "SUCCESS"

def log(message, level=LogLevel.INFO):
    if level == LogLevel.INFO:
        logging.info(message)
    elif level == LogLevel.WARNING:
        logging.warning(message)
    elif level == LogLevel.ERROR:
        logging.error(message)
    elif level == LogLevel.SUCCESS:
        logging.info(f"SUCCESS: {message}")

# Constants for video processing
MAX_WORKERS = 2  # Limit concurrent processes

# Global variables
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
USER_ID = os.getenv("USER_ID")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
upload_queue = queue.Queue()
shutting_down = False

# Cache for logos and settings
logo_cache = {}
settings_cache = None
last_settings_update = 0
SETTINGS_CACHE_DURATION = 3600  # 1 hour

def get_user_settings():
    global settings_cache, last_settings_update
    current_time = time.time()
    
    if settings_cache is None or (current_time - last_settings_update) > SETTINGS_CACHE_DURATION:
        try:
            response = supabase.table("user_settings").select("*").eq("user_id", USER_ID).single().execute()
            settings_cache = response.data if response.data else {}
            last_settings_update = current_time
        except Exception as e:
            log(f"Failed to fetch settings: {str(e)}", LogLevel.ERROR)
            return settings_cache or {}
    
    return settings_cache

def overlay_logo(frame, logo_path, position):
    global logo_cache
    
    if position not in logo_cache:
        if not os.path.exists(logo_path):
            return frame
            
        logo = cv2.imread(logo_path, cv2.IMREAD_UNCHANGED)
        if logo is None:
            return frame
            
        h_frame, w_frame = frame.shape[:2]
        fixed_logo_width = min(int(w_frame * 0.15), 180)
        scale_factor = fixed_logo_width / logo.shape[1]
        logo = cv2.resize(logo, (0, 0), fx=scale_factor, fy=scale_factor, interpolation=cv2.INTER_AREA)
        logo_cache[position] = logo
    else:
        logo = logo_cache[position]

    h_logo, w_logo = logo.shape[:2]
    x, y = {
        "top-left": (10, 10),
        "top-right": (w_frame - w_logo - 10, 10),
        "bottom-left": (10, h_frame - h_logo - 10),
        "bottom-right": (w_frame - w_logo - 10, h_frame - h_logo - 10),
    }.get(position, (10, 10))

    if x < 0 or y < 0 or x + w_logo > w_frame or y + h_logo > h_frame:
        return frame

    overlay = frame.copy()
    if logo.shape[2] == 4:
        alpha = logo[:, :, 3] / 255.0
        for c in range(3):
            overlay[y:y+h_logo, x:x+w_logo, c] = (
                alpha * logo[:, :, c] + (1 - alpha) * overlay[y:y+h_logo, x:x+w_logo, c]
            )
    else:
        overlay[y:y+h_logo, x:x+w_logo] = logo
    return overlay

def encode_video_with_fixed_fps(input_path, output_path, target_fps=30):
    """Encode video using hardware acceleration."""
    try:
        cmd = [
            "ffmpeg", "-i", input_path,
            "-filter:v", f"fps={target_fps}",
            "-c:v", HARDWARE_ENCODER,  # Use hardware encoder
            "-preset", "ultrafast",  # Faster encoding
            "-b:v", "2M",  # Bitrate
            "-c:a", "aac",
            "-b:a", "128k",
            "-y", output_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            log(f"Error encoding video: {result.stderr}", LogLevel.ERROR)
            return False
        return True
    except Exception as e:
        log(f"Failed to encode video: {str(e)}", LogLevel.ERROR)
        return False

def prepend_intro(intro_path, main_path, output_path):
    """Optimized version using hardware acceleration."""
    temp_dir = "temp_processing"
    try:
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
        os.makedirs(temp_dir, exist_ok=True)
        
        temp_intro = os.path.join(temp_dir, "temp_intro.mp4")
        temp_main = os.path.join(temp_dir, "temp_main.mp4")
        
        # Process intro video with hardware acceleration
        intro_cmd = [
            "ffmpeg", "-i", intro_path,
            "-c:v", HARDWARE_ENCODER,
            "-preset", "ultrafast",
            "-b:v", "2M",
            "-c:a", "aac",
            "-b:a", "128k",
            "-y", temp_intro
        ]
        subprocess.run(intro_cmd, capture_output=True)
        
        # Process main video
        if not encode_video_with_fixed_fps(main_path, temp_main):
            return False
        
        # Create file list for concatenation
        list_file = os.path.join(temp_dir, "list.txt")
        with open(list_file, "w") as f:
            f.write(f"file '{os.path.abspath(temp_intro)}'\n")
            f.write(f"file '{os.path.abspath(temp_main)}'\n")
        
        # Merge videos
        merge_cmd = [
            "ffmpeg",
            "-f", "concat",
            "-safe", "0",
            "-i", list_file,
            "-c:v", HARDWARE_ENCODER,
            "-preset", "ultrafast",
            "-b:v", "2M",
            "-c:a", "aac",
            "-b:a", "128k",
            "-y", output_path
        ]
        subprocess.run(merge_cmd, capture_output=True)
        
        shutil.rmtree(temp_dir)
        return True
    except Exception as e:
        log(f"Failed to prepend intro: {str(e)}", LogLevel.ERROR)
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
        return False

def detect_moving_circle(frame, prev_frame):
    """Optimized ball detection."""
    if prev_frame is None:
        return None, None
        
    # Convert to grayscale
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    prev_gray = cv2.cvtColor(prev_frame, cv2.COLOR_BGR2GRAY)
    
    # Calculate absolute difference
    diff = cv2.absdiff(gray, prev_gray)
    
    # Apply threshold
    _, thresh = cv2.threshold(diff, 25, 255, cv2.THRESH_BINARY)
    
    # Find contours
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        return None, None
        
    # Find the largest contour
    largest_contour = max(contours, key=cv2.contourArea)
    
    # Calculate circularity
    area = cv2.contourArea(largest_contour)
    perimeter = cv2.arcLength(largest_contour, True)
    circularity = 4 * np.pi * area / (perimeter * perimeter) if perimeter > 0 else 0
    
    if circularity > 0.7:  # More circular
        (x, y), radius = cv2.minEnclosingCircle(largest_contour)
        return (int(x), int(y)), int(radius)
    
    return None, None

def create_focused_frame(frame, center, radius, zoom_factor=1.5):
    if center is None or radius is None:
        return frame
    
    height, width = frame.shape[:2]
    
    # Calculate the region of interest with wider view
    roi_size = int(radius * zoom_factor * 3)  # Increased multiplier for wider view
    
    # Ensure ROI size is not too small
    min_roi_size = 400  # Increased minimum size for better gameplay view
    roi_size = max(roi_size, min_roi_size)
    
    # Calculate ROI boundaries with smooth transitions
    x1 = max(0, center[0] - roi_size)
    y1 = max(0, center[1] - roi_size)
    x2 = min(width, center[0] + roi_size)
    y2 = min(height, center[1] + roi_size)
    
    # Ensure ROI has valid dimensions
    if x2 <= x1 or y2 <= y1:
        return frame
    
    # Extract the region of interest
    try:
        roi = frame[y1:y2, x1:x2]
        if roi.size == 0:
            return frame
            
        # Resize the ROI to the original frame size with smooth interpolation
        focused_frame = cv2.resize(roi, (width, height), interpolation=cv2.INTER_LINEAR)
        return focused_frame
    except Exception as e:
        log(f"Error in create_focused_frame: {str(e)}", LogLevel.ERROR)
        return frame

def get_current_active_booking():
    """Get the currently active booking based on current time."""
    now = datetime.datetime.now()
    today = now.strftime("%Y-%m-%d")
    current_time = now.strftime("%H:%M")
    
    try:
        # Get today's bookings
        response = supabase.table("bookings").select("*").eq("user_id", USER_ID).eq("date", today).order("start_time").execute()
        
        if not response.data:
            return None
            
        # Find the booking that is currently active
        for booking in response.data:
            start_time = datetime.datetime.strptime(f"{booking['date']} {booking['start_time']}", "%Y-%m-%d %H:%M")
            end_time = datetime.datetime.strptime(f"{booking['date']} {booking['end_time']}", "%Y-%m-%d %H:%M")
            
            if start_time <= now <= end_time:
                log(f"Found active booking: {booking['id']} ({booking['start_time']}-{booking['end_time']})", LogLevel.INFO)
                return booking
                
        return None
    except Exception as e:
        log(f"Error fetching current booking: {str(e)}", LogLevel.ERROR)
        return None

def remove_finished_booking(booking_id):
    """Remove a finished booking from the database."""
    try:
        supabase.table("bookings").delete().eq("id", booking_id).execute()
        log(f"Removed finished booking {booking_id} from database", LogLevel.SUCCESS)
        return True
    except Exception as e:
        log(f"Error removing finished booking {booking_id}: {str(e)}", LogLevel.ERROR)
        return False

def process_and_upload_video(video_path, booking_id):
    """Process video and add to upload queue."""
    try:
        if not os.path.exists(video_path):
            log(f"Video file not found: {video_path}", LogLevel.ERROR)
            return False
            
        # Generate filename based on booking info
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"recording_{timestamp}_{booking_id}.mp4"
        
        # Add to upload queue with booking_id
        upload_queue.put((video_path, USER_ID, filename, booking_id))
        log(f"Added video to upload queue: {filename}", LogLevel.SUCCESS)
        return True
        
    except Exception as e:
        log(f"Error processing video for upload: {str(e)}", LogLevel.ERROR)
        return False

def upload_worker():
    """Optimized upload worker with retry logic."""
    while not shutting_down:
        try:
            task = upload_queue.get(timeout=1)
            if task is None or len(task) != 4:
                continue
                
            local_path, user_id, filename, booking_id = task
            
            # Check for stop signal
            if local_path is None and user_id is None:
                log("Upload worker received stop signal", LogLevel.INFO)
                break
                
            if local_path is None:
                continue
                
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    with open(local_path, 'rb') as f:
                        storage_path = f"videos/{user_id}/{filename}"
                        supabase.storage.from_("videos").upload(storage_path, f)
                        
                    insert_video_reference(user_id, filename, storage_path, booking_id)
                    cleanup_local_file(local_path)
                    log(f"Successfully uploaded and processed: {filename}", LogLevel.SUCCESS)
                    break
                except Exception as e:
                    if attempt == max_retries - 1:
                        log(f"Failed to upload after {max_retries} attempts: {str(e)}", LogLevel.ERROR)
                    else:
                        time.sleep(2 ** attempt)  # Exponential backoff
                        
        except queue.Empty:
            continue
        except Exception as e:
            log(f"Upload worker error: {str(e)}", LogLevel.ERROR)
            time.sleep(1)
    
    log("Upload worker shutting down", LogLevel.INFO)

def start_recording():
    """Start recording with hardware acceleration and robust error handling."""
    try:
        # Use libcamera-vid with hardware encoding
        cmd = [
            "libcamera-vid",
            "-t", "0",
            "--width", str(RECORD_WIDTH),
            "--height", str(RECORD_HEIGHT),
            "--framerate", str(RECORD_FPS),
            "--codec", "h264",
            "--inline",
            "--nopreview",
            "-o", "recording.h264"
        ]
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        # Wait briefly to see if process fails immediately
        time.sleep(2)
        if process.poll() is not None and process.returncode != 0:
            # Process exited with error, capture stderr
            _, stderr = process.communicate()
            log(f"libcamera-vid failed to start. Return code: {process.returncode}. Error: {stderr.decode().strip()}", LogLevel.ERROR)
            return None
        return process
    except Exception as e:
        log(f"Failed to start recording: {str(e)}", LogLevel.ERROR)
        return None

def update_camera_status(camera_on, is_recording):
    data = {
        "id": os.getenv("CAMERA_ID"),
        "user_id": USER_ID,
        "name": os.getenv("CAMERA_NAME", "Camera"),
        "location": os.getenv("CAMERA_LOCATION", ""),
        "camera_on": camera_on,
        "is_recording": is_recording,
        "last_seen": datetime.datetime.utcnow().isoformat(),
        "ip_address": get_ip(),
        "pi_active": True,  # Set the new variable to True when script is running
    }
    # Commented out to reduce terminal output
    # print(f"[{datetime.datetime.utcnow().isoformat()}] Upserting camera data: {data}")
    supabase.table("cameras").upsert(data).execute()

def get_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return None

def insert_video_reference(user_id, filename, storage_path, booking_id):
    now = datetime.datetime.now().isoformat()
    try:
        video_data = {
            "user_id": user_id,
            "filename": filename,
            "storage_path": storage_path,
            "created_at": now
        }
        
        # Add booking_id if provided
        if booking_id:
            video_data["booking_id"] = booking_id
            
        supabase.table("videos").insert(video_data).execute()
        log(f"Added video reference for {filename} (booking: {booking_id})", LogLevel.SUCCESS)
        return True
    except Exception as e:
        log(f"Database insert failed: {str(e)}", LogLevel.WARNING)
        return False

def cleanup_local_file(file_path):
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            log(f"Cleaned up local file: {file_path}", LogLevel.SUCCESS)
            return True
    except Exception as e:
        log(f"Failed to cleanup local file {file_path}: {str(e)}", LogLevel.ERROR)
    return False

def handle_shutdown(signum, frame):
    """Handle shutdown signals gracefully."""
    global shutting_down
    log("Received shutdown signal, initiating graceful shutdown...", LogLevel.INFO)
    shutting_down = True

# Register signal handlers
signal.signal(signal.SIGINT, handle_shutdown)
signal.signal(signal.SIGTERM, handle_shutdown)

def main():
    """Main function with optimized video processing using CameraInterface."""
    global shutting_down

    # Start heartbeat thread
    start_heartbeat_thread()

    # Start upload worker
    upload_thread = threading.Thread(target=upload_worker, daemon=True)
    upload_thread.start()

    # Camera initialization with CameraInterface
    try:
        camera = CameraInterface(
            width=PREVIEW_WIDTH,
            height=PREVIEW_HEIGHT,
            fps=PREVIEW_FPS,
            output_dir="temp"
        )
        log(f"Camera initialized and opened with CameraInterface ({camera.camera_type})", LogLevel.SUCCESS)
        # Set pi_active to True at startup
        update_camera_status(camera_on=True, is_recording=False)
        send_heartbeat(is_recording=False)
    except Exception as e:
        log(f"Failed to initialize CameraInterface: {e}", LogLevel.ERROR)
        return

    prev_frame = None
    last_booking_check = 0
    BOOKING_CHECK_INTERVAL = 30  # check every 30 seconds for bookings
    status_update_interval = 60  # Update status every 60 seconds instead of 15
    last_status_update = 0
    current_booking = None
    recording = False
    recording_path = None

    try:
        while not shutting_down:
            frame = camera.capture_frame()
            if frame is None:
                log("Failed to read frame from camera", LogLevel.ERROR)
                continue
                
            # Resize frame for preview
            frame = cv2.resize(frame, (PREVIEW_WIDTH, PREVIEW_HEIGHT))
            
            # Ball detection (only on preview resolution)
            center, radius = detect_moving_circle(frame, prev_frame)
            prev_frame = frame.copy()
            
            # Check bookings periodically
            current_time = time.time()
            if current_time - last_booking_check > BOOKING_CHECK_INTERVAL:
                new_booking = get_current_active_booking()
                
                # Handle booking changes
                if new_booking and (not current_booking or new_booking['id'] != current_booking['id']):
                    # New booking started
                    if recording and current_booking:
                        # Stop current recording
                        log(f"Stopping recording for previous booking: {current_booking['id']}", LogLevel.INFO)
                        recording_path = camera.stop_recording()
                        recording = False
                        
                        # Process and upload the video
                        if recording_path:
                            process_and_upload_video(recording_path, current_booking['id'])
                        
                        # Remove the finished booking
                        remove_finished_booking(current_booking['id'])
                    
                    # Start new recording
                    log(f"Starting recording for new booking: {new_booking['id']}", LogLevel.SUCCESS)
                    recording_path = camera.start_recording()
                    recording = True
                    current_booking = new_booking
                    # Update heartbeat immediately when recording state changes
                    send_heartbeat(is_recording=True)
                    
                elif not new_booking and recording and current_booking:
                    # Current booking ended
                    log(f"Booking {current_booking['id']} ended, stopping recording", LogLevel.INFO)
                    recording_path = camera.stop_recording()
                    recording = False
                    
                    # Process and upload the video
                    if recording_path:
                        process_and_upload_video(recording_path, current_booking['id'])
                    
                    # Remove the finished booking
                    remove_finished_booking(current_booking['id'])
                    current_booking = None
                    # Update heartbeat immediately when recording state changes
                    send_heartbeat(is_recording=False)
                
                last_booking_check = current_time
            
            # Throttle status update - only update every 60 seconds
            if current_time - last_status_update > status_update_interval:
                update_camera_status(camera_on=True, is_recording=recording)
                last_status_update = current_time
                
            # Process frame (skip if not needed)
            if center and radius:
                frame = create_focused_frame(frame, center, radius)
            
            # Overlay logos (cached)
            settings = get_user_settings()
            for position, logo_path in settings.get("logos", {}).items():
                frame = overlay_logo(frame, logo_path, position)
            
            # Show frame (only in debug mode)
            if os.getenv("DEBUG", "false").lower() == "true":
                cv2.imshow("Preview", frame)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
                    
    except KeyboardInterrupt:
        log("Received keyboard interrupt", LogLevel.INFO)
    except Exception as e:
        log(f"Main loop error: {str(e)}", LogLevel.ERROR)
    finally:
        log("Shutting down gracefully...", LogLevel.INFO)
        if recording:
            log("Stopping recording and processing final video...", LogLevel.INFO)
            recording_path = camera.stop_recording()
            if recording_path and current_booking:
                process_and_upload_video(recording_path, current_booking['id'])
        camera.release()
        cv2.destroyAllWindows()
        update_camera_status(camera_on=False, is_recording=False)
        stop_heartbeat_thread()
        
        # Wait for upload queue to finish
        log("Waiting for upload queue to finish...", LogLevel.INFO)
        upload_queue.put((None, None, None, None))  # Signal upload worker to stop
        upload_thread.join(timeout=10)
        log("Shutdown complete", LogLevel.SUCCESS)

if __name__ == "__main__":
    main()
