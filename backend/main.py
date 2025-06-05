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
        
        # Encode main video with significant slowdown to achieve real-time speed
        subprocess.run([
            "ffmpeg", "-i", main_path,
            "-vf", "setpts=2.5*PTS",  # Slow down video significantly
            "-af", "atempo=0.4",  # Slow down audio to match
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

def detect_ball(frame):
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    lower = np.array([10, 100, 100])
    upper = np.array([30, 255, 255])
    mask = cv2.inRange(hsv, lower, upper)
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        largest = max(contours, key=cv2.contourArea)
        ((x, y), radius) = cv2.minEnclosingCircle(largest)
        if radius > 10:
            return int(x), int(y), int(radius)
    return None

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
        task = upload_queue.get()
        if task is None:
            break
        user_id, final_video_path, booking_id = task
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

threading.Thread(target=upload_worker, daemon=True).start()

def get_upcoming_bookings():
    now = datetime.datetime.now()
    today = now.strftime("%Y-%m-%d")
    current_time = now.strftime("%H:%M")
    
    # Get today's bookings that haven't ended yet
    response = supabase.table("bookings").select("*").eq("user_id", USER_ID).eq("date", today).gte("end_time", current_time).order("start_time").execute()
    
    # Get future bookings
    future_response = supabase.table("bookings").select("*").eq("user_id", USER_ID).gt("date", today).order("date").order("start_time").execute()
    
    return response.data + future_response.data

def cleanup_booking(booking_id):
    try:
        supabase.table("bookings").delete().eq("id", booking_id).execute()
        log(f"Cleaned up booking {booking_id}", LogLevel.SUCCESS)
        return True
    except Exception as e:
        log(f"Failed to cleanup booking: {str(e)}", LogLevel.ERROR)
        return False

def wait_for_camera(camera_index, max_retries=5, retry_delay=5):
    for attempt in range(max_retries):
        cap = cv2.VideoCapture(camera_index)
        if cap.isOpened():
            return cap
        log(f"Camera not found. Retrying in {retry_delay} seconds... (Attempt {attempt + 1}/{max_retries})", LogLevel.WARNING)
        time.sleep(retry_delay)
    return None

def cleanup_leftover_videos():
    log("Checking for leftover videos...", LogLevel.INFO)
    try:
        # Get all video files in the current directory
        video_files = [f for f in os.listdir('.') if f.endswith('.mp4')]
        
        for video_file in video_files:
            try:
                # Check if this video is already in the database
                response = supabase.table("videos").select("*").eq("filename", video_file).execute()
                
                if not response.data:  # Video not in database
                    log(f"Found unprocessed video: {video_file}", LogLevel.WARNING)
                    # Try to upload it
                    storage_path = upload_video_to_supabase(video_file, USER_ID, video_file)
                    if storage_path:
                        # If upload successful, add to database
                        if insert_video_reference(USER_ID, video_file, storage_path, None):
                            log(f"Successfully processed leftover video: {video_file}", LogLevel.SUCCESS)
                            cleanup_local_file(video_file)
                        else:
                            log(f"Failed to add video reference to database: {video_file}", LogLevel.ERROR)
                    else:
                        log(f"Failed to upload leftover video: {video_file}", LogLevel.ERROR)
                else:
                    # Video is in database, safe to delete
                    log(f"Found already processed video, cleaning up: {video_file}", LogLevel.INFO)
                    cleanup_local_file(video_file)
                    
            except Exception as e:
                log(f"Error processing leftover video {video_file}: {str(e)}", LogLevel.ERROR)
                
    except Exception as e:
        log(f"Error during leftover video cleanup: {str(e)}", LogLevel.ERROR)

def main():
    log("Initializing SmartCam...", LogLevel.INFO)
    
    # Clean up any leftover videos from previous runs
    cleanup_leftover_videos()
    
    while True:
        cap = wait_for_camera(CAMERA_INDEX)
        if cap is None:
            log("Failed to connect to camera. Retrying...", LogLevel.ERROR)
            time.sleep(5)
            continue
            
        log("Camera connected successfully", LogLevel.SUCCESS)
        time.sleep(2)

        os.makedirs("user_assets", exist_ok=True)
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
        
        # Set up video writer with explicit frame rate
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        fps = 30  # Standard frame rate for real-time recording
        out, recording = None, False
        appointments = []
        active_appt_id = None
        last_check_time = 0
        current_filename = None
        recording_start_time = None
        target_duration = datetime.timedelta(minutes=1)  # 1 minute target
        buffer_time = datetime.timedelta(seconds=2)  # 2 second buffer

        while True:
            ret, frame = cap.read()
            if not ret:
                log("Camera disconnected. Attempting to reconnect...", LogLevel.ERROR)
                break

            now = datetime.datetime.now()
            frame = cv2.putText(frame, now.strftime("%Y-%m-%d %H:%M:%S"), (10, 30),
                                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

            for pos, logo_file in local_logos.items():
                frame = overlay_logo(frame, logo_file, pos)

            if time.time() - last_check_time > 30:
                appointments = get_upcoming_bookings()
                last_check_time = time.time()

            current_appt = next((a for a in appointments if
                datetime.datetime.strptime(f"{a['date']} {a['start_time']}", "%Y-%m-%d %H:%M") <= now <=
                datetime.datetime.strptime(f"{a['date']} {a['end_time']}", "%Y-%m-%d %H:%M")), None)

            if current_appt and (not recording or current_appt['id'] != active_appt_id):
                if recording and out:
                    log(f"Stopping recording for booking {active_appt_id}", LogLevel.INFO)
                    out.release()
                    if current_filename:
                        final_output = current_filename
                        if intro_local:
                            merged = f"final_{current_filename}"
                            if prepend_intro(intro_local, current_filename, merged):
                                os.remove(current_filename)
                                final_output = merged
                        upload_queue.put((USER_ID, final_output, active_appt_id))
                        cleanup_booking(active_appt_id)
                    recording = False
                    recording_start_time = None

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

            elif not current_appt and recording:
                log("Stopping recording (no current appointment)", LogLevel.INFO)
                out.release()
                if current_filename:
                    final_output = current_filename
                    if intro_local:
                        merged = f"final_{current_filename}"
                        if prepend_intro(intro_local, current_filename, merged):
                            os.remove(current_filename)
                            final_output = merged
                    upload_queue.put((USER_ID, final_output, active_appt_id))
                    cleanup_booking(active_appt_id)
                recording = False
                active_appt_id = None
                current_filename = None
                recording_start_time = None

            # Check if we've exceeded the booking duration
            if recording and recording_start_time:
                elapsed_time = now - recording_start_time
                if elapsed_time >= target_duration + buffer_time:
                    log(f"Booking duration reached ({elapsed_time.total_seconds():.1f} seconds recorded)", LogLevel.INFO)
                    out.release()
                    if current_filename:
                        final_output = current_filename
                        if intro_local:
                            merged = f"final_{current_filename}"
                            if prepend_intro(intro_local, current_filename, merged):
                                os.remove(current_filename)
                                final_output = merged
                        upload_queue.put((USER_ID, final_output, active_appt_id))
                        cleanup_booking(active_appt_id)
                    recording = False
                    active_appt_id = None
                    current_filename = None
                    recording_start_time = None

            if recording and out:
                out.write(frame)

            cv2.imshow("SmartCam Soccer", frame)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                if recording and out:
                    out.release()
                cap.release()
                cv2.destroyAllWindows()
                upload_queue.put((None, None, None))
                log("SmartCam shutdown complete", LogLevel.INFO)
                return

        # If we get here, the camera was disconnected
        cap.release()
        if out:
            out.release()
        cv2.destroyAllWindows()
        log("Attempting to reconnect to camera...", LogLevel.INFO)
        time.sleep(5)  # Wait before attempting to reconnect

if __name__ == "__main__":
    main()
