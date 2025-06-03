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
        print(f"Download failed for {path}: {e}")
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

def prepend_intro(intro_path, main_path, output_path):
    try:
        with open("merge.txt", "w") as f:
            f.write(f"file '{intro_path}'\nfile '{main_path}'\n")
        subprocess.run(["ffmpeg", "-f", "concat", "-safe", "0", "-i", "merge.txt", "-c", "copy", output_path], check=True)
        return True
    except Exception as e:
        print(f"FFmpeg merge failed: {e}")
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
        print(f"Uploaded {filename}")
        return storage_path
    except Exception as e:
        print(f"Upload failed: {e}")
        return None

def insert_video_reference(user_id, filename, storage_path):
    now = datetime.datetime.now().isoformat()
    try:
        supabase.table("videos").insert({
            "user_id": user_id,
            "filename": filename,
            "storage_path": storage_path,
            "created_at": now
        }).execute()
        return True
    except Exception as e:
        print(f"DB insert failed: {e}")
        return False

def upload_worker():
    while True:
        user_id, final_video_path = upload_queue.get()
        if final_video_path is None:
            break
        storage_path = upload_video_to_supabase(final_video_path, user_id, os.path.basename(final_video_path))
        if storage_path:
            insert_video_reference(user_id, os.path.basename(final_video_path), storage_path)
            os.remove(final_video_path)
        upload_queue.task_done()

threading.Thread(target=upload_worker, daemon=True).start()

def main():
    print("SmartCam Ready...")
    cap = cv2.VideoCapture(CAMERA_INDEX)
    time.sleep(2)

    user_settings = get_user_settings()
    local_logos = {}

    for key, pos in zip(['logo_path', 'sponsor_logo1_path', 'sponsor_logo2_path', 'sponsor_logo3_path'],
                        ['top-right', 'bottom-left', 'bottom-right', 'top-left']):
        if user_settings.get(key):
            filename = f"media_{key}.png"
            if download_file_from_supabase(user_settings[key], filename):
                local_logos[pos] = filename

    intro_local = None
    if user_settings.get("intro_video_path"):
        intro_local = "intro_video.mp4"
        download_file_from_supabase(user_settings["intro_video_path"], intro_local)

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    fps = 10
    out, recording = None, False
    appointments = []
    active_appt_id = None

    def get_appts():
        today = datetime.datetime.now().strftime("%Y-%m-%d")
        return supabase.table("bookings").select("*").eq("user_id", USER_ID).gte("date", today).execute().data

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Camera error.")
            break

        now = datetime.datetime.now()
        frame = cv2.putText(frame, now.strftime("%Y-%m-%d %H:%M:%S"), (10, 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        for pos, logo_file in local_logos.items():
            frame = overlay_logo(frame, logo_file, pos)

        if not appointments or int(time.time()) % 10 == 0:
            appointments = get_appts()

        current_appt = next((a for a in appointments if
            datetime.datetime.strptime(f"{a['date']} {a['start_time']}", "%Y-%m-%d %H:%M") <= now <=
            datetime.datetime.strptime(f"{a['date']} {a['end_time']}", "%Y-%m-%d %H:%M")), None)

        if current_appt and (not recording or current_appt['id'] != active_appt_id):
            if recording and out:
                print("Stop recording for previous booking...")
                out.release()
                final_output = filename
                if intro_local:
                    merged = f"final_{filename}"
                    if prepend_intro(intro_local, filename, merged):
                        os.remove(filename)
                        final_output = merged
                upload_queue.put((USER_ID, final_output))
                recording = False

            print("Start recording for new booking...")
            active_appt_id = current_appt['id']
            filename = f"rec_{current_appt['date']}_{current_appt['start_time'].replace(':', '')}_{USER_ID}.mp4"
            out = cv2.VideoWriter(filename, fourcc, fps, (frame.shape[1], frame.shape[0]))
            recording = True

        elif not current_appt and recording:
            print("Stop recording (no current appointment)...")
            out.release()
            final_output = filename
            if intro_local:
                merged = f"final_{filename}"
                if prepend_intro(intro_local, filename, merged):
                    os.remove(filename)
                    final_output = merged
            upload_queue.put((USER_ID, final_output))
            recording = False
            active_appt_id = None

        if recording and out:
            out.write(frame)

        cv2.imshow("SmartCam Soccer", frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    if out:
        out.release()
    cv2.destroyAllWindows()
    upload_queue.put((None, None))

if __name__ == "__main__":
    main()
