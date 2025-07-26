-- =====================================================
-- DOCUMENT CHUNKS FOR RAG SYSTEM
-- =====================================================

-- Create document_chunks table for RAG system
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES research_documents(id) ON DELETE CASCADE NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  title TEXT NOT NULL,
  embedding vector(768), -- For Gemini embeddings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops);

-- Enable Row Level Security
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_chunks
CREATE POLICY "Users can view chunks for their documents" ON document_chunks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM research_documents 
      WHERE research_documents.id = document_chunks.document_id 
      AND research_documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert chunks for their documents" ON document_chunks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM research_documents 
      WHERE research_documents.id = document_chunks.document_id 
      AND research_documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update chunks for their documents" ON document_chunks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM research_documents 
      WHERE research_documents.id = document_chunks.document_id 
      AND research_documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete chunks for their documents" ON document_chunks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM research_documents 
      WHERE research_documents.id = document_chunks.document_id 
      AND research_documents.user_id = auth.uid()
    )
  );

-- Function for vector similarity search
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  document_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  similarity float,
  document_id UUID,
  chunk_index INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.title,
    dc.content,
    1 - (dc.embedding <=> query_embedding) AS similarity,
    dc.document_id,
    dc.chunk_index
  FROM document_chunks dc
  WHERE dc.embedding IS NOT NULL
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
    AND (document_id IS NULL OR dc.document_id = document_id)
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$; 