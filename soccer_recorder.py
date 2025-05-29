import os
import cv2
import numpy as np
import time
import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

# Camera index (change to 1 or 2 if needed)
CAMERA_INDEX = 0

# Load environment variables
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

# User info
USER_EMAIL = "naeimsalib@yahoo.com"
USER_ID = "05669d2f-1db4-4f35-8e00-7c3845199361"

# Connect to Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

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

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Camera error.")
            break
        now = datetime.datetime.now()
        # Overlay date/time
        cv2.putText(frame, now.strftime("%Y-%m-%d %H:%M:%S"), (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)
        # Ball detection and zoom
        ball = detect_ball(frame)
        if ball:
            # frame = zoom_on_ball(frame, ball)  # Zooming temporarily disabled
            cv2.circle(frame, (ball[0], ball[1]), ball[2], (0,0,255), 2)
        # Refresh appointments every 10 seconds or when not recording
        if not recording or int(time.time()) % 10 == 0:
            appointments = get_upcoming_appointments()
        # Check for appointment
        appt = get_current_appointment(appointments)
        if appt and not recording:
            print(f"[{now}] Starting recording for appointment: {appt['date']} {appt['start_time']} to {appt['end_time']}")
            filename = f"recording_{appt['date']}_{appt['start_time'].replace(':','')}_{USER_ID}.mp4"
            out = cv2.VideoWriter(filename, fourcc, fps, (frame.shape[1], frame.shape[0]))
            recording = True
            current_appt = appt
            last_status = 'recording'
        elif not appt and recording:
            print(f"[{now}] Appointment ended, stopping recording.")
            recording = False
            if out:
                out.release()
                out = None
            current_appt = None
            last_status = 'waiting'
        elif not appt and not recording:
            # Only print waiting message if status changed
            if last_status != 'waiting':
                print(f"[{now}] Waiting for the next appointment...")
                last_status = 'waiting'
        # If recording, write frame
        if recording and out:
            out.write(frame)
        # Show preview (optional, comment out if running headless)
        cv2.imshow('Soccer Recorder', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
        time.sleep(0.01)
    cap.release()
    if out:
        out.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main() 