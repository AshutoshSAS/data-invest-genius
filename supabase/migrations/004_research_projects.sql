-- =====================================================
-- RESEARCH PROJECTS SCHEMA
-- =====================================================

-- Create research_projects table
CREATE TABLE IF NOT EXISTS research_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  custom_fields JSONB DEFAULT '[]'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb, -- Array of document IDs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_documents junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS project_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES research_projects(id) ON DELETE CASCADE NOT NULL,
  document_id UUID REFERENCES research_documents(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, document_id)
);

-- Create project_fields table for custom field values
CREATE TABLE IF NOT EXISTS project_field_values (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES research_projects(id) ON DELETE CASCADE NOT NULL,
  field_name TEXT NOT NULL,
  field_value TEXT,
  field_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_research_projects_user_id ON research_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_research_projects_category ON research_projects(category);
CREATE INDEX IF NOT EXISTS idx_research_projects_status ON research_projects(status);
CREATE INDEX IF NOT EXISTS idx_project_documents_project_id ON project_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_document_id ON project_documents(document_id);
CREATE INDEX IF NOT EXISTS idx_project_field_values_project_id ON project_field_values(project_id);

-- Enable Row Level Security
ALTER TABLE research_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_field_values ENABLE ROW LEVEL SECURITY;

-- RLS Policies for research_projects
CREATE POLICY "Users can view their own research projects" ON research_projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own research projects" ON research_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own research projects" ON research_projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own research projects" ON research_projects
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for project_documents
CREATE POLICY "Users can view project documents for their projects" ON project_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM research_projects 
      WHERE research_projects.id = project_documents.project_id 
      AND research_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert project documents for their projects" ON project_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM research_projects 
      WHERE research_projects.id = project_documents.project_id 
      AND research_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete project documents for their projects" ON project_documents
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM research_projects 
      WHERE research_projects.id = project_documents.project_id 
      AND research_projects.user_id = auth.uid()
    )
  );

-- RLS Policies for project_field_values
CREATE POLICY "Users can view field values for their projects" ON project_field_values
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM research_projects 
      WHERE research_projects.id = project_field_values.project_id 
      AND research_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert field values for their projects" ON project_field_values
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM research_projects 
      WHERE research_projects.id = project_field_values.project_id 
      AND research_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update field values for their projects" ON project_field_values
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM research_projects 
      WHERE research_projects.id = project_field_values.project_id 
      AND research_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete field values for their projects" ON project_field_values
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM research_projects 
      WHERE research_projects.id = project_field_values.project_id 
      AND research_projects.user_id = auth.uid()
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
CREATE TRIGGER update_project_field_values_updated_at
  BEFORE UPDATE ON project_field_values
  FOR EACH ROW
  EXECUTE FUNCTION update_project_field_values_updated_at(); 