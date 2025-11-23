-- ============================================
-- RAG Knowledge Assistant Database Schema
-- ============================================
-- This schema creates the necessary tables and extensions for the RAG system
-- Run this in your Supabase SQL Editor

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- Documents Table
-- ============================================
-- Stores original uploaded documents
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'txt', 'md', 'docx')),
  file_size INTEGER NOT NULL,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  chunk_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================
-- Document Chunks Table
-- ============================================
-- Stores chunked documents with embeddings for vector search
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(768), -- Gemini text-embedding-004 dimension
  chunk_index INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure chunks are ordered correctly within a document
  CONSTRAINT unique_chunk_per_document UNIQUE (document_id, chunk_index)
);

-- ============================================
-- Indexes for Performance
-- ============================================

-- HNSW index for fast vector similarity search
-- Using cosine distance (vector_cosine_ops) for semantic similarity
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
ON document_chunks
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Index on document_id for fast filtering
CREATE INDEX IF NOT EXISTS document_chunks_document_id_idx
ON document_chunks(document_id);

-- Index on created_at for recency-based filtering
CREATE INDEX IF NOT EXISTS document_chunks_created_at_idx
ON document_chunks(created_at DESC);

-- GIN index on metadata for JSONB queries
CREATE INDEX IF NOT EXISTS document_chunks_metadata_idx
ON document_chunks USING GIN(metadata);

CREATE INDEX IF NOT EXISTS documents_metadata_idx
ON documents USING GIN(metadata);

-- ============================================
-- Row Level Security (RLS)
-- ============================================
-- Enable RLS for security (set to permissive for demo purposes)

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Allow public access for demo (replace with proper auth policies in production)
CREATE POLICY "Allow public access to documents"
ON documents FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public access to chunks"
ON document_chunks FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================
-- Helper Functions
-- ============================================

-- Function to update chunk count in documents table
CREATE OR REPLACE FUNCTION update_document_chunk_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE documents
    SET chunk_count = chunk_count + 1
    WHERE id = NEW.document_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE documents
    SET chunk_count = chunk_count - 1
    WHERE id = OLD.document_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update chunk count
CREATE TRIGGER update_chunk_count_trigger
AFTER INSERT OR DELETE ON document_chunks
FOR EACH ROW
EXECUTE FUNCTION update_document_chunk_count();

-- Function for similarity search with metadata filtering
-- Usage: SELECT * FROM match_documents('query text', match_threshold, match_count, filter_jsonb)
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10,
  filter jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  chunk_index integer,
  similarity float,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_chunks.id,
    document_chunks.document_id,
    document_chunks.content,
    document_chunks.chunk_index,
    1 - (document_chunks.embedding <=> query_embedding) AS similarity,
    document_chunks.metadata
  FROM document_chunks
  WHERE
    1 - (document_chunks.embedding <=> query_embedding) > match_threshold
    AND (filter = '{}'::jsonb OR document_chunks.metadata @> filter)
  ORDER BY document_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================
-- Sample Query Examples
-- ============================================

-- Get all documents with chunk counts
-- SELECT id, name, file_type, chunk_count, upload_date FROM documents ORDER BY upload_date DESC;

-- Search for similar chunks (after generating embedding for "your query")
-- SELECT * FROM match_documents('[your_embedding_vector]'::vector(768), 0.5, 5);

-- Get all chunks for a specific document in order
-- SELECT content, chunk_index FROM document_chunks WHERE document_id = 'uuid' ORDER BY chunk_index;

-- Delete a document (cascades to chunks)
-- DELETE FROM documents WHERE id = 'uuid';
