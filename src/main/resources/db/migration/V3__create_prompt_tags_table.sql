-- Create prompt_tags table
CREATE TABLE prompt_tags (
    id BIGSERIAL PRIMARY KEY,
    prompt_id BIGINT NOT NULL,
    tag VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_prompt_tags_prompt FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
    CONSTRAINT uk_prompt_tags UNIQUE (prompt_id, tag)
);

-- Create indexes for prompt_tags table
CREATE INDEX idx_prompt_tags_prompt_id ON prompt_tags(prompt_id);
CREATE INDEX idx_prompt_tags_tag ON prompt_tags(tag);