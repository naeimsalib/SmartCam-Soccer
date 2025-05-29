import os
import cv2
import numpy as np
import time
import datetime
from supabase import create_client, Client
from dotenv import load_dotenv
import threading
import queue

# Camera index (change to 1 or 2 if needed)
CAMERA_INDEX = 0

# Load environment variables
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# User info
USER_EMAIL = "naeimsalib@yahoo.com"
USER_ID = "05669d2f-1db4-4f35-8e00-7c3845199361"

# Connect to Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

upload_queue = queue.Queue()

def upload_worker():
    while True:
        user_id, filename = upload_queue.get()
        if filename is None:
            break  # Sentinel to stop the thread
        storage_path = upload_video_to_supabase(filename, user_id, filename)
        if storage_path:
            if insert_video_reference(user_id, filename, storage_path):
                # Delete local file after successful upload and DB insert
                try:
                    os.remove(filename)
                    print(f"Deleted local file: {filename}")
                except Exception as e:
                    print(f"Failed to delete local file {filename}: {e}")
        upload_queue.task_done()

# Start the upload worker thread before the main loop
worker_thread = threading.Thread(target=upload_worker, daemon=True)
worker_thread.start()

# Helper: Get upcoming appointments for this user
def get_upcoming_appointments():
    today = datetime.datetime.now().strftime("%Y-%m-%d")
    response = supabase.table("bookings").select("*") \
        .eq("user_id", USER_ID) \
        .gte("date", today) \
        .order("date", desc=False) \
        .order("start_time", desc=False) \
        .execute()
    return response.data if response.data else []

# Helper: Check if now is within an appointment
def get_current_appointment(appointments):
    now = datetime.datetime.now()
    for appt in appointments:
        appt_date = appt["date"]
        start = appt["start_time"]
        end = appt["end_time"]
        start_dt = datetime.datetime.strptime(f"{appt_date} {start}", "%Y-%m-%d %H:%M")
        end_dt = datetime.datetime.strptime(f"{appt_date} {end}", "%Y-%m-%d %H:%M")
        if start_dt <= now <= end_dt:
            return appt
    return None

# Helper: Check if current recording should end
def should_end_recording(current_appt):
    if not current_appt:
        return True
    
    now = datetime.datetime.now()
    appt_date = current_appt["date"]
    end = current_appt["end_time"]
    end_dt = datetime.datetime.strptime(f"{appt_date} {end}", "%Y-%m-%d %H:%M")
    
    return now >= end_dt

# Helper: Remove completed booking from database
def remove_completed_booking(booking):
    try:
        response = supabase.table("bookings").delete().eq("id", booking["id"]).execute()
        print(f"[{datetime.datetime.now()}] Successfully removed completed booking from database.")
        return True
    except Exception as e:
        print(f"[{datetime.datetime.now()}] Error removing booking from database: {e}")
        return False

# Helper: Ball detection (simple color-based for demo)
def detect_ball(frame):
    # Convert to HSV and threshold for orange/yellow ball (adjust as needed)
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

# Helper: Zoom on ball
def zoom_on_ball(frame, ball):
    x, y, r = ball
    h, w = frame.shape[:2]
    size = int(max(r * 4, 100))
    x1 = max(x - size, 0)
    y1 = max(y - size, 0)
    x2 = min(x + size, w)
    y2 = min(y + size, h)
    crop = frame[y1:y2, x1:x2]
    zoomed = cv2.resize(crop, (w, h), interpolation=cv2.INTER_LINEAR)
    return zoomed

# Add this helper function after remove_completed_booking
def upload_video_to_supabase(local_path, user_id, filename):
    storage_path = f"{user_id}/{filename}"
    try:
        with open(local_path, "rb") as f:
            res = supabase.storage.from_("videos").upload(storage_path, f, {"content-type": "video/mp4"})
        print(f"Uploaded {filename} to Supabase storage at {storage_path}")
        return storage_path
    except Exception as e:
        print(f"Failed to upload video: {e}")
        return None

# Add this helper to insert a reference in the videos table
def insert_video_reference(user_id, filename, storage_path):
    try:
        now = datetime.datetime.now().isoformat()
        res = supabase.table("videos").insert({
            "user_id": user_id,
            "filename": filename,
            "storage_path": storage_path,
            "created_at": now
        }).execute()
        print(f"Inserted video reference for {filename} in DB.")
        return True
    except Exception as e:
        print(f"Failed to insert video reference: {e}")
        return False

# Main loop
def main():
    print("Starting soccer recorder...")
    cap = cv2.VideoCapture(CAMERA_INDEX)  # Use Pi camera or USB cam
    time.sleep(2)  # Let the camera warm up
    recording = False
    out = None
    current_appt = None
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    last_status = None
    fps = 10.0
    prev_appt_id = None

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Camera error.")
            break

        now = datetime.datetime.now()
        
        # Overlay date/time
        cv2.putText(frame, now.strftime("%Y-%m-%d %H:%M:%S"), (10, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)

        # Refresh appointments every 10 seconds or when not recording
        if not recording or int(time.time()) % 10 == 0:
            appointments = get_upcoming_appointments()

        # Get the current appointment (if any)
        appt = get_current_appointment(appointments)
        appt_id = appt["id"] if appt else None

        # If the appointment has changed (including to None), end the previous recording
        if recording and (appt_id != prev_appt_id):
            print(f"[{now}] Appointment changed or ended, stopping recording.")
            recording = False
            if out:
                out.release()
                out = None
            # Queue the video for upload and DB reference
            if current_appt:
                filename = f"recording_{current_appt['date']}_{current_appt['start_time'].replace(':','')}_{USER_ID}.mp4"
                upload_queue.put((USER_ID, filename))
                remove_completed_booking(current_appt)
            current_appt = None
            last_status = 'waiting'

        # If there is a new appointment and not recording, start a new recording
        if appt and (appt_id != prev_appt_id):
            print(f"[{now}] Starting recording for appointment: {appt['date']} {appt['start_time']} to {appt['end_time']}")
            filename = f"recording_{appt['date']}_{appt['start_time'].replace(':','')}_{USER_ID}.mp4"
            out = cv2.VideoWriter(filename, fourcc, fps, (frame.shape[1], frame.shape[0]))
            recording = True
            current_appt = appt
            last_status = 'recording'

        prev_appt_id = appt_id

        # Only run tracking and zooming if we're recording
        if recording:
            ball = detect_ball(frame)
            if ball:
                # Uncomment to enable zooming
                # frame = zoom_on_ball(frame, ball)
                cv2.circle(frame, (ball[0], ball[1]), ball[2], (0,0,255), 2)
                # Add tracking status
                cv2.putText(frame, "Tracking Active", (10, 70), 
                           cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,255), 2)
        else:
            # Show "Standby" status when not recording
            cv2.putText(frame, "Standby Mode", (10, 70), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)

        # If recording, write frame
        if recording and out:
            out.write(frame)

        # Show preview
        cv2.imshow('Soccer Recorder', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

        time.sleep(0.01)  # Small delay to prevent high CPU usage

    # Cleanup
    cap.release()
    if out:
        out.release()
    cv2.destroyAllWindows()
    # Stop the upload worker gracefully
    upload_queue.put((None, None))
    worker_thread.join()

if __name__ == "__main__":
    main() 