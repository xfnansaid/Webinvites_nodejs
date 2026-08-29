-- ============================================================================
-- SUPABASE STORAGE SETUP FOR INVITATION PHOTOS (1 Compressed Photo Per Invite)
-- Run this script directly in the Supabase SQL Editor.
-- ============================================================================

-- 1. Create the 'invitation-photos' storage bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invitation-photos',
  'invitation-photos',
  true,                  -- Publicly readable so guests can view the photo on the invite
  1048576,               -- 1MB max file size limit (compressed photos are typically 100KB-300KB)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 1048576,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

-- 2. Optional: Add a dedicated photo_url column to invitations table
-- (Note: photo URL can also be seamlessly stored inside the existing template_data JSONB)
ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

COMMENT ON COLUMN public.invitations.photo_url IS
  'Public URL of the couple photo stored in Supabase Storage or external CDN';

-- ============================================================================
-- 3. STORAGE RLS POLICIES
-- ============================================================================

-- Drop existing policies if re-running to avoid duplicate name errors
DROP POLICY IF EXISTS "Public Read Access for Invitation Photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users can upload invitation photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own invitation photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own invitation photos" ON storage.objects;

-- Policy A: Anyone can VIEW/READ images (Public Access)
CREATE POLICY "Public Read Access for Invitation Photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'invitation-photos');

-- Policy B: Authenticated Users can upload their own photos
CREATE POLICY "Authenticated Users can upload invitation photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'invitation-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy C: Users can update/replace their own photos
CREATE POLICY "Users can update their own invitation photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'invitation-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'invitation-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy D: Users can delete their own photos
CREATE POLICY "Users can delete their own invitation photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'invitation-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
