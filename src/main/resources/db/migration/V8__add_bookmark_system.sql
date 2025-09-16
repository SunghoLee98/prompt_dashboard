-- V6__add_bookmark_system.sql
-- Add bookmark system to support user bookmarks and bookmark folders

-- Create bookmark folders table
CREATE TABLE bookmark_folders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(200),
    bookmark_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_bookmark_folders_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT ck_bookmark_folders_name_length
        CHECK (char_length(name) >= 3 AND char_length(name) <= 50),
    CONSTRAINT ck_bookmark_folders_desc_length
        CHECK (char_length(description) <= 200)
);

-- Create prompt bookmarks table
CREATE TABLE prompt_bookmarks (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    prompt_id BIGINT NOT NULL,
    folder_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_prompt_bookmarks_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_prompt_bookmarks_prompt
        FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
    CONSTRAINT fk_prompt_bookmarks_folder
        FOREIGN KEY (folder_id) REFERENCES bookmark_folders(id) ON DELETE SET NULL
);

-- Add bookmark_count to prompts table
ALTER TABLE prompts
ADD COLUMN bookmark_count INTEGER NOT NULL DEFAULT 0;

-- Create indexes for bookmark folders
CREATE INDEX idx_bookmark_folders_user_id ON bookmark_folders(user_id);
CREATE UNIQUE INDEX idx_bookmark_folders_user_name ON bookmark_folders(user_id, name);

-- Create indexes for prompt bookmarks
CREATE UNIQUE INDEX idx_prompt_bookmarks_user_prompt ON prompt_bookmarks(user_id, prompt_id);
CREATE INDEX idx_prompt_bookmarks_user_id ON prompt_bookmarks(user_id);
CREATE INDEX idx_prompt_bookmarks_prompt_id ON prompt_bookmarks(prompt_id);
CREATE INDEX idx_prompt_bookmarks_folder_id ON prompt_bookmarks(folder_id);
CREATE INDEX idx_prompt_bookmarks_created_at ON prompt_bookmarks(created_at DESC);

-- Create index for bookmark_count in prompts
CREATE INDEX idx_prompts_bookmark_count ON prompts(bookmark_count DESC);

-- Update triggers for maintaining denormalized counts
CREATE OR REPLACE FUNCTION update_bookmark_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update prompt bookmark count
        UPDATE prompts
        SET bookmark_count = bookmark_count + 1
        WHERE id = NEW.prompt_id;

        -- Update folder bookmark count if folder is assigned
        IF NEW.folder_id IS NOT NULL THEN
            UPDATE bookmark_folders
            SET bookmark_count = bookmark_count + 1
            WHERE id = NEW.folder_id;
        END IF;

        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update prompt bookmark count
        UPDATE prompts
        SET bookmark_count = bookmark_count - 1
        WHERE id = OLD.prompt_id;

        -- Update folder bookmark count if folder was assigned
        IF OLD.folder_id IS NOT NULL THEN
            UPDATE bookmark_folders
            SET bookmark_count = bookmark_count - 1
            WHERE id = OLD.folder_id;
        END IF;

        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle folder change
        IF OLD.folder_id IS DISTINCT FROM NEW.folder_id THEN
            -- Decrease count from old folder
            IF OLD.folder_id IS NOT NULL THEN
                UPDATE bookmark_folders
                SET bookmark_count = bookmark_count - 1
                WHERE id = OLD.folder_id;
            END IF;

            -- Increase count for new folder
            IF NEW.folder_id IS NOT NULL THEN
                UPDATE bookmark_folders
                SET bookmark_count = bookmark_count + 1
                WHERE id = NEW.folder_id;
            END IF;
        END IF;

        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trg_update_bookmark_counts
AFTER INSERT OR UPDATE OR DELETE ON prompt_bookmarks
FOR EACH ROW EXECUTE FUNCTION update_bookmark_counts();

-- Update existing prompt bookmark counts (in case there are existing bookmarks)
UPDATE prompts
SET bookmark_count = (
    SELECT COALESCE(COUNT(*), 0)
    FROM prompt_bookmarks pb
    WHERE pb.prompt_id = prompts.id
);

-- Update existing folder bookmark counts
UPDATE bookmark_folders
SET bookmark_count = (
    SELECT COALESCE(COUNT(*), 0)
    FROM prompt_bookmarks pb
    WHERE pb.folder_id = bookmark_folders.id
);