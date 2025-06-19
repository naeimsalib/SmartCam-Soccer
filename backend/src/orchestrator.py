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

            if not self.camera_service.start_recording():
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
                # Log upload queue after recording
                queue = get_upload_queue()
                logger.info(f"Upload queue after stop_recording: {queue}")
                # Remove booking after recording is complete
                if self.current_booking_id:
                    try:
                        logger.info(f"Attempting to remove booking {self.current_booking_id} from local and Supabase DB.")
                        remove_booking()
                        logger.info(f"Booking {self.current_booking_id} removed from local file.")
                        remove_booking_from_supabase(self.current_booking_id)
                        logger.info(f"Booking {self.current_booking_id} removed from Supabase DB.")
                    except Exception as e:
                        logger.error(f"Failed to remove booking {self.current_booking_id}: {e}", exc_info=True)
                    self.current_booking_id = None
                return True
            return False
        except Exception as e:
            logger.error(f"Error stopping recording: {e}", exc_info=True)
            # Try to remove booking anyway
            if self.current_booking_id:
                try:
                    logger.info(f"Attempting to remove booking {self.current_booking_id} from local and Supabase DB (after error).")
                    remove_booking()
                    logger.info(f"Booking {self.current_booking_id} removed from local file (after error).")
                    remove_booking_from_supabase(self.current_booking_id)
                    logger.info(f"Booking {self.current_booking_id} removed from Supabase DB (after error).")
                except Exception as e2:
                    logger.error(f"Failed to remove booking {self.current_booking_id} after error: {e2}", exc_info=True)
                self.current_booking_id = None
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
                    logger.debug(f"Booking loaded: {booking}, now: {now}")
                    if start_time <= now <= end_time:
                        if not self.camera_service.is_recording:
                            logger.info(f"Within booking window, starting recording for {booking['id']}")
                            self.start_recording(booking["id"])
                    elif now > end_time and self.camera_service.is_recording:
                        logger.info(f"Booking ended, stopping recording for {booking['id']}")
                        self.stop_recording()
                elif self.camera_service.is_recording:
                    logger.info("No booking found but still recording, stopping recording")
                    self.stop_recording()

                time.sleep(BOOKING_CHECK_INTERVAL)

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