#!/usr/bin/env python3
"""
Test script to verify booking logic and time validation
"""

import os
import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
USER_ID = os.getenv("USER_ID")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_current_active_booking():
    """Get the currently active booking based on current time."""
    now = datetime.datetime.now()
    today = now.strftime("%Y-%m-%d")
    current_time = now.strftime("%H:%M")
    
    print(f"Current time: {now}")
    print(f"Looking for bookings on: {today} at {current_time}")
    
    try:
        # Get today's bookings
        response = supabase.table("bookings").select("*").eq("user_id", USER_ID).eq("date", today).order("start_time").execute()
        
        print(f"Found {len(response.data)} bookings for today:")
        for booking in response.data:
            print(f"  - {booking['id']}: {booking['start_time']}-{booking['end_time']}")
        
        if not response.data:
            print("No bookings found for today")
            return None
            
        # Find the booking that is currently active
        for booking in response.data:
            start_time = datetime.datetime.strptime(f"{booking['date']} {booking['start_time']}", "%Y-%m-%d %H:%M")
            end_time = datetime.datetime.strptime(f"{booking['date']} {booking['end_time']}", "%Y-%m-%d %H:%M")
            
            print(f"Checking booking {booking['id']}: {start_time} <= {now} <= {end_time}")
            
            if start_time <= now <= end_time:
                print(f"✅ ACTIVE BOOKING FOUND: {booking['id']} ({booking['start_time']}-{booking['end_time']})")
                return booking
            else:
                print(f"❌ Booking {booking['id']} is not active")
                
        print("No active bookings found")
        return None
    except Exception as e:
        print(f"Error fetching current booking: {str(e)}")
        return None

def test_booking_detection():
    """Test the booking detection logic"""
    print("=" * 50)
    print("TESTING BOOKING DETECTION LOGIC")
    print("=" * 50)
    
    active_booking = get_current_active_booking()
    
    if active_booking:
        print(f"\n✅ SUCCESS: Found active booking")
        print(f"   ID: {active_booking['id']}")
        print(f"   Time: {active_booking['start_time']} - {active_booking['end_time']}")
        print(f"   Date: {active_booking['date']}")
    else:
        print("\n❌ No active booking found")
        
    print("\n" + "=" * 50)

if __name__ == "__main__":
    test_booking_detection() 