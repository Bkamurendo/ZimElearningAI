-- Add unique index to knowledge_vectors to support upsert operations
CREATE UNIQUE INDEX IF NOT EXISTS idx_knowledge_vectors_source_content 
ON knowledge_vectors (source_id, content);

-- Add index on source_id for faster skipping and lookups
CREATE INDEX IF NOT EXISTS idx_knowledge_vectors_source_id ON knowledge_vectors (source_id);
