#!/usr/bin/env python3
import os
import time
import threading
from datetime import datetime
from typing import Optional, Tuple
import subprocess

import cv2
from utils import (
    logger,
    supabase,
    queue_upload,
    get_upload_queue,
    clear_upload_queue,
    cleanup_temp_files,
    update_system_status,
    get_storage_used
)
from config import (
    CAMERA_ID,
    CAMERA_WIDTH,
    CAMERA_HEIGHT,
    CAMERA_FPS,
    RECORDING_DIR,
    TEMP_DIR,
    UPLOAD_INTERVAL,
    MAX_RECORDING_DURATION
)
from picamera2 import Picamera2
import numpy as np

class CameraService:
    def __init__(self):
        self.camera: Optional[Picamera2] = None
        self.is_recording = False
        self.current_file = None
        self.recording_start = None
        self.upload_thread = None
        self.stop_event = threading.Event()
        self.intro_video_path = None

    def start_camera(self) -> bool:
        """Initialize and start the camera with lock file."""
        try:
            self.lock_file = os.path.join(TEMP_DIR, "camera.lock")
            if os.path.exists(self.lock_file):
                logger.error("Camera lock file exists. Another process may be using the camera.")
                return False
            with open(self.lock_file, "w") as f:
                f.write(str(os.getpid()))
            self.camera = Picamera2()
            video_config = self.camera.create_video_configuration(
                main={
                    "size": (CAMERA_WIDTH, CAMERA_HEIGHT),
                    "format": "RGB888"
                },
                controls={"FrameRate": CAMERA_FPS}
            )
            self.camera.configure(video_config)
            self.camera.start()
            logger.info("Camera initialized successfully with Picamera2")
            return True
        except Exception as e:
            logger.error(f"Error starting camera: {e}")
            if hasattr(self, 'lock_file') and os.path.exists(self.lock_file):
                os.remove(self.lock_file)
            return False

    def get_intro_video(self) -> Optional[str]:
        """Download intro video from Supabase storage."""
        try:
            # Get user settings to find intro video path
            response = supabase.table("user_settings").select("intro_video_path").eq(
                "user_id", USER_ID
            ).single().execute()
            
            if not response.data or not response.data.get("intro_video_path"):
                return None
                
            intro_path = response.data["intro_video_path"]
            local_path = os.path.join(TEMP_DIR, "intro.mp4")
            
            # Download intro video
            with open(local_path, "wb") as f:
                response = supabase.storage.from_("usermedia").download(intro_path)
                f.write(response)
                
            return local_path
            
        except Exception as e:
            logger.error(f"Error getting intro video: {e}")
            return None

    def attach_intro_video(self, recording_path: str) -> Optional[str]:
        """Attach intro video to the recording."""
        try:
            if not self.intro_video_path:
                self.intro_video_path = self.get_intro_video()
                
            if not self.intro_video_path:
                return recording_path
                
            # Create output path
            output_path = os.path.join(
                TEMP_DIR,
                f"final_{os.path.basename(recording_path)}"
            )
            
            # Use ffmpeg to concatenate videos
            cmd = [
                "ffmpeg", "-y",
                "-i", self.intro_video_path,
                "-i", recording_path,
                "-filter_complex", "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[outv][outa]",
                "-map", "[outv]",
                "-map", "[outa]",
                output_path
            ]
            
            subprocess.run(cmd, check=True, capture_output=True)
            
            # Remove original recording
            os.remove(recording_path)
            
            return output_path
            
        except Exception as e:
            logger.error(f"Error attaching intro video: {e}")
            return recording_path

    def start_recording(self) -> bool:
        """Start recording video."""
        if self.is_recording:
            logger.warning("Already recording")
            return False
            
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"recording_{timestamp}.mp4"
            self.current_file = os.path.join(TEMP_DIR, filename)
            
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            self.writer = cv2.VideoWriter(
                self.current_file,
                fourcc,
                CAMERA_FPS,
                (CAMERA_WIDTH, CAMERA_HEIGHT)
            )
            
            self.is_recording = True
            self.recording_start = time.time()
            
            # Update system status
            update_system_status(is_recording=True)
            
            logger.info(f"Started recording to {self.current_file}")
            return True
            
        except Exception as e:
            logger.error(f"Error starting recording: {e}")
            return False

    def stop_recording(self) -> bool:
        """Stop recording and queue file for upload."""
        if not self.is_recording:
            return False
            
        try:
            self.is_recording = False
            self.writer.release()
            
            if self.current_file and os.path.exists(self.current_file):
                # Attach intro video if available
                final_path = self.attach_intro_video(self.current_file)
                
                if final_path:
                    queue_upload(final_path)
                    logger.info(f"Recording saved and queued for upload: {final_path}")
            
            self.current_file = None
            self.recording_start = None
            
            # Update system status
            update_system_status(is_recording=False)
            
            return True
            
        except Exception as e:
            logger.error(f"Error stopping recording: {e}")
            return False

    def upload_worker(self):
        """Background thread for handling file uploads."""
        while not self.stop_event.is_set():
            try:
                queue = get_upload_queue()
                if queue:
                    for filepath in queue:
                        if os.path.exists(filepath):
                            # Upload to Supabase storage
                            with open(filepath, 'rb') as f:
                                filename = os.path.basename(filepath)
                                supabase.storage.from_("recordings").upload(
                                    filename,
                                    f.read()
                                )
                            logger.info(f"Uploaded {filename}")
                            # Delete local file after upload
                            try:
                                os.remove(filepath)
                                logger.info(f"Deleted local file after upload: {filepath}")
                            except Exception as e:
                                logger.error(f"Failed to delete local file: {filepath}, error: {e}")
                            # Update storage used
                            storage_used = get_storage_used()
                            update_system_status(storage_used=storage_used)
                time.sleep(UPLOAD_INTERVAL)
            except Exception as e:
                logger.error(f"Error in upload worker: {e}")
                time.sleep(5)

    def start(self):
        """Start the camera service."""
        if not self.start_camera():
            return False
            
        self.upload_thread = threading.Thread(target=self.upload_worker)
        self.upload_thread.daemon = True
        self.upload_thread.start()
        
        logger.info("Camera service started")
        return True

    def stop(self):
        """Stop the camera service and release resources."""
        self.stop_event.set()
        if self.upload_thread:
            self.upload_thread.join()
        if self.camera:
            self.camera.stop()
            logger.info("Camera stopped")
        # Remove lock file
        if hasattr(self, 'lock_file') and os.path.exists(self.lock_file):
            os.remove(self.lock_file)
            logger.info("Camera lock file removed")
        logger.info("Camera service stopped")

def main():
    """Main camera service loop."""
    service = CameraService()
    if not service.start():
        return
        
    try:
        while True:
            if service.is_recording:
                frame = service.camera.capture_array()
                if frame is not None:
                    # Convert RGB to BGR for OpenCV VideoWriter
                    frame_bgr = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
                    service.writer.write(frame_bgr)
                    # Check recording duration
                    if (time.time() - service.recording_start) >= MAX_RECORDING_DURATION:
                        service.stop_recording()
                else:
                    logger.error("Failed to read frame from Picamera2")
                    break
            else:
                time.sleep(1)
                
    except KeyboardInterrupt:
        logger.info("Received shutdown signal")
    finally:
        service.stop()

if __name__ == "__main__":
    main() 