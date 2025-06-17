#!/usr/bin/env python3
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from .utils import logger, supabase, save_booking
from .config import (
    USER_ID,
    BOOKING_CHECK_INTERVAL,
    MIN_RECORDING_DURATION,
    MAX_RECORDING_DURATION
)

def get_next_booking() -> Optional[Dict[str, Any]]:
    """Get the next upcoming booking for the user."""
    try:
        now = datetime.utcnow()
        end_time = now + timedelta(seconds=MAX_RECORDING_DURATION)
        
        # Query Supabase for the next booking
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
            # Validate booking duration
            start = datetime.fromisoformat(booking["start_time"])
            end = datetime.fromisoformat(booking["end_time"])
            duration = (end - start).total_seconds()
            
            if MIN_RECORDING_DURATION <= duration <= MAX_RECORDING_DURATION:
                return booking
            else:
                logger.warning(
                    f"Booking {booking['id']} duration {duration}s outside allowed range"
                )
        
        return None
    except Exception as e:
        logger.error(f"Failed to get next booking: {e}")
        return None

def main():
    """Main scheduler loop."""
    logger.info("Scheduler service started")
    last_booking_id = None
    
    while True:
        try:
            booking = get_next_booking()
            
            if booking and booking["id"] != last_booking_id:
                logger.info(f"New booking found: {booking}")
                if save_booking(booking):
                    last_booking_id = booking["id"]
                else:
                    logger.error("Failed to save booking information")
            
            time.sleep(BOOKING_CHECK_INTERVAL)
            
        except Exception as e:
            logger.error(f"Error in scheduler loop: {e}")
            time.sleep(5)  # Wait before retrying

if __name__ == "__main__":
    main() 