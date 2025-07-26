import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  MessageSquare, 
  TrendingUp, 
  Database,
  Upload,
  Tag,
  BarChart3,
  Clock,
  Users,
  Bot,
  FolderOpen,
  ChevronRight,
  Calendar,
  RefreshCw
} from "lucide-react";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface DashboardStats {
  documentCount: number;
  projectCount: number;
  chatCount: number;
  tagCount: number;
  recentActivity: {
    type: string;
    title: string;
    time: string;
    user: string;
    tags?: string[];
  }[];
  recentDocuments: {
    id: string;
    title: string;
    category: string;
    status: string;
    created_at: string;
  }[];
  recentProjects: {
    id: string;
    title: string;
    category: string;
    status: string;
    created_at: string;
  }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Document count
      const { count: documentCount, error: docError } = await supabase
        .from('research_documents')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id);

      if (docError) {
        console.error('Error fetching document count:', docError);
      }

      // Project count
      const { count: projectCount, error: projError } = await supabase
        .from('research_projects')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id);

      if (projError) {
        console.error('Error fetching project count:', projError);
      }

      // Chat count - This might fail if table doesn't exist yet
      let chats = 0;
      try {
        const { count: chatCount, error: chatError } = await supabase
          .from('chat_history')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user!.id);

        if (!chatError) {
          chats = chatCount || 0;
        }
      } catch (chatErr) {
        console.log('Chat history table may not exist yet:', chatErr);
      }

      // Recent documents
      let recentDocs: any[] = [];
      try {
        const { data: docsData, error: recentDocsError } = await supabase
          .from('research_documents')
          .select('id, title, category, status, created_at')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (!recentDocsError) {
          recentDocs = docsData || [];
        } else {
          console.error('Error fetching recent documents:', recentDocsError);
        }
      } catch (docsErr) {
        console.error('Exception fetching documents:', docsErr);
      }

      // Recent projects
      let recentProjs: any[] = [];
      try {
        const { data: projsData, error: recentProjsError } = await supabase
          .from('research_projects')
          .select('id, title, category, status, created_at')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (!recentProjsError) {
          recentProjs = projsData || [];
        } else {
          console.error('Error fetching recent projects:', recentProjsError);
        }
      } catch (projsErr) {
        console.error('Exception fetching projects:', projsErr);
      }

      // Count unique tags
      const uniqueTags = new Set<string>();
      try {
        const { data: tagsData, error: tagsError } = await supabase
          .from('research_documents')
          .select('tags')
          .eq('user_id', user!.id)
          .not('tags', 'is', null);

        if (!tagsError && tagsData) {
          tagsData.forEach(doc => {
            if (Array.isArray(doc.tags)) {
              doc.tags.forEach((tag: string) => uniqueTags.add(tag));
            }
          });
        }
      } catch (tagsErr) {
        console.error('Exception fetching tags:', tagsErr);
      }

      // Generate recent activity from documents and projects
      const recentActivity = [
        ...(recentDocs || []).map(doc => ({
          type: 'upload',
          title: `${doc.title} uploaded`,
          time: formatTimeAgo(doc.created_at),
          user: 'You',
          tags: []
        })),
        ...(recentProjs || []).map(proj => ({
          type: 'project',
          title: `Project "${proj.title}" created`,
          time: formatTimeAgo(proj.created_at),
          user: 'You',
          tags: []
        }))
      ].sort((a, b) => {
        // Sort by time (most recent first)
        const timeA = parseTimeAgo(a.time);
        const timeB = parseTimeAgo(b.time);
        return timeA - timeB;
      }).slice(0, 5);

      setStats({
        documentCount: documentCount || 0,
        projectCount: projectCount || 0,
        chatCount: chats,
        tagCount: uniqueTags.size,
        recentActivity,
        recentDocuments: recentDocs || [],
        recentProjects: recentProjs || []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Some dashboard data could not be loaded",
        variant: "destructive",
      });
      
      // Set default stats even if there's an error
      setStats({
        documentCount: 0,
        projectCount: 0,
        chatCount: 0,
        tagCount: 0,
        recentActivity: [],
        recentDocuments: [],
        recentProjects: []
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const parseTimeAgo = (timeAgo: string): number => {
    if (timeAgo === 'just now') return 0;
    if (timeAgo.includes('minutes')) return parseInt(timeAgo) * 60;
    if (timeAgo.includes('hours')) return parseInt(timeAgo) * 3600;
    if (timeAgo.includes('days')) return parseInt(timeAgo) * 86400;
    return 999999; // Default to a large number for older dates
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'upload': return Upload;
      case 'chat': return MessageSquare;
      case 'project': return FolderOpen;
      case 'insight': return BarChart3;
      case 'tag': return Tag;
      default: return FileText;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'processed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Research Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            AI-powered research intelligence and analysis platform
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={() => navigate("/upload")}>
            <Upload className="h-4 w-4" />
            Upload
          </Button>
          <Button variant="outline" className="gap-2" onClick={fetchDashboardData}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button className="gap-2" onClick={() => navigate("/chat")}>
            <Bot className="h-4 w-4" />
            AI Chat
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Documents</p>
              <p className="text-2xl font-bold mt-1">{stats?.documentCount}</p>
              <p className="text-sm text-muted-foreground mt-1">Total research documents</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-blue-600">
              <FileText className="h-6 w-6" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Projects</p>
              <p className="text-2xl font-bold mt-1">{stats?.projectCount}</p>
              <p className="text-sm text-muted-foreground mt-1">Research projects</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-green-600">
              <FolderOpen className="h-6 w-6" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">AI Chats</p>
              <p className="text-2xl font-bold mt-1">{stats?.chatCount}</p>
              <p className="text-sm text-muted-foreground mt-1">AI conversations</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-purple-600">
              <MessageSquare className="h-6 w-6" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tags</p>
              <p className="text-2xl font-bold mt-1">{stats?.tagCount}</p>
              <p className="text-sm text-muted-foreground mt-1">Unique tags</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-orange-600">
              <Tag className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-1 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Recent Activity</span>
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                Live
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {stats.recentActivity.map((activity, index) => {
                  const Icon = getActivityIcon(activity.type);
                  return (
                    <div key={index} className="flex gap-3 pb-3 border-b last:border-0 last:pb-0">
                      <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4 w-4 text-accent-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight mb-1">
                          {activity.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <Users className="h-3 w-3" />
                          <span>{activity.user}</span>
                          <span>•</span>
                          <span>{activity.time}</span>
                        </div>
                        {activity.tags && activity.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {activity.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-muted-foreground">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Content Tabs */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Recent Content</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="documents">
                <TabsList className="mb-4">
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="projects">Projects</TabsTrigger>
                </TabsList>
                
                <TabsContent value="documents">
                  {stats?.recentDocuments && stats.recentDocuments.length > 0 ? (
                    <div className="space-y-2">
                      {stats.recentDocuments.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="font-medium">{doc.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {doc.category}
                                </Badge>
                                <Badge className={getStatusColor(doc.status)}>
                                  {doc.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatTimeAgo(doc.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-muted-foreground">No documents yet</p>
                      <Button variant="outline" className="mt-4" onClick={() => navigate("/upload")}>
                        Upload Your First Document
                      </Button>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="projects">
                  {stats?.recentProjects && stats.recentProjects.length > 0 ? (
                    <div className="space-y-2">
                      {stats.recentProjects.map((project, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <FolderOpen className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="font-medium">{project.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {project.category}
                                </Badge>
                                <Badge className={getStatusColor(project.status)}>
                                  {project.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatTimeAgo(project.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FolderOpen className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-muted-foreground">No projects yet</p>
                      <Button variant="outline" className="mt-4" onClick={() => navigate("/projects")}>
                        Create Your First Project
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => navigate("/upload")}>
            <Upload className="h-6 w-6" />
            <span>Upload Document</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2 relative" onClick={() => navigate("/chat")}>
            <MessageSquare className="h-6 w-6" />
            <span>AI Chat</span>
            <Badge variant="secondary" className="absolute -top-1 -right-1 text-xs">
              Soon
            </Badge>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => navigate("/projects")}>
            <FolderOpen className="h-6 w-6" />
            <span>Projects</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => navigate("/analytics")}>
            <BarChart3 className="h-6 w-6" />
            <span>Analytics</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}