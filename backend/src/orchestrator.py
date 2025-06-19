#!/usr/bin/env python3
import time
import threading
from datetime import datetime
from typing import Optional

from .utils import (
    logger,
    load_booking,
    remove_booking,
    update_system_status,
    remove_booking_from_supabase,
    get_upload_queue
)
from .config import BOOKING_CHECK_INTERVAL
from .camera import CameraService

class Orchestrator:
    def __init__(self):
        self.camera_service = CameraService()
        self.stop_event = threading.Event()
        self.recording_thread = None
        self.current_booking_id = None

    def start_recording(self, booking_id: str) -> bool:
        """Start recording for a specific booking."""
        try:
            logger.info(f"Attempting to start recording for booking {booking_id}")
            booking = load_booking()
            if not booking or booking["id"] != booking_id:
                logger.error(f"Invalid booking ID: {booking_id}")
                return False

            if not self.camera_service.start_recording(booking_id=booking_id):
                logger.error("Failed to start recording")
                return False

            self.current_booking_id = booking_id
            logger.info(f"Started recording for booking {booking_id}")
            return True

        except Exception as e:
            logger.error(f"Error starting recording: {e}", exc_info=True)
            return False

    def stop_recording(self) -> bool:
        """Stop the current recording."""
        try:
            logger.info("Attempting to stop recording")
            if self.camera_service.stop_recording():
                logger.info("Recording stopped successfully")
                logger.info(f"Upload queue after stop_recording: {self.camera_service.upload_queue}")
                # Do not remove booking here; let upload worker handle it after successful upload
                return True
            else:
                logger.error("Failed to stop recording")
                return False
        except Exception as e:
            logger.error(f"Exception in stop_recording: {e}", exc_info=True)
            return False

    def manual_trigger_upload_worker(self):
        logger.info("[Orchestrator] Manual trigger for upload worker.")
        self.camera_service.manual_trigger_upload_queue()

    def recording_worker(self):
        """Background thread for managing recordings."""
        last_booking_id = None
        while not self.stop_event.is_set():
            try:
                booking = load_booking()
                now = datetime.utcnow()
                if booking:
                    start_time = datetime.fromisoformat(booking["start_time"])
                    end_time = datetime.fromisoformat(booking["end_time"])
                    logger.debug(f"Booking loaded: {booking}, now: {now}")
                    if start_time <= now <= end_time:
                        if not self.camera_service.is_recording:
                            logger.info(f"[Orchestrator] Booking window open, starting recording for {booking['id']}")
                            self.start_recording(booking["id"])
                            last_booking_id = booking["id"]
                    elif now > end_time and self.camera_service.is_recording:
                        logger.info(f"[Orchestrator] Booking ended, stopping recording for {booking['id']}")
                        self.stop_recording()
                        last_booking_id = None
                elif self.camera_service.is_recording:
                    logger.info("[Orchestrator] No booking found but still recording, stopping recording")
                    self.stop_recording()
                    last_booking_id = None
                time.sleep(5)
            except Exception as e:
                logger.error(f"Error in recording worker: {e}", exc_info=True)
                time.sleep(5)

    def start(self):
        """Start the orchestrator service."""
        if not self.camera_service.start():
            logger.error("Failed to start camera service")
            return False

        self.recording_thread = threading.Thread(target=self.recording_worker)
        self.recording_thread.daemon = True
        self.recording_thread.start()

        # Update system status
        update_system_status(is_streaming=True)
        
        logger.info("Orchestrator service started")
        return True

    def stop(self):
        """Stop the orchestrator service."""
        self.stop_event.set()
        if self.recording_thread:
            self.recording_thread.join()

        if self.camera_service.is_recording:
            self.stop_recording()

        self.camera_service.stop()
        
        # Update system status
        update_system_status(is_streaming=False)
        
        logger.info("Orchestrator service stopped")

def main():
    """Main orchestrator service loop."""
    orchestrator = Orchestrator()
    if not orchestrator.start():
        return

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Received shutdown signal")
    finally:
        orchestrator.stop()

if __name__ == "__main__":
    main() 