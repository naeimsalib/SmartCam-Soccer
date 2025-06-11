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

class LogLevel(Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    SUCCESS = "SUCCESS"

def log(message, level=LogLevel.INFO):
    timestamp = datetime.datetime.now().strftime("%H:%M:%S")
    color_codes = {
        LogLevel.INFO: "\033[94m",  # Blue
        LogLevel.WARNING: "\033[93m",  # Yellow
        LogLevel.ERROR: "\033[91m",  # Red
        LogLevel.SUCCESS: "\033[92m",  # Green
    }
    reset = "\033[0m"
    print(f"{color_codes[level]}[{timestamp}] {level.value}: {message}{reset}")

CAMERA_INDEX = 0

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
USER_ID = os.getenv("USER_ID")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
upload_queue = queue.Queue()

# Add a global flag to indicate shutdown
shutting_down = False

def handle_shutdown(signum, frame):
    global shutting_down
    shutting_down = True
    print("[INFO] Caught shutdown signal, marking camera offline...")
    update_camera_status(camera_on=False, is_recording=False)
    exit(0)

# Register signal handlers
signal.signal(signal.SIGINT, handle_shutdown)
signal.signal(signal.SIGTERM, handle_shutdown)

def get_user_settings():
    response = supabase.table("user_settings").select("*").eq("user_id", USER_ID).single().execute()
    return response.data if response.data else {}

def download_file_from_supabase(path, local_filename):
    try:
        file_data = supabase.storage.from_("usermedia").download(path)
        with open(local_filename, "wb") as f:
            f.write(file_data)
        return True
    except Exception as e:
        log(f"Failed to download {path}: {str(e)}", LogLevel.ERROR)
        return False

def overlay_logo(frame, logo_path, position):
    if not os.path.exists(logo_path):
        return frame
    logo = cv2.imread(logo_path, cv2.IMREAD_UNCHANGED)
    if logo is None:
        return frame

    h_frame, w_frame = frame.shape[:2]
    scale_factor = min((w_frame * 0.15) / logo.shape[1], 1.0)
    logo = cv2.resize(logo, (0, 0), fx=scale_factor, fy=scale_factor)

    h_logo, w_logo = logo.shape[:2]
    x, y = {
        "top-left": (10, 10),
        "top-right": (w_frame - w_logo - 10, 10),
        "bottom-left": (10, h_frame - h_logo - 10),
        "bottom-right": (w_frame - w_logo - 10, h_frame - h_logo - 10),
    }.get(position, (10, 10))

    if logo.shape[2] == 4:
        alpha = logo[:, :, 3] / 255.0
        for c in range(3):
            frame[y:y+h_logo, x:x+w_logo, c] = (alpha * logo[:, :, c] +
                                                (1 - alpha) * frame[y:y+h_logo, x:x+w_logo, c])
    else:
        frame[y:y+h_logo, x:x+w_logo] = logo
    return frame

def format_video_filename(booking_date, booking_time, user_id):
    # Convert date and time to a more readable format
    date_obj = datetime.datetime.strptime(booking_date, "%Y-%m-%d")
    time_obj = datetime.datetime.strptime(booking_time, "%H:%M")
    
    formatted_date = date_obj.strftime("%Y%m%d")
    formatted_time = time_obj.strftime("%H%M")
    
    return f"recording_{formatted_date}_{formatted_time}_{user_id}.mp4"

def prepend_intro(intro_path, main_path, output_path):
    temp_dir = "temp_processing"
    try:
        # Create a temporary directory for processing
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
        os.makedirs(temp_dir, exist_ok=True)
        
        # First, ensure both videos are properly encoded with the same parameters
        temp_intro = os.path.join(temp_dir, "temp_intro.mp4")
        temp_main = os.path.join(temp_dir, "temp_main.mp4")
        
        # Get the frame rate and resolution from the main video
        probe_cmd = ["ffprobe", "-v", "error", "-select_streams", "v:0",
                    "-show_entries", "stream=width,height,r_frame_rate", "-of", "json", main_path]
        probe_result = subprocess.run(probe_cmd, capture_output=True, text=True)
        video_info = json.loads(probe_result.stdout)
        width = video_info['streams'][0]['width']
        height = video_info['streams'][0]['height']
        frame_rate = eval(video_info['streams'][0]['r_frame_rate'])  # e.g., "30000/1001" -> 29.97
        
        # Encode intro video to match main video parameters
        subprocess.run([
            "ffmpeg", "-i", intro_path,
            "-vf", f"scale={width}:{height}",
            "-r", str(frame_rate),
            "-c:v", "libx264", "-preset", "medium", "-crf", "23",
            "-c:a", "aac", "-b:a", "128k",
            "-y", temp_intro
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Encode main video with slowdown
        subprocess.run([
            "ffmpeg", "-i", main_path,
            "-vf", "setpts=1.96*PTS",  # Slow down video
            "-af", "atempo=0.51",  # Slow down audio to match
            "-c:v", "libx264", "-preset", "medium", "-crf", "23",
            "-c:a", "aac", "-b:a", "128k",
            "-vsync", "cfr",  # Constant frame rate
            "-y", temp_main
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Create a file list for FFmpeg
        list_file = os.path.join(temp_dir, "list.txt")
        with open(list_file, "w") as f:
            f.write(f"file '{os.path.abspath(temp_intro)}'\n")
            f.write(f"file '{os.path.abspath(temp_main)}'\n")
        
        # Merge videos using the concat demuxer
        subprocess.run([
            "ffmpeg",
            "-f", "concat",
            "-safe", "0",
            "-i", list_file,
            "-c", "copy",  # Copy streams without re-encoding
            "-y", output_path
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Cleanup temporary files
        try:
            # Remove individual files first
            for file in [temp_intro, temp_main, list_file]:
                if os.path.exists(file):
                    os.remove(file)
                    # Also try to remove any associated macOS hidden files
                    hidden_file = os.path.join(os.path.dirname(file), f"._{os.path.basename(file)}")
                    if os.path.exists(hidden_file):
                        try:
                            os.remove(hidden_file)
                        except:
                            pass
            
            # Remove any remaining macOS hidden files in the directory
            for file in os.listdir(temp_dir):
                if file.startswith('._'):
                    try:
                        os.remove(os.path.join(temp_dir, file))
                    except:
                        pass
            
            # Finally remove the directory
            os.rmdir(temp_dir)
        except Exception as e:
            log(f"Warning during cleanup: {str(e)}", LogLevel.WARNING)
            # Continue even if cleanup fails
            
        return True
    except Exception as e:
        log(f"Failed to merge videos: {str(e)}", LogLevel.ERROR)
        # Attempt cleanup even if there was an error
        try:
            if os.path.exists(temp_dir):
                # Remove individual files first
                for file in os.listdir(temp_dir):
                    try:
                        file_path = os.path.join(temp_dir, file)
                        if os.path.isfile(file_path):
                            os.remove(file_path)
                        # Also try to remove any associated macOS hidden files
                        hidden_file = os.path.join(temp_dir, f"._{file}")
                        if os.path.exists(hidden_file):
                            os.remove(hidden_file)
                    except:
                        pass
                # Remove the directory
                os.rmdir(temp_dir)
        except:
            pass
        return False

def get_upcoming_bookings():
    now = datetime.datetime.now()
    today = now.strftime("%Y-%m-%d")
    current_time = now.strftime("%H:%M")
    
    try:
        # Get today's bookings that haven't ended yet
        response = supabase.table("bookings").select("*").eq("user_id", USER_ID).eq("date", today).gte("end_time", current_time).order("start_time").execute()
        
        # Get future bookings
        future_response = supabase.table("bookings").select("*").eq("user_id", USER_ID).gt("date", today).order("date").order("start_time").execute()
        
        # Combine and sort all bookings
        all_bookings = response.data + future_response.data
        return sorted(all_bookings, key=lambda x: (x['date'], x['start_time']))
    except Exception as e:
        log(f"Error fetching bookings: {str(e)}", LogLevel.ERROR)
        return []  # Return empty list on error

def wait_for_camera(camera_index=None, max_retries=5, retry_delay=5):
    for attempt in range(max_retries):
        try:
            # Test if we can access the camera using libcamera-vid (for HQ Camera)
            test_cmd = "libcamera-vid -t 1000 -o test.h264"
            result = subprocess.run(test_cmd, shell=True, capture_output=True, text=True)
            if result.returncode == 0:
                log("Camera initialized successfully with libcamera-vid", LogLevel.SUCCESS)
                # Clean up test file
                if os.path.exists("test.h264"):
                    os.remove("test.h264")
                return True
            else:
                log(f"Camera test failed. Error: {result.stderr}", LogLevel.WARNING)
                # Try to get camera status
                try:
                    camera_status = subprocess.run("libcamera-hello --list-cameras", shell=True, capture_output=True, text=True)
                    log(f"Camera status: {camera_status.stdout}", LogLevel.INFO)
                except Exception as e:
                    log(f"Could not get camera status: {str(e)}", LogLevel.WARNING)
        except Exception as e:
            log(f"Camera not found. Retrying in {retry_delay} seconds... (Attempt {attempt + 1}/{max_retries}) - {e}", LogLevel.WARNING)
            time.sleep(retry_delay)
    return None

def detect_moving_circle(frame, prev_frame):
    if prev_frame is None:
        return None, None
    
    # Convert frames to grayscale
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    prev_gray = cv2.cvtColor(prev_frame, cv2.COLOR_BGR2GRAY)
    
    # Apply stronger Gaussian blur to reduce noise
    gray = cv2.GaussianBlur(gray, (15, 15), 0)  # Increased blur for more stable detection
    prev_gray = cv2.GaussianBlur(prev_gray, (15, 15), 0)
    
    # Calculate frame difference
    frame_diff = cv2.absdiff(gray, prev_gray)
    
    # Apply higher threshold to only detect significant movement
    _, thresh = cv2.threshold(frame_diff, 40, 255, cv2.THRESH_BINARY)  # Increased threshold
    
    # Apply stronger morphological operations to reduce noise
    kernel = np.ones((15,15), np.uint8)  # Larger kernel for more stable regions
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    
    # Find contours in the thresholded image
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Sort contours by area and only process the largest ones
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:2]  # Only look at top 2 largest movements
    
    best_contour = None
    best_score = 0
    
    for contour in contours:
        area = cv2.contourArea(contour)
        if 200 < area < 5000:  # Much larger area range for gameplay
            # Get the bounding circle
            (x, y), radius = cv2.minEnclosingCircle(contour)
            center = (int(x), int(y))
            radius = int(radius)
            
            # Calculate circularity
            perimeter = cv2.arcLength(contour, True)
            if perimeter > 0:
                circularity = 4 * np.pi * area / (perimeter * perimeter)
                
                # Calculate score based on circularity and size
                size_score = 1 - abs(area - 1000) / 5000  # Prefer larger areas
                shape_score = circularity
                score = size_score * shape_score
                
                if 0.5 < circularity < 1.5 and score > best_score:  # Much more relaxed circularity
                    best_score = score
                    best_contour = (center, radius)
    
    return best_contour if best_contour else (None, None)

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

class BallTracker:
    def __init__(self):
        self.kalman = cv2.KalmanFilter(4, 2)
        self.kalman.measurementMatrix = np.array([[1, 0, 0, 0],
                                                [0, 1, 0, 0]], np.float32)
        self.kalman.transitionMatrix = np.array([[1, 0, 1, 0],
                                               [0, 1, 0, 1],
                                               [0, 0, 1, 0],
                                               [0, 0, 0, 1]], np.float32)
        # Reduce process noise for more stable tracking
        self.kalman.processNoiseCov = np.array([[1, 0, 0, 0],
                                              [0, 1, 0, 0],
                                              [0, 0, 1, 0],
                                              [0, 0, 0, 1]], np.float32) * 0.03
        self.last_measurement = None
        self.last_prediction = None
        self.tracking_lost_count = 0
        self.max_tracking_lost = 20  # Increased persistence
        self.last_radius = 30  # Increased default radius
        self.min_detection_confidence = 0.3
        self.last_positions = []  # Store last few positions for smoothing
        self.max_positions = 10   # Increased number of positions to average

def upload_video_to_supabase(local_path, user_id, filename):
    storage_path = f"{user_id}/{filename}"
    try:
        with open(local_path, "rb") as f:
            supabase.storage.from_("videos").upload(storage_path, f, {"content-type": "video/mp4"})
        log(f"Uploaded {filename}", LogLevel.SUCCESS)
        return storage_path
    except Exception as e:
        log(f"Upload failed: {str(e)}", LogLevel.ERROR)
        return None

def insert_video_reference(user_id, filename, storage_path, booking_id):
    now = datetime.datetime.now().isoformat()
    try:
        supabase.table("videos").insert({
            "user_id": user_id,
            "filename": filename,
            "storage_path": storage_path,
            "created_at": now
        }).execute()
        log(f"Added video reference for {filename}", LogLevel.SUCCESS)
        return True
    except Exception as e:
        log(f"Database insert failed: {str(e)}", LogLevel.WARNING)
        return True

def cleanup_local_file(file_path):
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            log(f"Cleaned up local file: {file_path}", LogLevel.SUCCESS)
            return True
    except Exception as e:
        log(f"Failed to cleanup local file {file_path}: {str(e)}", LogLevel.ERROR)
    return False

def upload_worker():
    while True:
        try:
            task = upload_queue.get()
            if task is None:
                break
                
            user_id, final_video_path, booking_id = task
            if not all([user_id, final_video_path, booking_id]):
                continue
                
            try:
                # Upload the video
                storage_path = upload_video_to_supabase(final_video_path, user_id, os.path.basename(final_video_path))
                
                if storage_path:
                    # If upload was successful, add to database
                    if insert_video_reference(user_id, os.path.basename(final_video_path), storage_path, booking_id):
                        # Only cleanup local files after successful upload and database insert
                        cleanup_local_file(final_video_path)
                        
                        # Also cleanup the original recording file if it exists
                        original_recording = final_video_path.replace("final_", "")
                        if os.path.exists(original_recording):
                            cleanup_local_file(original_recording)
                else:
                    log(f"Keeping local file {final_video_path} due to failed upload", LogLevel.WARNING)
                    
            except Exception as e:
                log(f"Upload worker error: {str(e)}", LogLevel.ERROR)
            finally:
                upload_queue.task_done()
        except Exception as e:
            log(f"Upload worker critical error: {str(e)}", LogLevel.ERROR)
            time.sleep(1)  # Prevent tight loop on errors

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
    }
    print(f"[{datetime.datetime.utcnow().isoformat()}] Upserting camera data: {data}")
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

def start_recording():
    global recording_process
    if recording_process is None:
        try:
            # Use raspivid for video capture and ffmpeg with h264_omx for hardware acceleration
            cmd = f"raspivid -t 0 -w 1280 -h 720 -fps 30 -o - | ffmpeg -f h264 -i - -f v4l2 -vcodec h264_omx -pix_fmt yuv420p /dev/video36"
            recording_process = subprocess.Popen(cmd, shell=True)
            log("Recording started", LogLevel.INFO)
        except Exception as e:
            log(f"Error starting recording: {str(e)}", LogLevel.ERROR)
            recording_process = None

def main():
    log("Initializing SmartCam...", LogLevel.INFO)
    
    # Start upload worker thread
    upload_thread = threading.Thread(target=upload_worker, daemon=True)
    upload_thread.start()
    
    # First, initialize the camera
    camera_ready = wait_for_camera()
    if not camera_ready:
        log("Failed to connect to camera. Exiting...", LogLevel.ERROR)
        return
    log("Camera connected successfully", LogLevel.SUCCESS)
    time.sleep(2)  # Give the camera time to stabilize
    
    # Initialize ball tracker
    ball_tracker = BallTracker()
    
    # Now that camera is initialized, clean up any leftover videos
    # try:
    #     log("Checking for leftover videos...", LogLevel.INFO)
    #     cleanup_leftover_videos()
    # except Exception as e:
    #     log(f"Error during cleanup: {str(e)}", LogLevel.ERROR)
    #     # Continue even if cleanup fails
    
    # Create user assets directory
    os.makedirs("user_assets", exist_ok=True)
    
    # Load user settings and assets
    try:
        user_settings = get_user_settings()
        local_logos = {}

        log("Loading user assets...", LogLevel.INFO)
        for key, pos in zip(['logo_path', 'sponsor_logo1_path', 'sponsor_logo2_path', 'sponsor_logo3_path'],
                            ['top-right', 'bottom-left', 'bottom-right', 'top-left']):
            if user_settings.get(key):
                filename = os.path.join("user_assets", f"media_{key}.png")
                if download_file_from_supabase(user_settings[key], filename):
                    local_logos[pos] = filename

        intro_local = None
        if user_settings.get("intro_video_path"):
            intro_local = os.path.join("user_assets", "intro_video.mp4")
            download_file_from_supabase(user_settings["intro_video_path"], intro_local)

        log("SmartCam is ready", LogLevel.SUCCESS)
    except Exception as e:
        log(f"Error loading user assets: {str(e)}", LogLevel.ERROR)
        # Continue with default settings if asset loading fails
        user_settings = {}
        local_logos = {}
        intro_local = None
    
    # Set up video writer with explicit frame rate
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    fps = 30  # Standard frame rate for real-time recording
    out, recording = None, False
    appointments = []
    active_appt_id = None
    last_check_time = 0
    current_filename = None
    recording_start_time = None
    buffer_time = datetime.timedelta(seconds=2)  # 2 second buffer
    
    # Initialize variables for motion tracking
    prev_frame = None
    ball_tracking_active = False
    last_ball_detection = None
    ball_tracking_timeout = 2.0  # seconds to wait before resetting tracking
    last_ball_time = time.time()
    last_status_update = 0

    # Start the video capture process for HQ Camera
    video_cmd = "libcamera-vid -t 0 --width 1280 --height 720 --framerate 30 --codec yuv420 --inline --nopreview -o - | ffmpeg -f rawvideo -pix_fmt yuv420p -s 1280x720 -i - -f rawvideo -pix_fmt bgr24 -"
    video_process = subprocess.Popen(video_cmd, shell=True, stdout=subprocess.PIPE)

    while True:
        try:
            # Read raw video data
            raw_frame = video_process.stdout.read(1280 * 720 * 3)
            if not raw_frame:
                log("Camera disconnected. Attempting to reconnect...", LogLevel.ERROR)
                video_process.terminate()
                if out:
                    out.release()
                cv2.destroyAllWindows()
                time.sleep(5)
                video_process = subprocess.Popen(video_cmd, shell=True, stdout=subprocess.PIPE)
                continue

            # Convert raw data to numpy array
            frame = np.frombuffer(raw_frame, dtype=np.uint8).reshape((720, 1280, 3)).copy()

            now = datetime.datetime.now()
            
            # Motion tracking logic (only active during recording)
            if recording:
                if not ball_tracking_active:
                    log("Motion tracking activated", LogLevel.INFO)
                    ball_tracking_active = True
                
                try:
                    # Detect moving circular objects
                    center, radius = detect_moving_circle(frame, prev_frame)
                    
                    # Update tracker with new measurement
                    tracked_position, tracked_radius = ball_tracker.update(center, radius)
                    
                    if tracked_position is not None:
                        # Apply gentle zoom to follow the object
                        frame = create_focused_frame(frame, tracked_position, tracked_radius)
                        
                        # Draw tracking circle with thickness
                        cv2.circle(frame, tracked_position, tracked_radius, (0, 255, 0), 3)
                        # Draw a crosshair at the center
                        crosshair_size = 10
                        cv2.line(frame, 
                                (tracked_position[0] - crosshair_size, tracked_position[1]),
                                (tracked_position[0] + crosshair_size, tracked_position[1]),
                                (0, 255, 0), 2)
                        cv2.line(frame, 
                                (tracked_position[0], tracked_position[1] - crosshair_size),
                                (tracked_position[0], tracked_position[1] + crosshair_size),
                                (0, 255, 0), 2)
                        last_ball_time = time.time()
                    else:
                        # If no movement detected for too long, reset tracking
                        if time.time() - last_ball_time > ball_tracking_timeout:
                            ball_tracker = BallTracker()  # Reset tracker
                            last_ball_detection = None
                except Exception as e:
                    log(f"Error in motion tracking: {str(e)}", LogLevel.ERROR)
                    # Show normal frame if tracking fails
                    last_ball_detection = None
            else:
                ball_tracking_active = False
                last_ball_detection = None
            
            # Store current frame for next iteration
            prev_frame = frame.copy()
            
            # Add timestamp
            frame = cv2.putText(frame, now.strftime("%Y-%m-%d %H:%M:%S"), (10, 30),
                                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

            for pos, logo_file in local_logos.items():
                frame = overlay_logo(frame, logo_file, pos)

            # Check for new bookings every 30 seconds
            if time.time() - last_check_time > 30:
                try:
                    appointments = get_upcoming_bookings()
                    log(f"Fetched appointments: {appointments}", LogLevel.INFO)
                    last_check_time = time.time()
                except Exception as e:
                    log(f"Error fetching appointments: {str(e)}", LogLevel.ERROR)

            now = datetime.datetime.now()
            log(f"Current time: {now}", LogLevel.INFO)

            # Find current booking
            current_appt = next((a for a in appointments if
                datetime.datetime.strptime(f"{a['date']} {a['start_time']}", "%Y-%m-%d %H:%M") <= now <=
                datetime.datetime.strptime(f"{a['date']} {a['end_time']}", "%Y-%m-%d %H:%M")), None)
            if current_appt:
                log(f"Matched current booking: {current_appt}", LogLevel.INFO)
            else:
                log("No current booking matched.", LogLevel.INFO)

            # Handle booking transitions
            if current_appt and (not recording or current_appt['id'] != active_appt_id):
                # Stop current recording if any
                if recording and out:
                    log(f"Stopping recording for booking {active_appt_id}", LogLevel.INFO)
                    out.release()
                    if current_filename:
                        try:
                            final_output = current_filename
                            if intro_local:
                                merged = f"final_{current_filename}"
                                if prepend_intro(intro_local, current_filename, merged):
                                    if os.path.exists(current_filename):
                                        os.remove(current_filename)
                                    final_output = merged
                            # Queue the upload task
                            upload_queue.put((USER_ID, final_output, active_appt_id))
                        except Exception as e:
                            log(f"Error processing video: {str(e)}", LogLevel.ERROR)
                    recording = False
                    recording_start_time = None
                    ball_tracking_active = False
                    last_ball_detection = None

                # Start new recording
                log(f"Starting recording for booking {current_appt['id']}", LogLevel.SUCCESS)
                active_appt_id = current_appt['id']
                current_filename = format_video_filename(
                    current_appt['date'],
                    current_appt['start_time'],
                    USER_ID
                )
                out = cv2.VideoWriter(current_filename, fourcc, fps, (frame.shape[1], frame.shape[0]))
                recording = True
                recording_start_time = now
                ball_tracker = BallTracker()  # Reset tracker for new recording

            # Handle end of booking
            elif not current_appt and recording:
                log("Stopping recording (no current appointment)", LogLevel.INFO)
                out.release()
                if current_filename:
                    try:
                        final_output = current_filename
                        if intro_local:
                            merged = f"final_{current_filename}"
                            if prepend_intro(intro_local, current_filename, merged):
                                if os.path.exists(current_filename):
                                    os.remove(current_filename)
                                final_output = merged
                        # Queue the upload task
                        upload_queue.put((USER_ID, final_output, active_appt_id))
                    except Exception as e:
                        log(f"Error processing video: {str(e)}", LogLevel.ERROR)
                recording = False
                active_appt_id = None
                current_filename = None
                recording_start_time = None
                ball_tracking_active = False
                last_ball_detection = None

            if recording and out:
                out.write(frame)

            cv2.imshow("SmartCam Soccer", frame)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                if recording and out:
                    out.release()
                video_process.terminate()
                cv2.destroyAllWindows()
                upload_queue.put((None, None, None))  # Signal upload worker to stop
                upload_thread.join(timeout=5)  # Wait for upload worker to finish
                log("SmartCam shutdown complete", LogLevel.INFO)
                return

            # Update camera status every 5 seconds
            if time.time() - last_status_update > 5:
                update_camera_status(camera_on=True, is_recording=recording)
                last_status_update = time.time()

            if shutting_down:
                break
        except Exception as e:
            log(f"Error in main loop: {str(e)}", LogLevel.ERROR)
            time.sleep(1)  # Prevent tight loop on errors
            continue

    # On exit, mark camera offline
    update_camera_status(camera_on=False, is_recording=False)

    # If we get here, the camera was disconnected
    video_process.terminate()
    if out:
        out.release()
    cv2.destroyAllWindows()
    upload_queue.put((None, None, None))  # Signal upload worker to stop
    upload_thread.join(timeout=5)  # Wait for upload worker to finish
    log("Attempting to reconnect to camera...", LogLevel.INFO)
    time.sleep(5)  # Wait before attempting to reconnect

if __name__ == "__main__":
    main()
