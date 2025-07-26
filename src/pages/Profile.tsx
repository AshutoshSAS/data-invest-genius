import { useState, useEffect } from 'react';
import { User, Settings, Users, Shield, Mail, Calendar, Building, Plus, Trash2, Edit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface Team {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  avatar_url: string | null;
  created_at: string;
  member_count: number;
  user_role: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user: {
    email: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface TeamInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  invited_by: {
    full_name: string;
  };
}

const Profile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamInvitations, setTeamInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || '',
    role: profile?.role || 'researcher' as 'admin' | 'analyst' | 'researcher' | 'viewer',
    avatar_url: profile?.avatar_url || ''
  });
  
  const [teamForm, setTeamForm] = useState({
    name: '',
    description: ''
  });
  
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'member'
  });

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchTeams(),
        fetchTeamMembers(),
        fetchTeamInvitations()
      ]);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        member_count:team_members(count),
        user_role:team_members(role)
      `)
      .eq('team_members.user_id', user!.id);

    if (error) throw error;
    
    const transformedTeams = data?.map(team => ({
      ...team,
      member_count: team.member_count?.[0]?.count || 0,
      user_role: team.user_role?.[0]?.role || 'member'
    })) || [];
    
    setTeams(transformedTeams);
  };

  const fetchTeamMembers = async () => {
    if (!selectedTeam) return;
    
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        *,
        user:profiles(email, full_name, avatar_url)
      `)
      .eq('team_id', selectedTeam.id);

    if (error) throw error;
    setTeamMembers(data || []);
  };

  const fetchTeamInvitations = async () => {
    const { data, error } = await supabase
      .from('team_invitations')
      .select(`
        *,
        invited_by:profiles(full_name)
      `)
      .eq('email', user!.email)
      .eq('status', 'pending');

    if (error) throw error;
    setTeamInvitations(data || []);
  };

  const handleProfileUpdate = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(profileForm)
        .eq('id', user!.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      
      setEditingProfile(false);
      // Use fetchUserData instead of refreshProfile
      fetchUserData();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const handleCreateTeam = async () => {
    try {
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: teamForm.name,
          description: teamForm.description,
          owner_id: user!.id
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add owner as team member
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: user!.id,
          role: 'owner'
        });

      if (memberError) throw memberError;

      toast({
        title: "Success",
        description: "Team created successfully",
      });
      
      setShowCreateTeam(false);
      setTeamForm({ name: '', description: '' });
      fetchTeams();
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        title: "Error",
        description: "Failed to create team",
        variant: "destructive",
      });
    }
  };

  const handleInviteMember = async () => {
    if (!selectedTeam) return;
    
    try {
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const { error } = await supabase
        .from('team_invitations')
        .insert({
          team_id: selectedTeam.id,
          email: inviteForm.email,
          role: inviteForm.role,
          invited_by: user!.id,
          token,
          expires_at: expiresAt.toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Invitation sent to ${inviteForm.email}`,
      });
      
      setShowInviteMember(false);
      setInviteForm({ email: '', role: 'member' });
      fetchTeamInvitations();
    } catch (error) {
      console.error('Error inviting member:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      // Get invitation details
      const { data: invitation, error: inviteError } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

      if (inviteError) throw inviteError;

      // Add user to team
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: invitation.team_id,
          user_id: user!.id,
          role: invitation.role,
          invited_by: invitation.invited_by
        });

      if (memberError) throw memberError;

      // Update invitation status
      const { error: updateError } = await supabase
        .from('team_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Team invitation accepted",
      });
      
      fetchUserData();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: "Error",
        description: "Failed to accept invitation",
        variant: "destructive",
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-orange-100 text-orange-800';
      case 'member': return 'bg-blue-100 text-blue-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-gray-600 mt-2">
              Manage your profile, teams, and account settings
            </p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your profile information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile?.avatar_url || ''} />
                    <AvatarFallback>
                      {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-medium">{profile?.full_name || 'No name set'}</h3>
                    <p className="text-gray-600">{user?.email}</p>
                    <Badge variant="secondary" className="mt-1">
                      {profile?.role || 'researcher'}
                    </Badge>
                  </div>
                </div>

                {editingProfile ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={profileForm.role}
                        onValueChange={(value: 'admin' | 'analyst' | 'researcher' | 'viewer') => 
                          setProfileForm(prev => ({ ...prev, role: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="researcher">Researcher</SelectItem>
                          <SelectItem value="analyst">Analyst</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={handleProfileUpdate}>Save Changes</Button>
                      <Button variant="outline" onClick={() => setEditingProfile(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button onClick={() => setEditingProfile(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">My Teams</h2>
              <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Team
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Team</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="team_name">Team Name</Label>
                      <Input
                        id="team_name"
                        value={teamForm.name}
                        onChange={(e) => setTeamForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter team name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="team_description">Description</Label>
                      <Textarea
                        id="team_description"
                        value={teamForm.description}
                        onChange={(e) => setTeamForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter team description"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={handleCreateTeam}>Create Team</Button>
                      <Button variant="outline" onClick={() => setShowCreateTeam(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <Card key={team.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      <Badge className={getRoleColor(team.user_role)}>
                        {team.user_role}
                      </Badge>
                    </div>
                    <CardDescription>{team.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{team.member_count} members</span>
                      <span>{new Date(team.created_at).toLocaleDateString()}</span>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => setSelectedTeam(team)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Manage Team
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {teams.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Teams Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Create your first team to start collaborating with others
                  </p>
                  <Button onClick={() => setShowCreateTeam(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Team
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Invitations Tab */}
          <TabsContent value="invitations" className="space-y-6">
            <h2 className="text-2xl font-bold">Team Invitations</h2>
            
            {teamInvitations.length > 0 ? (
              <div className="space-y-4">
                {teamInvitations.map((invitation) => (
                  <Card key={invitation.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <h3 className="font-medium">{invitation.email}</h3>
                        <p className="text-sm text-gray-600">
                          Invited by {invitation.invited_by.full_name} • {invitation.role}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(invitation.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptInvitation(invitation.id)}
                        >
                          Accept
                        </Button>
                        <Button variant="outline" size="sm">
                          Decline
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Mail className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Invitations</h3>
                  <p className="text-gray-600">
                    You don't have any pending team invitations
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Team Management Modal */}
        {selectedTeam && (
          <Dialog open={!!selectedTeam} onOpenChange={() => setSelectedTeam(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  {selectedTeam.name} - Team Management
                </DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="members" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="members">Members</TabsTrigger>
                  <TabsTrigger value="invite">Invite</TabsTrigger>
                </TabsList>
                
                <TabsContent value="members" className="space-y-4">
                  <div className="space-y-2">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={member.user.avatar_url || ''} />
                            <AvatarFallback>
                              {member.user.full_name?.charAt(0) || member.user.email.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.user.full_name}</p>
                            <p className="text-sm text-gray-600">{member.user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getRoleColor(member.role)}>
                            {member.role}
                          </Badge>
                          {selectedTeam.user_role === 'owner' && member.role !== 'owner' && (
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="invite" className="space-y-4">
                  <div>
                    <Label htmlFor="invite_email">Email Address</Label>
                    <Input
                      id="invite_email"
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="invite_role">Role</Label>
                    <Select
                      value={inviteForm.role}
                      onValueChange={(value) => setInviteForm(prev => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleInviteMember} className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invitation
                  </Button>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default Profile; 