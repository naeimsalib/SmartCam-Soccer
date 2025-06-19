#!/usr/bin/env python3
"""
Script to clean up duplicate system_status entries
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
USER_ID = os.getenv("USER_ID")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def cleanup_duplicate_system_status():
    """Clean up duplicate system_status entries, keeping only the latest one per user."""
    try:
        print("Fetching all system_status entries...")
        response = supabase.table("system_status").select("*").eq("user_id", USER_ID).order("last_seen", desc=True).execute()
        
        if not response.data:
            print("No system_status entries found")
            return
            
        print(f"Found {len(response.data)} system_status entries for user {USER_ID}")
        
        if len(response.data) <= 1:
            print("Only one entry found, no cleanup needed")
            return
            
        # Keep the first (most recent) entry, delete the rest
        latest_entry = response.data[0]
        duplicate_entries = response.data[1:]
        
        print(f"Keeping latest entry (ID: {latest_entry.get('id', 'N/A')}, last_seen: {latest_entry.get('last_seen', 'N/A')})")
        print(f"Deleting {len(duplicate_entries)} duplicate entries...")
        
        for entry in duplicate_entries:
            entry_id = entry.get('id')
            if entry_id:
                supabase.table("system_status").delete().eq("id", entry_id).execute()
                print(f"  - Deleted entry ID: {entry_id}")
                
        print("✅ Cleanup completed successfully!")
        
        # Verify cleanup
        verify_response = supabase.table("system_status").select("*").eq("user_id", USER_ID).execute()
        print(f"Verification: Now have {len(verify_response.data)} system_status entries")
        
    except Exception as e:
        print(f"❌ Error during cleanup: {str(e)}")

def show_current_status():
    """Show current system_status entries."""
    try:
        response = supabase.table("system_status").select("*").eq("user_id", USER_ID).order("last_seen", desc=True).execute()
        
        print("\n" + "="*60)
        print("CURRENT SYSTEM_STATUS ENTRIES")
        print("="*60)
        
        if not response.data:
            print("No entries found")
        else:
            for i, entry in enumerate(response.data, 1):
                print(f"\nEntry {i}:")
                print(f"  ID: {entry.get('id', 'N/A')}")
                print(f"  User ID: {entry.get('user_id', 'N/A')}")
                print(f"  Last Seen: {entry.get('last_seen', 'N/A')}")
                print(f"  Last Heartbeat: {entry.get('last_heartbeat', 'N/A')}")
                print(f"  Recording: {entry.get('is_recording', 'N/A')}")
                print(f"  Pi Active: {entry.get('pi_active', 'N/A')}")
                
    except Exception as e:
        print(f"Error fetching status: {str(e)}")

if __name__ == "__main__":
    print("🔧 System Status Cleanup Tool")
    print("="*40)
    
    show_current_status()
    
    response = input("\nDo you want to clean up duplicate entries? (y/N): ")
    if response.lower() == 'y':
        cleanup_duplicate_system_status()
        show_current_status()
    else:
        print("Cleanup cancelled") 