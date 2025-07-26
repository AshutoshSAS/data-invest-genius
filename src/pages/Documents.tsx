import { useState, useEffect } from 'react';
import { FileText, Search, Filter, Eye, MessageSquare, Calendar, Tag, Brain, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { DocumentChat } from '@/components/chat/DocumentChat';
import { AIProcessingService } from '@/lib/ai';

interface Document {
  id: string;
  title: string;
  description: string;
  file_path: string;
  file_size: number;
  content_type: string;
  category: string;
  status: 'processing' | 'completed' | 'error';
  ai_summary?: string;
  created_at: string;
  tags?: { name: string }[];
  project?: {
    id: string;
    title: string;
    category: string;
  };
}

const Documents = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [processingDocuments, setProcessingDocuments] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('research_documents')
        .select(`
          *,
          tags:document_tags(
            tag:tags(name)
          ),
          project:project_documents(
            project:research_projects(
              id,
              title,
              category
            )
          )
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to flatten tags and project
      const transformedData = data?.map(doc => ({
        ...doc,
        tags: doc.tags?.map((t: any) => ({ name: t.tag.name })) || [],
        project: doc.project?.[0]?.project || null
      })) || [];

      setDocuments(transformedData);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags?.some(tag => tag.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'research paper': return '📄';
      case 'financial report': return '📊';
      case 'market analysis': return '📈';
      case 'technical document': return '⚙️';
      case 'news article': return '📰';
      default: return '📄';
    }
  };

  const handleReprocessDocument = async (documentId: string) => {
    setProcessingDocuments(prev => new Set(prev).add(documentId));
    
    try {
      console.log(`Reprocessing document ${documentId}...`);
      await AIProcessingService.processDocument(documentId);
      toast({
        title: "Success",
        description: "Document processed successfully",
      });
      fetchDocuments(); // Refresh the list
    } catch (error) {
      console.error('Error reprocessing document:', error);
      toast({
        title: "Error",
        description: `Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setProcessingDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  const handleReprocessAllStuckDocuments = async () => {
    const stuckDocuments = documents.filter(doc => doc.status === 'processing');
    if (stuckDocuments.length === 0) {
      toast({
        title: "No Documents to Process",
        description: "All documents are already processed or failed.",
      });
      return;
    }

    toast({
      title: "Processing Started",
      description: `Reprocessing ${stuckDocuments.length} documents...`,
    });

    for (const doc of stuckDocuments) {
      try {
        console.log(`Reprocessing document ${doc.id} (${doc.title})...`);
        await AIProcessingService.processDocument(doc.id);
        console.log(`Successfully processed ${doc.title}`);
      } catch (error) {
        console.error(`Failed to process ${doc.title}:`, error);
      }
    }

    toast({
      title: "Processing Complete",
      description: "All documents have been reprocessed. Check the list for updated status.",
    });
    
    fetchDocuments(); // Refresh the list
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
          <p className="text-gray-600 mt-2">
            View and manage your uploaded research documents
          </p>
        </div>
        <div className="flex gap-2">
          {documents.filter(doc => doc.status === 'processing').length > 0 && (
            <Button 
              variant="outline" 
              onClick={handleReprocessAllStuckDocuments}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reprocess All ({documents.filter(doc => doc.status === 'processing').length})
            </Button>
          )}
          <Button onClick={() => window.location.href = '/upload'}>
            <FileText className="h-4 w-4 mr-2" />
            Upload New
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search documents, tags..."
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
                <SelectItem value="Research Paper">Research Paper</SelectItem>
                <SelectItem value="Financial Report">Financial Report</SelectItem>
                <SelectItem value="Market Analysis">Market Analysis</SelectItem>
                <SelectItem value="Technical Document">Technical Document</SelectItem>
                <SelectItem value="News Article">News Article</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {documents.length === 0 ? 'No documents yet' : 'No documents found'}
              </h3>
              <p className="text-gray-600 mb-4">
                {documents.length === 0 
                  ? 'Upload your first research document to get started with AI analysis.'
                  : 'Try adjusting your search or filters.'
                }
              </p>
              {documents.length === 0 && (
                <Button onClick={() => window.location.href = '/upload'}>
                  Upload Your First Document
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCategoryIcon(doc.category)}</span>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{doc.title}</CardTitle>
                      <CardDescription className="truncate">
                        {doc.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusColor(doc.status)}>
                    {doc.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* AI Summary */}
                {doc.ai_summary && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-1">
                      <Brain className="h-3 w-3" />
                      AI Summary
                    </h4>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {doc.ai_summary}
                    </p>
                  </div>
                )}

                {/* AI Analysis Details - Removed since ai_analysis column doesn't exist */}

                {/* Project Association */}
                {doc.project && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      <FileText className="h-3 w-3 mr-1" />
                      {doc.project.title}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {doc.project.category}
                    </Badge>
                  </div>
                )}

                {/* Tags with View All */}
                {doc.tags && doc.tags.length > 0 && (
                  <div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {doc.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag.name}
                        </Badge>
                      ))}
                      {doc.tags.length > 3 && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-gray-100">
                              +{doc.tags.length - 3} more
                            </Badge>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>All Tags for "{doc.title}"</DialogTitle>
                            </DialogHeader>
                            <div className="flex flex-wrap gap-2">
                              {doc.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {tag.name}
                                </Badge>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                )}

                {/* Document Info */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(doc.created_at)}
                  </div>
                  <span>{formatFileSize(doc.file_size)}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setSelectedDocument(doc)}
                    disabled={false}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Chat
                  </Button>
                  {doc.status === 'processing' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleReprocessDocument(doc.id)}
                      disabled={processingDocuments.has(doc.id)}
                    >
                      {processingDocuments.has(doc.id) ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      {documents.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{documents.length}</div>
                <div className="text-sm text-gray-600">Total Documents</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {documents.filter(d => d.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {documents.filter(d => d.status === 'processing').length}
                </div>
                <div className="text-sm text-gray-600">Processing</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {documents.filter(d => d.status === 'error').length}
                </div>
                <div className="text-sm text-gray-600">Error</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Chat Modal */}
      {selectedDocument && (
        <DocumentChat
          documentId={selectedDocument.id}
          documentTitle={selectedDocument.title}
          onClose={() => setSelectedDocument(null)}
          geminiApiKey={import.meta.env.VITE_GEMINI_API_KEY}
        />
      )}
    </div>
  );
};

export default Documents; 