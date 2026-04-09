-- Enable the pgvector extension to work with embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the knowledge_vectors table for the Funda Knowledge Engine
CREATE TABLE IF NOT EXISTS knowledge_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL, -- ID of the lesson or document
  source_type TEXT NOT NULL, -- 'lesson', 'document'
  content TEXT NOT NULL, -- the specific text chunk
  embedding vector(1536), -- Vector for OpenAI text-embedding-3-small (or similar 1536-dim model)
  metadata JSONB DEFAULT '{}'::jsonb, -- Store title, grade, zimsec_level etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast similarity searching using HNSW
CREATE INDEX IF NOT EXISTS knowledge_vectors_embedding_idx ON knowledge_vectors USING hnsw (embedding vector_cosine_ops);

-- RPC for similarity search
CREATE OR REPLACE FUNCTION match_knowledge_chunks (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_grade text DEFAULT 'all',
  filter_level text DEFAULT 'all'
)
RETURNS TABLE (
  id uuid,
  source_id uuid,
  source_type text,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    k.id,
    k.source_id,
    k.source_type,
    k.content,
    k.metadata,
    1 - (k.embedding <=> query_embedding) AS similarity
  FROM knowledge_vectors k
  WHERE (filter_grade = 'all' OR k.metadata->>'grade' = filter_grade)
    AND (filter_level = 'all' OR k.metadata->>'zimsec_level' = filter_level)
    AND 1 - (k.embedding <=> query_embedding) > match_threshold
  ORDER BY k.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Link to relevant existing tables for metadata integrity (optional but recommended)
-- We won't add hard FKs because source_id is polymorphic
