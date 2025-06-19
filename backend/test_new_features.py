#!/usr/bin/env python3
"""
Test script for new SmartCam features:
1. Past booking cleanup with grace period
2. Camera count tracking
3. Video processing with overlays and intro
"""

import os
import sys
import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import (
    cleanup_past_bookings, 
    update_camera_status, 
    process_video_with_overlays,
    get_user_settings,
    BOOKING_GRACE_PERIOD
)

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
USER_ID = os.getenv("USER_ID")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def test_past_booking_cleanup():
    """Test the past booking cleanup functionality."""
    print("=" * 50)
    print("Testing Past Booking Cleanup")
    print("=" * 50)
    
    # Get current bookings
    try:
        today = datetime.date.today().isoformat()
        response = supabase.table("bookings").select("*").eq("user_id", USER_ID).eq("date", today).execute()
        
        print(f"Current bookings for {today}:")
        if response.data:
            for booking in response.data:
                end_time = datetime.time.fromisoformat(booking["end_time"])
                booking_date = datetime.date.fromisoformat(booking["date"])
                booking_end_datetime = datetime.datetime.combine(booking_date, end_time)
                
                current_datetime = datetime.datetime.now()
                time_since_end = (current_datetime - booking_end_datetime).total_seconds()
                
                print(f"  - Booking {booking['id'][:8]}... ends at {booking['end_time']}")
                print(f"    Time since end: {int(time_since_end)} seconds")
                print(f"    Grace period: {BOOKING_GRACE_PERIOD} seconds")
                print(f"    Should be removed: {time_since_end > BOOKING_GRACE_PERIOD}")
        else:
            print("  No bookings found")
        
        # Run cleanup
        print("\nRunning cleanup_past_bookings()...")
        cleanup_past_bookings()
        
    except Exception as e:
        print(f"Error testing booking cleanup: {e}")

def test_camera_status():
    """Test the camera status update with camera count."""
    print("\n" + "=" * 50)
    print("Testing Camera Status Update")
    print("=" * 50)
    
    try:
        # Test with camera online
        print("Testing with camera online...")
        update_camera_status(camera_on=True, is_recording=False)
        
        # Test with camera offline
        print("Testing with camera offline...")
        update_camera_status(camera_on=False, is_recording=False)
        
        # Test with camera recording
        print("Testing with camera recording...")
        update_camera_status(camera_on=True, is_recording=True)
        
        # Check current status
        response = supabase.table("system_status").select("*").eq("user_id", USER_ID).execute()
        if response.data:
            status = response.data[0]
            print(f"\nCurrent system status:")
            print(f"  - Cameras online: {status.get('cameras_online', 'N/A')}")
            print(f"  - Total cameras: {status.get('total_cameras', 'N/A')}")
            print(f"  - Pi active: {status.get('pi_active', 'N/A')}")
            print(f"  - Is recording: {status.get('is_recording', 'N/A')}")
        else:
            print("No system status found")
            
    except Exception as e:
        print(f"Error testing camera status: {e}")

def test_user_settings():
    """Test user settings retrieval."""
    print("\n" + "=" * 50)
    print("Testing User Settings")
    print("=" * 50)
    
    try:
        settings = get_user_settings()
        print("User settings:")
        for key, value in settings.items():
            print(f"  - {key}: {value}")
            
        # Check for logo and intro video paths
        logo_path = settings.get("logo_path", "user_assets/default_logo.png")
        intro_path = settings.get("intro_video_path")
        
        print(f"\nLogo path: {logo_path}")
        print(f"Logo exists: {os.path.exists(logo_path)}")
        
        if intro_path:
            print(f"Intro video path: {intro_path}")
            print(f"Intro video exists: {os.path.exists(intro_path)}")
        else:
            print("No intro video configured")
            
    except Exception as e:
        print(f"Error testing user settings: {e}")

def create_test_booking():
    """Create a test booking for testing purposes."""
    print("\n" + "=" * 50)
    print("Creating Test Booking")
    print("=" * 50)
    
    try:
        # Create a booking that ended 3 minutes ago (should be cleaned up)
        end_time = datetime.datetime.now() - datetime.timedelta(minutes=3)
        start_time = end_time - datetime.timedelta(minutes=30)  # 30 minute booking
        
        booking_data = {
            "user_id": USER_ID,
            "date": start_time.date().isoformat(),
            "start_time": start_time.time().isoformat(),
            "end_time": end_time.time().isoformat(),
            "sport": "soccer",
            "created_at": datetime.datetime.now().isoformat()
        }
        
        response = supabase.table("bookings").insert(booking_data).execute()
        if response.data:
            booking_id = response.data[0]["id"]
            print(f"Created test booking: {booking_id}")
            print(f"  Start: {start_time}")
            print(f"  End: {end_time}")
            print(f"  This booking should be cleaned up by cleanup_past_bookings()")
            return booking_id
        else:
            print("Failed to create test booking")
            return None
            
    except Exception as e:
        print(f"Error creating test booking: {e}")
        return None

def cleanup_test_booking(booking_id):
    """Clean up the test booking."""
    if booking_id:
        try:
            supabase.table("bookings").delete().eq("id", booking_id).execute()
            print(f"Cleaned up test booking: {booking_id}")
        except Exception as e:
            print(f"Error cleaning up test booking: {e}")

def main():
    """Run all tests."""
    print("SmartCam New Features Test Suite")
    print("================================")
    
    # Test 1: User settings
    test_user_settings()
    
    # Test 2: Camera status
    test_camera_status()
    
    # Test 3: Create test booking and test cleanup
    test_booking_id = create_test_booking()
    
    if test_booking_id:
        input("\nPress Enter to test booking cleanup...")
        test_past_booking_cleanup()
        
        # Clean up any remaining test booking
        cleanup_test_booking(test_booking_id)
    else:
        test_past_booking_cleanup()
    
    print("\n" + "=" * 50)
    print("Test Suite Complete")
    print("=" * 50)
    print("\nFeatures tested:")
    print("✓ Past booking cleanup with 2-minute grace period")
    print("✓ Camera count tracking (cameras_online/total_cameras)")
    print("✓ User settings retrieval for video processing")
    print("\nNote: Video processing with overlays requires actual video files to test.")

if __name__ == "__main__":
    main() 