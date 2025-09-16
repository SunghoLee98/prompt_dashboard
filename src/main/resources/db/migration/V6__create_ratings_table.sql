-- Create prompt_ratings table
CREATE TABLE prompt_ratings (
    id BIGSERIAL PRIMARY KEY,
    prompt_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rating_prompt FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
    CONSTRAINT fk_rating_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_user_prompt_rating UNIQUE (user_id, prompt_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_prompt_ratings_prompt_id ON prompt_ratings(prompt_id);
CREATE INDEX idx_prompt_ratings_user_id ON prompt_ratings(user_id);
CREATE INDEX idx_prompt_ratings_rating ON prompt_ratings(rating);

-- Add rating columns to prompts table
ALTER TABLE prompts 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS rating_count INT DEFAULT 0;

-- Create function to update prompt rating statistics
CREATE OR REPLACE FUNCTION update_prompt_rating_stats() 
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE prompts 
        SET average_rating = (
            SELECT COALESCE(AVG(rating)::DECIMAL(3,2), 0.00) 
            FROM prompt_ratings 
            WHERE prompt_id = NEW.prompt_id
        ),
        rating_count = (
            SELECT COUNT(*) 
            FROM prompt_ratings 
            WHERE prompt_id = NEW.prompt_id
        ),
        updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.prompt_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE prompts 
        SET average_rating = (
            SELECT COALESCE(AVG(rating)::DECIMAL(3,2), 0.00) 
            FROM prompt_ratings 
            WHERE prompt_id = OLD.prompt_id
        ),
        rating_count = (
            SELECT COUNT(*) 
            FROM prompt_ratings 
            WHERE prompt_id = OLD.prompt_id
        ),
        updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.prompt_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update prompt rating stats
CREATE TRIGGER trigger_update_prompt_rating_stats
AFTER INSERT OR UPDATE OR DELETE ON prompt_ratings
FOR EACH ROW
EXECUTE FUNCTION update_prompt_rating_stats();