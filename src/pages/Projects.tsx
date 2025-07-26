import { useState, useEffect } from 'react';
import { Plus, FolderOpen, Settings, Users, Calendar, FileText, Brain, MessageSquare, Link, Unlink, Eye, Edit, Trash2, RefreshCw, Building } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  linked_documents?: LinkedDocument[];
}

interface LinkedDocument {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  ai_summary?: string;
  created_at: string;
}

interface AvailableDocument {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  created_at: string;
  is_linked: boolean;
}

const Projects = () => {
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [availableDocuments, setAvailableDocuments] = useState<AvailableDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showLinkDocuments, setShowLinkDocuments] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ResearchProject | null>(null);
  const [selectedProjectForChat, setSelectedProjectForChat] = useState<{ id: string; title: string } | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchAvailableDocuments();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('research_projects')
        .select(`
          *,
          document_count:project_documents(count),
          linked_documents:project_documents(
            document:research_documents(
              id,
              title,
              description,
              category,
              status,
              ai_summary,
              created_at
            )
          )
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to flatten document count and linked documents
      const transformedData = data?.map(project => {
        // Extract metadata from custom_fields
        const customFields = project.custom_fields || [];
        const tagsField = customFields.find((field: any) => field.id === 'tags');
        const industryField = customFields.find((field: any) => field.id === 'industry');
        const subIndustryField = customFields.find((field: any) => field.id === 'subIndustry');
        
        return {
          ...project,
          industry: industryField?.value || project.industry || '',
          sub_industry: subIndustryField?.value || project.sub_industry || '',
          tags: tagsField?.value || project.tags || [],
          document_count: project.document_count?.[0]?.count || 0,
          linked_documents: project.linked_documents?.map((ld: any) => ld.document) || []
        };
      }) || [];

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

  const fetchAvailableDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('research_documents')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Mark documents as linked if they're already in the selected project
      const documentsWithLinkStatus = data?.map(doc => ({
        ...doc,
        is_linked: selectedProject?.linked_documents?.some(ld => ld.id === doc.id) || false
      })) || [];

      setAvailableDocuments(documentsWithLinkStatus);
    } catch (error) {
      console.error('Error fetching available documents:', error);
    }
  };

  const handleLinkDocument = async (documentId: string) => {
    if (!selectedProject) return;

    try {
      const { error } = await supabase
        .from('project_documents')
        .insert({
          project_id: selectedProject.id,
          document_id: documentId
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Document linked to project",
      });

      fetchProjects();
      fetchAvailableDocuments();
    } catch (error) {
      console.error('Error linking document:', error);
      toast({
        title: "Error",
        description: "Failed to link document",
        variant: "destructive",
      });
    }
  };

  const handleUnlinkDocument = async (documentId: string) => {
    if (!selectedProject) return;

    try {
      const { error } = await supabase
        .from('project_documents')
        .delete()
        .eq('project_id', selectedProject.id)
        .eq('document_id', documentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Document unlinked from project",
      });

      fetchProjects();
      fetchAvailableDocuments();
    } catch (error) {
      console.error('Error unlinking document:', error);
      toast({
        title: "Error",
        description: "Failed to unlink document",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('research_projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project deleted successfully",
      });

      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || project.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

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
      case 'technology': return '⚡';
      case 'healthcare': return '🏥';
      case 'energy': return '⚡';
      case 'real estate': return '🏢';
      default: return '📁';
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
          <p className="text-gray-600">Loading projects...</p>
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
            Organize and manage your research projects
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Market Research">Market Research</SelectItem>
                <SelectItem value="Financial Analysis">Financial Analysis</SelectItem>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="Energy">Energy</SelectItem>
                <SelectItem value="Real Estate">Real Estate</SelectItem>
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
                {projects.length === 0 ? 'No projects yet' : 'No projects found'}
              </h3>
              <p className="text-gray-600 mb-4">
                {projects.length === 0 
                  ? 'Create your first research project to organize your documents and research.'
                  : 'Try adjusting your search or filters.'
                }
              </p>
              {projects.length === 0 && (
                <Button onClick={() => setShowCreateDialog(true)}>
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
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {project.document_count} documents
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(project.created_at)}
                  </div>
                </div>

                {/* Industry & Tags */}
                {project.industry && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      <Building className="h-3 w-3 mr-1" />
                      {project.industry}
                    </Badge>
                    {project.sub_industry && (
                      <Badge variant="secondary" className="text-xs">
                        {project.sub_industry}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Tags */}
                {project.tags && project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {project.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
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

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setSelectedProject(project)}
                  >
                    <Link className="h-4 w-4 mr-1" />
                    Manage
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
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteProject(project.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create New Research Project</DialogTitle>
          </DialogHeader>
          <ResearchForm 
            onSave={(savedProject) => {
              setShowCreateDialog(false);
              fetchProjects();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Project Management Dialog */}
      {selectedProject && (
        <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
          <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                {selectedProject.title} - Project Management
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="documents" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="documents">Linked Documents</TabsTrigger>
                <TabsTrigger value="link">Link Documents</TabsTrigger>
              </TabsList>
              
              <TabsContent value="documents" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Linked Documents ({selectedProject.linked_documents?.length || 0})</h3>
                </div>
                
                {selectedProject.linked_documents && selectedProject.linked_documents.length > 0 ? (
                  <div className="space-y-3">
                    {selectedProject.linked_documents.map((doc) => (
                      <Card key={doc.id}>
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">{getCategoryIcon(doc.category)}</div>
                            <div>
                              <h4 className="font-medium">{doc.title}</h4>
                              <p className="text-sm text-gray-600">{doc.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {doc.category}
                                </Badge>
                                <Badge className={getStatusColor(doc.status)}>
                                  {doc.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUnlinkDocument(doc.id)}
                            >
                              <Unlink className="h-4 w-4 mr-1" />
                              Unlink
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Linked</h3>
                    <p className="text-gray-600 mb-4">
                      Link documents to this project to organize your research
                    </p>
                    <Button onClick={() => setShowLinkDocuments(true)}>
                      <Link className="h-4 w-4 mr-2" />
                      Link Documents
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="link" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Available Documents</h3>
                  <Button onClick={fetchAvailableDocuments} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh
                  </Button>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {availableDocuments.map((doc) => (
                    <Card key={doc.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{getCategoryIcon(doc.category)}</div>
                          <div>
                            <h4 className="font-medium">{doc.title}</h4>
                            <p className="text-sm text-gray-600">{doc.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {doc.category}
                              </Badge>
                              <Badge className={getStatusColor(doc.status)}>
                                {doc.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant={doc.is_linked ? "outline" : "default"}
                          size="sm"
                          onClick={() => doc.is_linked ? handleUnlinkDocument(doc.id) : handleLinkDocument(doc.id)}
                          disabled={doc.status === 'processing'}
                        >
                          {doc.is_linked ? (
                            <>
                              <Unlink className="h-4 w-4 mr-1" />
                              Unlink
                            </>
                          ) : (
                            <>
                              <Link className="h-4 w-4 mr-1" />
                              Link
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Project Chat Dialog */}
      {selectedProjectForChat && (
        <Dialog open={!!selectedProjectForChat} onOpenChange={() => setSelectedProjectForChat(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Chat with {selectedProjectForChat.title}</DialogTitle>
            </DialogHeader>
            <ProjectChat projectId={selectedProjectForChat.id} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Projects; 