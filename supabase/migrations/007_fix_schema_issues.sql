-- =====================================================
-- FIX SCHEMA ISSUES AND ENSURE COMPLETE SETUP
-- =====================================================

-- Ensure research_projects table has correct structure
CREATE TABLE IF NOT EXISTS research_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  custom_fields JSONB DEFAULT '[]'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure project_documents junction table exists
CREATE TABLE IF NOT EXISTS project_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES research_projects(id) ON DELETE CASCADE NOT NULL,
  document_id UUID REFERENCES research_documents(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, document_id)
);

-- Ensure project_field_values table exists
CREATE TABLE IF NOT EXISTS project_field_values (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES research_projects(id) ON DELETE CASCADE NOT NULL,
  field_name TEXT NOT NULL,
  field_value TEXT,
  field_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure document_chunks table exists for RAG system
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES research_documents(id) ON DELETE CASCADE NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  title TEXT NOT NULL,
  embedding vector(768),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_research_projects_user_id ON research_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_research_projects_category ON research_projects(category);
CREATE INDEX IF NOT EXISTS idx_research_projects_status ON research_projects(status);
CREATE INDEX IF NOT EXISTS idx_project_documents_project_id ON project_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_document_id ON project_documents(document_id);
CREATE INDEX IF NOT EXISTS idx_project_field_values_project_id ON project_field_values(project_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops);

-- Enable Row Level Security
ALTER TABLE research_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for research_projects
DROP POLICY IF EXISTS "Users can view their own research projects" ON research_projects;
CREATE POLICY "Users can view their own research projects" ON research_projects
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own research projects" ON research_projects;
CREATE POLICY "Users can insert their own research projects" ON research_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own research projects" ON research_projects;
CREATE POLICY "Users can update their own research projects" ON research_projects
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own research projects" ON research_projects;
CREATE POLICY "Users can delete their own research projects" ON research_projects
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for project_documents
DROP POLICY IF EXISTS "Users can view project documents for their projects" ON project_documents;
CREATE POLICY "Users can view project documents for their projects" ON project_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM research_projects 
      WHERE research_projects.id = project_documents.project_id 
      AND research_projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert project documents for their projects" ON project_documents;
CREATE POLICY "Users can insert project documents for their projects" ON project_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM research_projects 
      WHERE research_projects.id = project_documents.project_id 
      AND research_projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete project documents for their projects" ON project_documents;
CREATE POLICY "Users can delete project documents for their projects" ON project_documents
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM research_projects 
      WHERE research_projects.id = project_documents.project_id 
      AND research_projects.user_id = auth.uid()
    )
  );

-- RLS Policies for project_field_values
DROP POLICY IF EXISTS "Users can view field values for their projects" ON project_field_values;
CREATE POLICY "Users can view field values for their projects" ON project_field_values
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM research_projects 
      WHERE research_projects.id = project_field_values.project_id 
      AND research_projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert field values for their projects" ON project_field_values;
CREATE POLICY "Users can insert field values for their projects" ON project_field_values
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM research_projects 
      WHERE research_projects.id = project_field_values.project_id 
      AND research_projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update field values for their projects" ON project_field_values;
CREATE POLICY "Users can update field values for their projects" ON project_field_values
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM research_projects 
      WHERE research_projects.id = project_field_values.project_id 
      AND research_projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete field values for their projects" ON project_field_values;
CREATE POLICY "Users can delete field values for their projects" ON project_field_values
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM research_projects 
      WHERE research_projects.id = project_field_values.project_id 
      AND research_projects.user_id = auth.uid()
    )
  );

-- RLS Policies for document_chunks
DROP POLICY IF EXISTS "Users can view their document chunks" ON document_chunks;
CREATE POLICY "Users can view their document chunks" ON document_chunks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM research_documents 
      WHERE research_documents.id = document_chunks.document_id 
      AND research_documents.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their document chunks" ON document_chunks;
CREATE POLICY "Users can insert their document chunks" ON document_chunks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM research_documents 
      WHERE research_documents.id = document_chunks.document_id 
      AND research_documents.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their document chunks" ON document_chunks;
CREATE POLICY "Users can update their document chunks" ON document_chunks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM research_documents 
      WHERE research_documents.id = document_chunks.document_id 
      AND research_documents.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their document chunks" ON document_chunks;
CREATE POLICY "Users can delete their document chunks" ON document_chunks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM research_documents 
      WHERE research_documents.id = document_chunks.document_id 
      AND research_documents.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_research_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_research_projects_updated_at ON research_projects;
CREATE TRIGGER update_research_projects_updated_at
  BEFORE UPDATE ON research_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_research_projects_updated_at();

-- Function to update project_field_values updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_field_values_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at for field values
DROP TRIGGER IF EXISTS update_project_field_values_updated_at ON project_field_values;
CREATE TRIGGER update_project_field_values_updated_at
  BEFORE UPDATE ON project_field_values
  FOR EACH ROW
  EXECUTE FUNCTION update_project_field_values_updated_at();

-- Function to match documents using vector similarity (FIXED VERSION)
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  target_document_id uuid DEFAULT NULL
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
    AND (target_document_id IS NULL OR dc.document_id = target_document_id)
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$; 