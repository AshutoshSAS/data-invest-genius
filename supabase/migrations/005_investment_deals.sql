-- =====================================================
-- INVESTMENT DEALS SCHEMA
-- =====================================================

-- Investment deals table
CREATE TABLE IF NOT EXISTS investment_deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES research_projects(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  investment_phase TEXT NOT NULL CHECK (investment_phase IN ('seed', 'series-a', 'series-b', 'series-c', 'series-d', 'growth', 'mezzanine', 'ipo', 'acquisition')),
  investment_amount DECIMAL(15,2),
  valuation DECIMAL(15,2),
  ownership_percentage DECIMAL(5,2),
  investment_date DATE,
  expected_exit_date DATE,
  actual_exit_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'exited', 'write-off', 'pending', 'rejected')),
  due_diligence_status TEXT DEFAULT 'pending' CHECK (due_diligence_status IN ('pending', 'in-progress', 'completed', 'failed')),
  sector TEXT,
  geography TEXT,
  investment_thesis TEXT,
  risk_assessment TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial metrics table
CREATE TABLE IF NOT EXISTS financial_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID REFERENCES investment_deals(id) ON DELETE CASCADE NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(15,2),
  metric_unit TEXT,
  metric_date DATE,
  metric_type TEXT CHECK (metric_type IN ('revenue', 'profit', 'growth', 'valuation', 'other')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Due diligence checklists
CREATE TABLE IF NOT EXISTS due_diligence_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default due diligence categories
INSERT INTO due_diligence_categories (name, description, order_index) VALUES
('Financial Due Diligence', 'Review of financial statements, projections, and financial health', 1),
('Legal Due Diligence', 'Review of legal structure, contracts, and compliance', 2),
('Market Due Diligence', 'Market analysis, competitive landscape, and growth potential', 3),
('Technical Due Diligence', 'Technology assessment, IP, and technical capabilities', 4),
('Operational Due Diligence', 'Operations, team, and execution capabilities', 5),
('Regulatory Due Diligence', 'Regulatory compliance and legal risks', 6);

-- Due diligence checklist items
CREATE TABLE IF NOT EXISTS due_diligence_checklists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID REFERENCES investment_deals(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES due_diligence_categories(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'failed', 'not-applicable')),
  assigned_to UUID REFERENCES auth.users(id),
  due_date DATE,
  completed_date DATE,
  notes TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Investment theses table
CREATE TABLE IF NOT EXISTS investment_theses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID REFERENCES investment_deals(id) ON DELETE CASCADE NOT NULL,
  thesis_title TEXT NOT NULL,
  market_opportunity TEXT,
  competitive_advantage TEXT,
  business_model TEXT,
  growth_strategy TEXT,
  risks TEXT,
  exit_strategy TEXT,
  financial_projections JSONB,
  key_metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deal documents junction table
CREATE TABLE IF NOT EXISTS deal_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID REFERENCES investment_deals(id) ON DELETE CASCADE NOT NULL,
  document_id UUID REFERENCES research_documents(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT CHECK (document_type IN ('financial', 'legal', 'market', 'technical', 'operational', 'regulatory', 'other')),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(deal_id, document_id)
);

-- Deal team members
CREATE TABLE IF NOT EXISTS deal_team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID REFERENCES investment_deals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  responsibilities TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(deal_id, user_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_investment_deals_user_id ON investment_deals(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_deals_project_id ON investment_deals(project_id);
CREATE INDEX IF NOT EXISTS idx_investment_deals_status ON investment_deals(status);
CREATE INDEX IF NOT EXISTS idx_investment_deals_phase ON investment_deals(investment_phase);
CREATE INDEX IF NOT EXISTS idx_investment_deals_company ON investment_deals(company_name);
CREATE INDEX IF NOT EXISTS idx_financial_metrics_deal_id ON financial_metrics(deal_id);
CREATE INDEX IF NOT EXISTS idx_due_diligence_checklists_deal_id ON due_diligence_checklists(deal_id);
CREATE INDEX IF NOT EXISTS idx_due_diligence_checklists_status ON due_diligence_checklists(status);
CREATE INDEX IF NOT EXISTS idx_investment_theses_deal_id ON investment_theses(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_documents_deal_id ON deal_documents(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_team_members_deal_id ON deal_team_members(deal_id);

-- Enable Row Level Security
ALTER TABLE investment_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE due_diligence_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE due_diligence_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_theses ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for investment_deals
CREATE POLICY "Users can view their own investment deals" ON investment_deals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own investment deals" ON investment_deals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investment deals" ON investment_deals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investment deals" ON investment_deals
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for financial_metrics
CREATE POLICY "Users can view financial metrics for their deals" ON financial_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM investment_deals 
      WHERE investment_deals.id = financial_metrics.deal_id 
      AND investment_deals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert financial metrics for their deals" ON financial_metrics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM investment_deals 
      WHERE investment_deals.id = financial_metrics.deal_id 
      AND investment_deals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update financial metrics for their deals" ON financial_metrics
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM investment_deals 
      WHERE investment_deals.id = financial_metrics.deal_id 
      AND investment_deals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete financial metrics for their deals" ON financial_metrics
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM investment_deals 
      WHERE investment_deals.id = financial_metrics.deal_id 
      AND investment_deals.user_id = auth.uid()
    )
  );

-- RLS Policies for due_diligence_categories (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view due diligence categories" ON due_diligence_categories
  FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for due_diligence_checklists
CREATE POLICY "Users can view checklists for their deals" ON due_diligence_checklists
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM investment_deals 
      WHERE investment_deals.id = due_diligence_checklists.deal_id 
      AND investment_deals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert checklists for their deals" ON due_diligence_checklists
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM investment_deals 
      WHERE investment_deals.id = due_diligence_checklists.deal_id 
      AND investment_deals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update checklists for their deals" ON due_diligence_checklists
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM investment_deals 
      WHERE investment_deals.id = due_diligence_checklists.deal_id 
      AND investment_deals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete checklists for their deals" ON due_diligence_checklists
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM investment_deals 
      WHERE investment_deals.id = due_diligence_checklists.deal_id 
      AND investment_deals.user_id = auth.uid()
    )
  );

-- RLS Policies for investment_theses
CREATE POLICY "Users can view theses for their deals" ON investment_theses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM investment_deals 
      WHERE investment_deals.id = investment_theses.deal_id 
      AND investment_deals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert theses for their deals" ON investment_theses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM investment_deals 
      WHERE investment_deals.id = investment_theses.deal_id 
      AND investment_deals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update theses for their deals" ON investment_theses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM investment_deals 
      WHERE investment_deals.id = investment_theses.deal_id 
      AND investment_deals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete theses for their deals" ON investment_theses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM investment_deals 
      WHERE investment_deals.id = investment_theses.deal_id 
      AND investment_deals.user_id = auth.uid()
    )
  );

-- RLS Policies for deal_documents
CREATE POLICY "Users can view documents for their deals" ON deal_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM investment_deals 
      WHERE investment_deals.id = deal_documents.deal_id 
      AND investment_deals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert documents for their deals" ON deal_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM investment_deals 
      WHERE investment_deals.id = deal_documents.deal_id 
      AND investment_deals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete documents for their deals" ON deal_documents
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM investment_deals 
      WHERE investment_deals.id = deal_documents.deal_id 
      AND investment_deals.user_id = auth.uid()
    )
  );

-- RLS Policies for deal_team_members
CREATE POLICY "Users can view team members for their deals" ON deal_team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM investment_deals 
      WHERE investment_deals.id = deal_team_members.deal_id 
      AND investment_deals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert team members for their deals" ON deal_team_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM investment_deals 
      WHERE investment_deals.id = deal_team_members.deal_id 
      AND investment_deals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update team members for their deals" ON deal_team_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM investment_deals 
      WHERE investment_deals.id = deal_team_members.deal_id 
      AND investment_deals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete team members for their deals" ON deal_team_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM investment_deals 
      WHERE investment_deals.id = deal_team_members.deal_id 
      AND investment_deals.user_id = auth.uid()
    )
  );

-- Functions to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_investment_deals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_due_diligence_checklists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_investment_theses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_investment_deals_updated_at
  BEFORE UPDATE ON investment_deals
  FOR EACH ROW
  EXECUTE FUNCTION update_investment_deals_updated_at();

CREATE TRIGGER update_due_diligence_checklists_updated_at
  BEFORE UPDATE ON due_diligence_checklists
  FOR EACH ROW
  EXECUTE FUNCTION update_due_diligence_checklists_updated_at();

CREATE TRIGGER update_investment_theses_updated_at
  BEFORE UPDATE ON investment_theses
  FOR EACH ROW
  EXECUTE FUNCTION update_investment_theses_updated_at(); 