-- Add comment column to prompt_ratings table
ALTER TABLE prompt_ratings
ADD COLUMN comment TEXT NULL;

-- Add constraint to limit comment length
ALTER TABLE prompt_ratings
ADD CONSTRAINT check_comment_length
CHECK (char_length(comment) <= 1000);

-- Create index for queries filtering by comments
CREATE INDEX idx_prompt_ratings_created_at
ON prompt_ratings(created_at DESC);

-- Create partial index for ratings with comments
CREATE INDEX idx_prompt_ratings_comment
ON prompt_ratings(prompt_id)
WHERE comment IS NOT NULL;

-- Update the trigger function to handle comments (no changes needed, just for documentation)
COMMENT ON COLUMN prompt_ratings.comment IS 'Optional user comment about their rating (max 1000 characters)';