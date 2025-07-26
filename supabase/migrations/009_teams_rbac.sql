-- =====================================================
-- TEAMS AND RBAC SYSTEM
-- =====================================================

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  avatar_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members with roles
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  permissions JSONB DEFAULT '{}'::jsonb,
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Team invitations
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update profiles table to include team_id
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_id ON team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);

-- Enable Row Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams
CREATE POLICY "Users can view teams they are members of" ON teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = teams.id 
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can update their teams" ON teams
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can create teams" ON teams
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Team owners can delete their teams" ON teams
  FOR DELETE USING (owner_id = auth.uid());

-- RLS Policies for team_members
CREATE POLICY "Team members can view team members" ON team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = team_members.team_id 
      AND tm.user_id = auth.uid()
    )
  );

-- This policy has an infinite recursion issue
-- CREATE POLICY "Team admins can manage team members" ON team_members
--   FOR ALL USING (
--     EXISTS (
--       SELECT 1 FROM team_members tm 
--       WHERE tm.team_id = team_members.team_id 
--       AND tm.user_id = auth.uid()
--       AND tm.role IN ('owner', 'admin')
--     )
--   );

-- Fix: Split into separate policies for each operation
CREATE POLICY "Team admins can insert team members" ON team_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = team_members.team_id 
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    ) OR 
    -- Allow users to insert themselves as owner when creating a new team
    (team_members.role = 'owner' AND team_members.user_id = auth.uid())
  );

CREATE POLICY "Team admins can update team members" ON team_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = team_members.team_id 
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Team admins can delete team members" ON team_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = team_members.team_id 
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for team_invitations
CREATE POLICY "Team admins can view team invitations" ON team_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = team_invitations.team_id 
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Team admins can create team invitations" ON team_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = team_invitations.team_id 
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Team admins can update team invitations" ON team_invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = team_invitations.team_id 
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_teams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_teams_updated_at();

-- Function to handle team member permissions
CREATE OR REPLACE FUNCTION get_user_team_permissions(user_uuid UUID, team_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  member_role TEXT;
  permissions JSONB;
BEGIN
  SELECT role INTO member_role
  FROM team_members
  WHERE team_id = team_uuid AND user_id = user_uuid;
  
  IF member_role IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;
  
  CASE member_role
    WHEN 'owner' THEN
      permissions := '{
        "can_manage_team": true,
        "can_manage_members": true,
        "can_manage_projects": true,
        "can_manage_documents": true,
        "can_view_analytics": true,
        "can_export_data": true,
        "can_delete_team": true
      }'::jsonb;
    WHEN 'admin' THEN
      permissions := '{
        "can_manage_team": false,
        "can_manage_members": true,
        "can_manage_projects": true,
        "can_manage_documents": true,
        "can_view_analytics": true,
        "can_export_data": true,
        "can_delete_team": false
      }'::jsonb;
    WHEN 'member' THEN
      permissions := '{
        "can_manage_team": false,
        "can_manage_members": false,
        "can_manage_projects": true,
        "can_manage_documents": true,
        "can_view_analytics": true,
        "can_export_data": false,
        "can_delete_team": false
      }'::jsonb;
    WHEN 'viewer' THEN
      permissions := '{
        "can_manage_team": false,
        "can_manage_members": false,
        "can_manage_projects": false,
        "can_manage_documents": false,
        "can_view_analytics": true,
        "can_export_data": false,
        "can_delete_team": false
      }'::jsonb;
    ELSE
      permissions := '{}'::jsonb;
  END CASE;
  
  RETURN permissions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 