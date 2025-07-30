-- Remove 'video' from the feedback_media type constraint
ALTER TABLE feedback_media 
DROP CONSTRAINT IF EXISTS feedback_media_type_check;

ALTER TABLE feedback_media 
ADD CONSTRAINT feedback_media_type_check 
CHECK (type IN ('screenshot', 'voice'));

-- Optional: Update any existing 'video' types to 'voice' (or handle as needed)
-- UPDATE feedback_media SET type = 'voice' WHERE type = 'video';