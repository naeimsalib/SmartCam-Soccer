#!/usr/bin/env python3
import logging
import socket
import json
import os
from datetime import datetime
from typing import Optional, Dict, Any, List
from supabase import create_client, Client
from config import (
    SUPABASE_URL,
    SUPABASE_KEY,
    USER_ID,
    LOG_DIR,
    TEMP_DIR,
    RECORDING_DIR
)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Setup logging
def setup_logging():
    """Configure logging with both file and console handlers."""
    os.makedirs(LOG_DIR, exist_ok=True)
    
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    
    # File handler with rotation
    file_handler = logging.handlers.RotatingFileHandler(
        os.path.join(LOG_DIR, 'smartcam.log'),
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    ))
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(levelname)s - %(message)s'
    ))
    
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger

logger = setup_logging()

def get_ip() -> str:
    """Get the local IP address."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception as e:
        logger.error(f"Failed to get IP address: {e}")
        return "127.0.0.1"

def update_system_status(
    is_recording: bool = False,
    is_streaming: bool = False,
    storage_used: int = 0,
    last_backup: Optional[str] = None
) -> bool:
    """Update system status in the database."""
    try:
        data = {
            "user_id": USER_ID,
            "is_recording": is_recording,
            "is_streaming": is_streaming,
            "storage_used": storage_used,
            "last_backup": last_backup,
            "last_seen": datetime.utcnow().isoformat(),
            "ip_address": get_ip()
        }
        
        response = supabase.table("system_status").upsert(data).execute()
        
        if response.error:
            logger.error(f"Failed to update system status: {response.error}")
            return False
            
        logger.info("System status updated successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error updating system status: {e}")
        return False

def save_booking(booking: Dict[str, Any]) -> bool:
    """Save booking information to a JSON file."""
    try:
        os.makedirs(TEMP_DIR, exist_ok=True)
        filepath = os.path.join(TEMP_DIR, "current_booking.json")
        
        with open(filepath, "w") as f:
            json.dump(booking, f)
            
        logger.info(f"Booking saved: {booking['id']}")
        return True
        
    except Exception as e:
        logger.error(f"Error saving booking: {e}")
        return False

def load_booking() -> Optional[Dict[str, Any]]:
    """Load booking information from JSON file."""
    try:
        filepath = os.path.join(TEMP_DIR, "current_booking.json")
        
        if not os.path.exists(filepath):
            return None
            
        with open(filepath, "r") as f:
            booking = json.load(f)
            
        return booking
        
    except Exception as e:
        logger.error(f"Error loading booking: {e}")
        return None

def remove_booking() -> bool:
    """Remove the current booking file."""
    try:
        filepath = os.path.join(TEMP_DIR, "current_booking.json")
        
        if os.path.exists(filepath):
            os.remove(filepath)
            logger.info("Booking file removed")
            
        return True
        
    except Exception as e:
        logger.error(f"Error removing booking: {e}")
        return False

def queue_upload(filepath: str) -> bool:
    """Add a file to the upload queue."""
    try:
        queue_file = os.path.join(TEMP_DIR, "upload_queue.json")
        queue = get_upload_queue()
        
        if filepath not in queue:
            queue.append(filepath)
            
            with open(queue_file, "w") as f:
                json.dump(queue, f)
                
            logger.info(f"File queued for upload: {filepath}")
            
        return True
        
    except Exception as e:
        logger.error(f"Error queueing file for upload: {e}")
        return False

def get_upload_queue() -> List[str]:
    """Get the list of files in the upload queue."""
    try:
        queue_file = os.path.join(TEMP_DIR, "upload_queue.json")
        
        if not os.path.exists(queue_file):
            return []
            
        with open(queue_file, "r") as f:
            queue = json.load(f)
            
        return queue
        
    except Exception as e:
        logger.error(f"Error getting upload queue: {e}")
        return []

def clear_upload_queue() -> bool:
    """Clear the upload queue."""
    try:
        queue_file = os.path.join(TEMP_DIR, "upload_queue.json")
        
        if os.path.exists(queue_file):
            os.remove(queue_file)
            
        logger.info("Upload queue cleared")
        return True
        
    except Exception as e:
        logger.error(f"Error clearing upload queue: {e}")
        return False

def format_timestamp(timestamp: datetime) -> str:
    """Format timestamp for Supabase."""
    return timestamp.isoformat()

def cleanup_temp_files(directory: str) -> None:
    """Clean up temporary files in the specified directory."""
    try:
        for filename in os.listdir(directory):
            filepath = os.path.join(directory, filename)
            try:
                if os.path.isfile(filepath):
                    os.remove(filepath)
                    logger.info(f"Removed temporary file: {filepath}")
            except Exception as e:
                logger.error(f"Error removing file {filepath}: {e}")
                
    except Exception as e:
        logger.error(f"Error cleaning up temporary files: {e}")

def get_storage_used() -> int:
    """Calculate total storage used by recordings."""
    try:
        total_size = 0
        for dirpath, _, filenames in os.walk(RECORDING_DIR):
            for filename in filenames:
                filepath = os.path.join(dirpath, filename)
                total_size += os.path.getsize(filepath)
        return total_size
    except Exception as e:
        logger.error(f"Error calculating storage used: {e}")
        return 0

def remove_booking_from_supabase(booking_id: str) -> bool:
    """Remove the booking from Supabase database by ID."""
    try:
        response = supabase.table("bookings").delete().eq("id", booking_id).execute()
        if hasattr(response, 'error') and response.error:
            logger.error(f"Failed to remove booking from Supabase: {response.error}")
            return False
        logger.info(f"Booking {booking_id} removed from Supabase.")
        return True
    except Exception as e:
        logger.error(f"Error removing booking from Supabase: {e}")
        return False 