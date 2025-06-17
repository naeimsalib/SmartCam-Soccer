-- Drop the table if it exists to start fresh
DROP TABLE IF EXISTS public.recordings;

-- Create recordings table
CREATE TABLE public.recordings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own recordings"
    ON public.recordings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recordings"
    ON public.recordings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recordings"
    ON public.recordings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recordings"
    ON public.recordings FOR DELETE
    USING (auth.uid() = user_id);

-- Insert a test recording
INSERT INTO public.recordings (user_id, title, description, video_url, thumbnail_url)
VALUES (
    '05669d2f-1db4-4f35-8e00-7c3845199361',  -- Your user ID from the logs
    'Test Recording',
    'This is a test recording',
    'test-video.mp4',
    'test-thumbnail.jpg'
); 