import { useState, useEffect } from 'react';
import { Users, Plus, Settings, UserPlus, Crown, Shield, User, Eye, Edit, Trash2, Mail, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  updated_at: string;
  member_count: number;
  user_role: string;
  is_owner: boolean;
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

const Teams = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamInvitations, setTeamInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  
  // Form states
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
      fetchTeams();
    }
  }, [user]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      
      // First, check if the teams table exists
      const { error: tableCheckError } = await supabase
        .from('teams')
        .select('id')
        .limit(1);
      
      // If the table doesn't exist yet, handle gracefully
      if (tableCheckError) {
        console.log('Teams table might not exist yet:', tableCheckError);
        setTeams([]);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          member_count:team_members(count),
          user_role:team_members(role)
        `)
        .eq('team_members.user_id', user!.id);

      // If there's an error with the join, try a simpler query
      if (error) {
        console.log('Error with team members join, trying simpler query:', error);
        
        const { data: basicData, error: basicError } = await supabase
          .from('teams')
          .select('*');
        
        if (basicError) {
          console.error('Error fetching teams:', basicError);
          toast({
            title: "Error",
            description: "Failed to load teams",
            variant: "destructive",
          });
          setTeams([]);
        } else {
          const transformedTeams = basicData?.map(team => ({
            ...team,
            member_count: 0,
            user_role: team.owner_id === user!.id ? 'owner' : 'member',
            is_owner: team.owner_id === user!.id
          })) || [];
          
          setTeams(transformedTeams);
        }
      } else {
        const transformedTeams = data?.map(team => ({
          ...team,
          member_count: team.member_count?.[0]?.count || 0,
          user_role: team.user_role?.[0]?.role || 'member',
          is_owner: team.owner_id === user!.id
        })) || [];
        
        setTeams(transformedTeams);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: "Error",
        description: "Failed to load teams",
        variant: "destructive",
      });
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async (teamId: string) => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          user:profiles(email, full_name, avatar_url)
        `)
        .eq('team_id', teamId);

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const fetchTeamInvitations = async (teamId: string) => {
    try {
      const { data, error } = await supabase
        .from('team_invitations')
        .select(`
          *,
          invited_by:profiles(full_name)
        `)
        .eq('team_id', teamId)
        .eq('status', 'pending');

      if (error) throw error;
      setTeamInvitations(data || []);
    } catch (error) {
      console.error('Error fetching team invitations:', error);
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
      fetchTeamInvitations(selectedTeam.id);
    } catch (error) {
      console.error('Error inviting member:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Team deleted successfully",
      });

      fetchTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
      toast({
        title: "Error",
        description: "Failed to delete team",
        variant: "destructive",
      });
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member role updated",
      });

      if (selectedTeam) {
        fetchTeamMembers(selectedTeam.id);
      }
    } catch (error) {
      console.error('Error updating member role:', error);
      toast({
        title: "Error",
        description: "Failed to update member role",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member removed from team",
      });

      if (selectedTeam) {
        fetchTeamMembers(selectedTeam.id);
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove member",
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-3 w-3" />;
      case 'admin': return <Shield className="h-3 w-3" />;
      case 'member': return <User className="h-3 w-3" />;
      case 'viewer': return <Eye className="h-3 w-3" />;
      default: return <User className="h-3 w-3" />;
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-2">
            Create and manage research teams for collaboration
          </p>
        </div>
        <Button onClick={() => setShowCreateTeam(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </div>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Card key={team.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={team.avatar_url || ''} />
                      <AvatarFallback>
                        {team.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{team.name}</CardTitle>
                      <CardDescription className="truncate">
                        {team.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={getRoleColor(team.user_role)}>
                    {getRoleIcon(team.user_role)}
                    <span className="ml-1">{team.user_role}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Team Info */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {team.member_count} members
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(team.created_at)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedTeam(team);
                      fetchTeamMembers(team.id);
                      fetchTeamInvitations(team.id);
                    }}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Manage
                  </Button>
                  {team.is_owner && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteTeam(team.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Team Dialog */}
      <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
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

      {/* Team Management Dialog */}
      {selectedTeam && (
        <Dialog open={!!selectedTeam} onOpenChange={() => setSelectedTeam(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {selectedTeam.name} - Team Management
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="members" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="invite">Invite</TabsTrigger>
              </TabsList>
              
              <TabsContent value="members" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Team Members ({teamMembers.length})</h3>
                  {(selectedTeam.user_role === 'owner' || selectedTeam.user_role === 'admin') && (
                    <Button onClick={() => setShowInviteMember(true)} size="sm">
                      <UserPlus className="h-4 w-4 mr-1" />
                      Invite Member
                    </Button>
                  )}
                </div>
                
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <Card key={member.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={member.user.avatar_url || ''} />
                            <AvatarFallback>
                              {member.user.full_name?.charAt(0) || member.user.email.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{member.user.full_name}</h4>
                            <p className="text-sm text-gray-600">{member.user.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getRoleColor(member.role)}>
                                {getRoleIcon(member.role)}
                                <span className="ml-1">{member.role}</span>
                              </Badge>
                              <span className="text-xs text-gray-500">
                                Joined {formatDate(member.joined_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                        {(selectedTeam.user_role === 'owner' || selectedTeam.user_role === 'admin') && member.role !== 'owner' && (
                          <div className="flex items-center space-x-2">
                            <Select
                              value={member.role}
                              onValueChange={(value) => handleUpdateMemberRole(member.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="invite" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Pending Invitations ({teamInvitations.length})</h3>
                </div>
                
                {teamInvitations.length > 0 ? (
                  <div className="space-y-3">
                    {teamInvitations.map((invitation) => (
                      <Card key={invitation.id}>
                        <CardContent className="flex items-center justify-between p-4">
                          <div>
                            <h4 className="font-medium">{invitation.email}</h4>
                            <p className="text-sm text-gray-600">
                              Invited by {invitation.invited_by.full_name} • {invitation.role}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(invitation.created_at)}
                            </p>
                          </div>
                          <Badge variant="outline">
                            <Mail className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Invitations</h3>
                    <p className="text-gray-600">
                      All invitations have been accepted or expired
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Invite Member Dialog */}
      <Dialog open={showInviteMember} onOpenChange={setShowInviteMember}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
            <div className="flex space-x-2">
              <Button onClick={handleInviteMember}>Send Invitation</Button>
              <Button variant="outline" onClick={() => setShowInviteMember(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Teams; 