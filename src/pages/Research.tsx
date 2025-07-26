import { useState, useEffect } from 'react';
import { Plus, FolderOpen, Settings, Users, Calendar, FileText, Brain, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import ResearchForm from '@/components/research/ResearchForm';
import { ProjectChat } from '@/components/chat/ProjectChat';

interface ResearchProject {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'active' | 'completed' | 'paused';
  industry?: string;
  sub_industry?: string;
  tags?: string[];
  custom_fields: any[];
  documents: string[];
  created_at: string;
  updated_at: string;
  document_count?: number;
}

const Research = () => {
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedProjectForChat, setSelectedProjectForChat] = useState<{ id: string; title: string } | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('research_projects')
        .select(`
          *,
          document_count:project_documents(count)
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to flatten document count
      const transformedData = data?.map(project => ({
        ...project,
        document_count: project.document_count?.[0]?.count || 0
      })) || [];

      setProjects(transformedData);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to load research projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || project.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'market research': return '📊';
      case 'financial analysis': return '💰';
      case 'competitive analysis': return '🏆';
      case 'technical research': return '⚙️';
      case 'industry report': return '📈';
      case 'academic research': return '🎓';
      default: return '📄';
    }
  };

  const handleProjectSave = (project: any) => {
    setShowCreateDialog(false);
    fetchProjects(); // Refresh the list
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading research projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Research Projects</h1>
          <p className="text-gray-600 mt-2">
            Manage your research projects and associated documents
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Research
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Research Project</DialogTitle>
            </DialogHeader>
            <ResearchForm onSave={handleProjectSave} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Market Research">Market Research</SelectItem>
                <SelectItem value="Financial Analysis">Financial Analysis</SelectItem>
                <SelectItem value="Competitive Analysis">Competitive Analysis</SelectItem>
                <SelectItem value="Technical Research">Technical Research</SelectItem>
                <SelectItem value="Industry Report">Industry Report</SelectItem>
                <SelectItem value="Academic Research">Academic Research</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {projects.length === 0 ? 'No research projects yet' : 'No projects found'}
              </h3>
              <p className="text-gray-600 mb-4">
                {projects.length === 0 
                  ? 'Create your first research project to organize your research documents.'
                  : 'Try adjusting your search or filters.'
                }
              </p>
              {projects.length === 0 && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Project
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCategoryIcon(project.category)}</span>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{project.title}</CardTitle>
                      <CardDescription className="truncate">
                        {project.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Project Info */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(project.created_at)}
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {project.document_count} docs
                  </div>
                </div>

                {/* Industry Information */}
                {(project.industry || project.sub_industry) && (
                  <div className="flex items-center gap-2">
                    <Settings className="h-3 w-3 text-gray-500" />
                    <div className="flex flex-wrap gap-1">
                      {project.industry && (
                        <Badge variant="outline" className="text-xs">
                          {project.industry}
                        </Badge>
                      )}
                      {project.sub_industry && (
                        <Badge variant="secondary" className="text-xs">
                          {project.sub_industry}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {project.tags && project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {project.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {project.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{project.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                {/* Custom Fields Count */}
                {project.custom_fields && project.custom_fields.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Settings className="h-3 w-3 text-gray-500" />
                    <span className="text-xs text-gray-600">
                      {project.custom_fields.length} custom fields
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <FolderOpen className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setSelectedProjectForChat({ id: project.id, title: project.title })}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      {projects.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{projects.length}</div>
                <div className="text-sm text-gray-600">Total Projects</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {projects.filter(p => p.status === 'active').length}
                </div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {projects.filter(p => p.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {projects.filter(p => p.status === 'paused').length}
                </div>
                <div className="text-sm text-gray-600">Paused</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Chat Dialog */}
      {selectedProjectForChat && (
        <ProjectChat
          projectId={selectedProjectForChat.id}
          projectTitle={selectedProjectForChat.title}
          isOpen={!!selectedProjectForChat}
          onClose={() => setSelectedProjectForChat(null)}
          geminiApiKey={import.meta.env.VITE_GEMINI_API_KEY}
        />
      )}
    </div>
  );
};

export default Research; 