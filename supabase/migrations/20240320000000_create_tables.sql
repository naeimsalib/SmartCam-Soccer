-- Create recordings table
CREATE TABLE IF NOT EXISTS public.recordings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    intro_video_path TEXT,
    logo_path TEXT,
    sponsor_logo1_path TEXT,
    sponsor_logo2_path TEXT,
    sponsor_logo3_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create cameras table
CREATE TABLE IF NOT EXISTS public.cameras (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location TEXT,
    camera_on BOOLEAN DEFAULT false,
    is_recording BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ip_address TEXT,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create system_status table
CREATE TABLE IF NOT EXISTS public.system_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    is_recording BOOLEAN DEFAULT false,
    is_streaming BOOLEAN DEFAULT false,
    storage_used BIGINT DEFAULT 0,
    last_backup TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create RLS policies
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_status ENABLE ROW LEVEL SECURITY;

-- Recordings policies
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

-- User settings policies
CREATE POLICY "Users can view their own settings"
    ON public.user_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
    ON public.user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
    ON public.user_settings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings"
    ON public.user_settings FOR DELETE
    USING (auth.uid() = user_id);

-- Cameras policies
CREATE POLICY "Users can view their own cameras"
    ON public.cameras FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cameras"
    ON public.cameras FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cameras"
    ON public.cameras FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cameras"
    ON public.cameras FOR DELETE
    USING (auth.uid() = user_id);

-- System status policies
CREATE POLICY "Users can view their own system status"
    ON public.system_status FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own system status"
    ON public.system_status FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own system status"
    ON public.system_status FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own system status"
    ON public.system_status FOR DELETE
    USING (auth.uid() = user_id);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('recordings', 'recordings', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('usermedia', 'usermedia', false);

-- Set up storage policies
CREATE POLICY "Users can upload their own recordings"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'recordings' AND
        auth.uid() = (storage.foldername(name))[1]::uuid
    );

CREATE POLICY "Users can view their own recordings"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'recordings' AND
        auth.uid() = (storage.foldername(name))[1]::uuid
    );

CREATE POLICY "Users can update their own recordings"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'recordings' AND
        auth.uid() = (storage.foldername(name))[1]::uuid
    );

CREATE POLICY "Users can delete their own recordings"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'recordings' AND
        auth.uid() = (storage.foldername(name))[1]::uuid
    );

-- User media policies
CREATE POLICY "Users can upload their own media"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'usermedia' AND
        auth.uid() = (storage.foldername(name))[1]::uuid
    );

CREATE POLICY "Users can view their own media"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'usermedia' AND
        auth.uid() = (storage.foldername(name))[1]::uuid
    );

CREATE POLICY "Users can update their own media"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'usermedia' AND
        auth.uid() = (storage.foldername(name))[1]::uuid
    );

CREATE POLICY "Users can delete their own media"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'usermedia' AND
        auth.uid() = (storage.foldername(name))[1]::uuid
    ); 