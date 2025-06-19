#!/usr/bin/env python3
import time
import threading
from datetime import datetime, timedelta
from typing import Optional

from utils import (
    logger,
    load_booking,
    remove_booking,
    update_system_status,
    remove_booking_from_supabase,
    save_booking,
    supabase
)
from config import BOOKING_CHECK_INTERVAL, USER_ID, MIN_RECORDING_DURATION, MAX_RECORDING_DURATION
from camera import CameraService

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

    def get_next_booking(self):
        """Get the next upcoming booking for the user from Supabase."""
        try:
            now = datetime.utcnow()
            end_time = now + timedelta(seconds=MAX_RECORDING_DURATION)
            response = supabase.table("bookings").select("*").eq(
                "user_id", USER_ID
            ).gte(
                "end_time", now.isoformat()
            ).lte(
                "start_time", end_time.isoformat()
            ).order(
                "start_time"
            ).limit(1).execute()
            if response.data:
                booking = response.data[0]
                start = datetime.fromisoformat(booking["start_time"])
                end = datetime.fromisoformat(booking["end_time"])
                duration = (end - start).total_seconds()
                if MIN_RECORDING_DURATION <= duration <= MAX_RECORDING_DURATION:
                    return booking
                else:
                    logger.warning(f"Booking {booking['id']} duration {duration}s outside allowed range")
            return None
        except Exception as e:
            logger.error(f"Failed to get next booking: {e}")
            return None

    def recording_worker(self):
        """Background thread for managing bookings and recordings."""
        last_booking_id = None
        while not self.stop_event.is_set():
            try:
                # Fetch and save the next booking
                booking = self.get_next_booking()
                if booking and booking["id"] != last_booking_id:
                    logger.info(f"New booking found: {booking}")
                    if save_booking(booking):
                        last_booking_id = booking["id"]
                    else:
                        logger.error("Failed to save booking information")
                # Load the current booking from file
                current_booking = load_booking()
                if current_booking:
                    start_time = datetime.fromisoformat(current_booking["start_time"])
                    end_time = datetime.fromisoformat(current_booking["end_time"])
                    now = datetime.utcnow()
                    if start_time <= now <= end_time:
                        if not self.camera_service.is_recording:
                            self.start_recording(current_booking["id"])
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