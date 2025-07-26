-- =====================================================
-- ADD INDUSTRY AND SUB-INDUSTRY FIELDS TO RESEARCH PROJECTS
-- =====================================================

-- Add industry and sub-industry columns to research_projects table
ALTER TABLE research_projects 
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS sub_industry TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create index for better performance on industry queries
CREATE INDEX IF NOT EXISTS idx_research_projects_industry ON research_projects(industry);
CREATE INDEX IF NOT EXISTS idx_research_projects_sub_industry ON research_projects(sub_industry);

-- Update RLS policies to include new columns
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

-- Add comments for documentation
COMMENT ON COLUMN research_projects.industry IS 'Primary industry classification (e.g., Technology, Healthcare, Finance)';
COMMENT ON COLUMN research_projects.sub_industry IS 'Sub-industry classification within the primary industry';
COMMENT ON COLUMN research_projects.tags IS 'Array of relevant tags for the research project'; 