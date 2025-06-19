#!/usr/bin/env python3
import os
import time
import threading
from datetime import datetime
from typing import Optional, Tuple
import subprocess

import cv2
from .utils import (
    logger,
    supabase,
    queue_upload,
    get_upload_queue,
    clear_upload_queue,
    cleanup_temp_files,
    update_system_status,
    get_storage_used,
    remove_booking,
    remove_booking_from_supabase
)
from .config import (
    CAMERA_ID,
    CAMERA_WIDTH,
    CAMERA_HEIGHT,
    CAMERA_FPS,
    RECORDING_DIR,
    TEMP_DIR,
    UPLOAD_INTERVAL,
    MAX_RECORDING_DURATION
)
from .camera_interface import CameraInterface

class CameraService:
    def __init__(self):
        self.camera = None
        self.is_recording = False
        self.current_file = None
        self.recording_start = None
        self.upload_thread = None
        self.stop_event = threading.Event()
        self.intro_video_path = None
        self.interface = None
        self.upload_worker_thread = None
        self.upload_worker_running = False
        self._start_upload_worker()
        logger.info("[Upload Worker] Upload worker thread started at service init.")

    def start_camera(self) -> bool:
        """Initialize and start the camera using CameraInterface."""
        try:
            self.interface = CameraInterface(
                width=CAMERA_WIDTH,
                height=CAMERA_HEIGHT,
                fps=CAMERA_FPS,
                output_dir=TEMP_DIR
            )
            self.camera = self.interface  # for backward compatibility
            logger.info("CameraInterface initialized successfully")
            return True
        except Exception as e:
            logger.error(f"Error starting camera: {e}")
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
        """Start recording video using CameraInterface."""
        if self.is_recording:
            logger.warning("Already recording")
            return False
        try:
            # Placeholder for recording sign/LED ON
            logger.info("[Recording Sign] Would turn ON recording indicator here.")
            self.current_file = self.interface.start_recording()
            self.is_recording = True
            self.recording_start = time.time()
            try:
                update_system_status(is_recording=True)
            except Exception as e:
                logger.error(f"Error updating system status after start_recording: {e}", exc_info=True)
            logger.info(f"Started recording to {self.current_file}")
            return True
        except Exception as e:
            logger.error(f"Error starting recording: {e}", exc_info=True)
            return False

    def stop_recording(self) -> bool:
        """Stop recording and queue file for upload using CameraInterface."""
        if not self.is_recording:
            logger.warning("stop_recording called but not recording")
            return False
        try:
            self.is_recording = False
            self.interface.stop_recording()
            # Placeholder for recording sign/LED OFF
            logger.info("[Recording Sign] Would turn OFF recording indicator here.")
            if self.current_file:
                logger.info(f"Checking file after stop_recording: {self.current_file}")
                if os.path.exists(self.current_file):
                    size = os.path.getsize(self.current_file)
                    logger.info(f"Recording file exists, size: {size} bytes")
                    final_path = self.attach_intro_video(self.current_file)
                    if final_path:
                        logger.info(f"Queuing file for upload: {final_path}")
                        self.add_to_upload_queue(final_path)
                        logger.info(f"Recording saved and queued for upload: {final_path}")
                        # Log current upload queue
                        queue = get_upload_queue()
                        logger.info(f"Upload queue after recording: {queue}")
                    else:
                        logger.error(f"attach_intro_video returned None for {self.current_file}")
                else:
                    logger.error(f"Recording file does not exist: {self.current_file}")
            else:
                logger.warning("[Upload Worker] No file to add to upload queue after recording.")
            self.current_file = None
            self.recording_start = None
            try:
                update_system_status(is_recording=False)
            except Exception as e:
                logger.error(f"Error updating system status after stop_recording: {e}", exc_info=True)
            return True
        except Exception as e:
            logger.error(f"Error stopping recording: {e}", exc_info=True)
            return False

    def _start_upload_worker(self):
        if self.upload_worker_thread is None or not self.upload_worker_thread.is_alive():
            self.upload_worker_running = True
            self.upload_worker_thread = threading.Thread(target=self.upload_worker, daemon=True)
            self.upload_worker_thread.start()
            logger.info("[Upload Worker] Upload worker thread started.")
        else:
            logger.info("[Upload Worker] Upload worker thread already running.")

    def add_to_upload_queue(self, file_path):
        logger.info(f"[Upload Worker] Adding file to upload queue: {file_path}")
        self.upload_queue.append(file_path)
        logger.info(f"[Upload Worker] Upload queue state: {self.upload_queue}")
        self._start_upload_worker()

    def upload_worker(self):
        logger.info("[Upload Worker] Upload worker running.")
        while self.upload_worker_running:
            if not self.upload_queue:
                time.sleep(2)
                continue
            file_path = self.upload_queue.pop(0)
            logger.info(f"[Upload Worker] Attempting upload for: {file_path}")
            try:
                # Real upload logic
                if os.path.exists(file_path):
                    filename = os.path.basename(file_path)
                    with open(file_path, 'rb') as f:
                        try:
                            supabase.storage.from_("recordings").upload(filename, f.read())
                            logger.info(f"[Upload Worker] Upload successful: {file_path}")
                        except Exception as e:
                            logger.error(f"[Upload Worker] Upload failed for {file_path}: {e}", exc_info=True)
                            continue
                    # Remove booking after upload
                    try:
                        logger.info(f"[Upload Worker] Attempting booking removal for: {file_path}")
                        remove_booking(filename)
                        remove_booking_from_supabase(filename)
                        logger.info(f"[Upload Worker] Booking removal successful for: {file_path}")
                    except Exception as e:
                        logger.error(f"[Upload Worker] Booking removal failed for {file_path}: {e}", exc_info=True)
                else:
                    logger.error(f"[Upload Worker] File does not exist for upload: {file_path}")
            except Exception as e:
                logger.error(f"[Upload Worker] Upload worker error for {file_path}: {e}", exc_info=True)

    def start(self):
        """Start the camera service."""
        if not self.start_camera():
            logger.error("Camera failed to start, upload worker will not run.")
            return False
        if self.upload_thread and self.upload_thread.is_alive():
            logger.warning("Upload worker already running!")
        else:
            self.upload_thread = threading.Thread(target=self.upload_worker)
            self.upload_thread.daemon = True
            self.upload_thread.start()
            logger.info("Upload worker thread started.")
        logger.info("Camera service started")
        return True

    def stop(self):
        """Stop the camera service."""
        self.stop_event.set()
        if self.upload_thread:
            logger.info("Waiting for upload worker to stop...")
            self.upload_thread.join()
        if self.is_recording:
            self.stop_recording()
        if self.interface:
            self.interface.release()
        cleanup_temp_files(TEMP_DIR)
        logger.info("Camera service stopped")

def main():
    """Main camera service loop using CameraInterface."""
    service = CameraService()
    if not service.start():
        return
    try:
        while True:
            if service.is_recording:
                frame = service.interface.capture_frame()
                if frame is not None and service.interface.camera_type == 'opencv':
                    service.interface.writer.write(frame)
                # For picamera2, recording is handled internally
                # Check recording duration
                if (time.time() - service.recording_start) >= MAX_RECORDING_DURATION:
                    service.stop_recording()
            else:
                time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Received shutdown signal")
    finally:
        service.stop()

if __name__ == "__main__":
    main() 