-- Add venue_address column to invitations table
ALTER TABLE invitations
ADD COLUMN IF NOT EXISTS venue_address TEXT;
