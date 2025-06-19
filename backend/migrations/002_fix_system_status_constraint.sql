-- Migration to fix system_status table constraints and optionally add booking_id to videos table
-- Run this in your Supabase SQL editor

-- 1. First, clean up any duplicate system_status entries
DELETE FROM system_status 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM system_status 
    GROUP BY user_id
);

-- 2. Add unique constraint on user_id to prevent duplicates
ALTER TABLE system_status 
ADD CONSTRAINT system_status_user_id_unique UNIQUE (user_id);

-- 3. Optional: Add booking_id column to videos table (uncomment if needed)
-- ALTER TABLE videos 
-- ADD COLUMN booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL;

-- 4. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_system_status_user_id ON system_status(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);

-- Verify the changes
SELECT 'Migration completed successfully' as status; 