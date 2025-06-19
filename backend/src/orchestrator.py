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
    remove_booking_from_supabase
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
            booking = load_booking()
            if not booking or booking["id"] != booking_id:
                logger.error(f"Invalid booking ID: {booking_id}")
                return False

            if not self.camera_service.start_recording():
                logger.error("Failed to start recording")
                return False

            self.current_booking_id = booking_id
            logger.info(f"Started recording for booking {booking_id}")
            return True

        except Exception as e:
            logger.error(f"Error starting recording: {e}")
            return False

    def stop_recording(self) -> bool:
        """Stop the current recording."""
        try:
            if self.camera_service.stop_recording():
                logger.info("Recording stopped successfully")
                
                # Remove booking after recording is complete
                if self.current_booking_id:
                    remove_booking()
                    remove_booking_from_supabase(self.current_booking_id)
                    self.current_booking_id = None
                    
                return True
            return False
        except Exception as e:
            logger.error(f"Error stopping recording: {e}")
            return False

    def recording_worker(self):
        """Background thread for managing recordings."""
        while not self.stop_event.is_set():
            try:
                booking = load_booking()
                if booking:
                    start_time = datetime.fromisoformat(booking["start_time"])
                    end_time = datetime.fromisoformat(booking["end_time"])
                    now = datetime.utcnow()

                    if start_time <= now <= end_time:
                        if not self.camera_service.is_recording:
                            self.start_recording(booking["id"])
                    elif now > end_time and self.camera_service.is_recording:
                        self.stop_recording()
                elif self.camera_service.is_recording:
                    # If no booking but still recording, stop recording
                    self.stop_recording()

                time.sleep(BOOKING_CHECK_INTERVAL)

            except Exception as e:
                logger.error(f"Error in recording worker: {e}")
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