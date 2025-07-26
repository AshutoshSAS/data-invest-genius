-- =====================================================
-- FIX TEAM MEMBERS INFINITE RECURSION POLICIES
-- =====================================================

-- Drop the problematic recursive policies
DROP POLICY IF EXISTS "Team admins can insert team members" ON team_members;
DROP POLICY IF EXISTS "Team admins can update team members" ON team_members;
DROP POLICY IF EXISTS "Team admins can delete team members" ON team_members;

-- Create non-recursive policies for team_members

-- Allow team owners to insert team members (including themselves as owner)
CREATE POLICY "team_members_insert_policy" ON team_members
  FOR INSERT WITH CHECK (
    -- User can insert themselves as owner when creating a team
    (role = 'owner' AND user_id = auth.uid()) OR
    -- Or user must be owner/admin of the team (check via teams table)
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_members.team_id 
      AND t.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = team_members.team_id 
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
      -- Avoid recursion by checking only existing records
      AND tm.id != team_members.id
    )
  );

-- Allow team owners/admins to update team members
CREATE POLICY "team_members_update_policy" ON team_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_members.team_id 
      AND t.owner_id = auth.uid()
    ) OR
    -- Allow users to update their own membership
    user_id = auth.uid()
  );

-- Allow team owners/admins to delete team members
CREATE POLICY "team_members_delete_policy" ON team_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_members.team_id 
      AND t.owner_id = auth.uid()
    ) OR
    -- Allow users to remove themselves
    user_id = auth.uid()
  );

-- Also fix the invitation policies to use teams table instead of recursive team_members
DROP POLICY IF EXISTS "Team admins can create team invitations" ON team_invitations;

CREATE POLICY "team_invitations_insert_policy" ON team_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_invitations.team_id 
      AND t.owner_id = auth.uid()
    )
  ); 