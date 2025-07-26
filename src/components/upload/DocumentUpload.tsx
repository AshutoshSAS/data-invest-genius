import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2, Brain, FolderPlus, FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { AIProcessingService } from '@/lib/ai';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  documentId?: string;
}

// Extended list of supported file types with more detailed extensions
const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt', '.text', '.md', '.markdown'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.oasis.opendocument.text': ['.odt'],
  'application/rtf': ['.rtf'],
  'text/csv': ['.csv'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.oasis.opendocument.spreadsheet': ['.ods'],
  'text/html': ['.html', '.htm'],
  'application/json': ['.json'],
  'application/xml': ['.xml'],
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const DocumentUpload = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [researchProjects, setResearchProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('none');
  const [fileTypeError, setFileTypeError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch user's research projects
  useEffect(() => {
    if (user) {
      fetchResearchProjects();
    }
  }, [user]);

  const fetchResearchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('research_projects')
        .select('id, title, category')
        .eq('user_id', user!.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResearchProjects(data || []);
    } catch (error) {
      console.error('Error fetching research projects:', error);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "Please log in to upload documents.",
        variant: "destructive",
      });
      return;
    }

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errorMessages = rejectedFiles.map(file => {
        const errors = file.errors.map((e: any) => e.message).join(', ');
        return `${file.file.name}: ${errors}`;
      });
      
      setFileTypeError(errorMessages.join('\n'));
      
      toast({
        title: "Invalid Files",
        description: `Some files were rejected: ${errorMessages[0]}${errorMessages.length > 1 ? ` and ${errorMessages.length - 1} more` : ''}`,
        variant: "destructive",
      });
    }

    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    setFileTypeError(null);
    
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0,
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    for (const file of acceptedFiles) {
      await uploadFile(file);
    }

    setIsUploading(false);
  }, [user, toast]);

  const uploadFile = async (file: File) => {
    const fileId = Math.random().toString(36).substr(2, 9);
    const fileName = `${user!.id}/${Date.now()}-${file.name}`;

    try {
      // Update progress to 10%
      setUploadedFiles(prev => 
        prev.map(f => 
          f.name === file.name ? { ...f, progress: 10 } : f
        )
      );

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('research-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Update progress to 30%
      setUploadedFiles(prev => 
        prev.map(f => 
          f.name === file.name ? { ...f, progress: 30 } : f
        )
      );

      // Create database record
      const { data: docData, error: docError } = await supabase
        .from('research_documents')
        .insert({
          user_id: user!.id,
          title: file.name,
          description: `Uploaded ${new Date().toLocaleDateString()}`,
          file_path: data.path,
          file_size: file.size,
          content_type: file.type || getMimeTypeFromFileName(file.name),
          category: getCategoryFromFileType(file.type || getMimeTypeFromFileName(file.name)),
          status: 'processing',
        })
        .select()
        .single();

      if (docError) throw docError;

      // Update progress to 50%
      setUploadedFiles(prev => 
        prev.map(f => 
          f.name === file.name ? { ...f, progress: 50 } : f
        )
      );

      // Associate with research project if selected
      if (selectedProject && selectedProject !== 'none' && docData) {
        await supabase
          .from('project_documents')
          .insert({
            project_id: selectedProject,
            document_id: docData.id,
          });
      }

      // Update file status to processing
      setUploadedFiles(prev => 
        prev.map(f => 
          f.name === file.name 
            ? { ...f, status: 'processing', progress: 60, documentId: docData.id }
            : f
        )
      );

      toast({
        title: "Upload Successful",
        description: `${file.name} has been uploaded. Starting AI analysis...`,
      });

      // Trigger AI processing
      try {
        await AIProcessingService.processDocument(docData.id);
        
        // Update file status to completed
        setUploadedFiles(prev => 
          prev.map(f => 
            f.name === file.name 
              ? { ...f, status: 'completed', progress: 100 }
              : f
          )
        );

        toast({
          title: "AI Analysis Complete",
          description: `${file.name} has been analyzed and is ready for use.`,
        });
      } catch (error) {
        console.error('AI processing failed:', error);
        
        // Update file status to error
        setUploadedFiles(prev => 
          prev.map(f => 
            f.name === file.name 
              ? { ...f, status: 'error', error: 'AI processing failed' }
              : f
          )
        );

        toast({
          title: "AI Processing Failed",
          description: `${file.name} was uploaded but AI analysis failed. You can still view the document.`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Upload error:', error);
      
      setUploadedFiles(prev => 
        prev.map(f => 
          f.name === file.name 
            ? { ...f, status: 'error', error: 'Upload failed' }
            : f
        )
      );

      toast({
        title: "Upload Failed",
        description: `Failed to upload ${file.name}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const getMimeTypeFromFileName = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    // Map extension to MIME type
    for (const [mimeType, extensions] of Object.entries(ACCEPTED_FILE_TYPES)) {
      if (extensions.some(ext => ext.toLowerCase() === `.${extension}`)) {
        return mimeType;
      }
    }
    
    // Default to text/plain for unknown extensions
    return 'text/plain';
  };

  const getCategoryFromFileType = (type: string): string => {
    if (type.includes('pdf')) return 'Research Paper';
    if (type.includes('word') || type.includes('document') || type.includes('odt') || type.includes('rtf')) return 'Report';
    if (type.includes('excel') || type.includes('spreadsheet') || type.includes('csv') || type.includes('ods')) return 'Data';
    if (type.includes('text') || type.includes('plain') || type.includes('markdown') || type.includes('md')) return 'Document';
    if (type.includes('html') || type.includes('xml') || type.includes('json')) return 'Web Content';
    return 'Other';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileIcon className="h-8 w-8 text-red-500" />;
    if (fileType.includes('word') || fileType.includes('document') || fileType.includes('odt')) return <FileIcon className="h-8 w-8 text-blue-500" />;
    if (fileType.includes('excel') || fileType.includes('spreadsheet') || fileType.includes('csv')) return <FileIcon className="h-8 w-8 text-green-500" />;
    if (fileType.includes('text') || fileType.includes('plain')) return <FileText className="h-8 w-8 text-gray-500" />;
    return <FileText className="h-8 w-8 text-blue-500" />;
  };

  const getFileTypeLabel = (fileType: string): string => {
    if (fileType.includes('pdf')) return 'PDF Document';
    if (fileType.includes('vnd.openxmlformats-officedocument.wordprocessingml.document')) return 'Word Document (DOCX)';
    if (fileType.includes('msword')) return 'Word Document (DOC)';
    if (fileType.includes('odt')) return 'OpenDocument Text';
    if (fileType.includes('rtf')) return 'Rich Text Format';
    if (fileType.includes('vnd.openxmlformats-officedocument.spreadsheetml.sheet')) return 'Excel Spreadsheet (XLSX)';
    if (fileType.includes('vnd.ms-excel')) return 'Excel Spreadsheet (XLS)';
    if (fileType.includes('csv')) return 'CSV File';
    if (fileType.includes('ods')) return 'OpenDocument Spreadsheet';
    if (fileType.includes('text/plain')) return 'Text File';
    if (fileType.includes('markdown') || fileType.includes('md')) return 'Markdown File';
    if (fileType.includes('html')) return 'HTML File';
    if (fileType.includes('xml')) return 'XML File';
    if (fileType.includes('json')) return 'JSON File';
    return fileType || 'Unknown File Type';
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  });

  // Get list of supported file extensions for display
  const supportedExtensions = Object.values(ACCEPTED_FILE_TYPES).flat().join(', ');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Research Documents
          </CardTitle>
          <CardDescription>
            Upload research documents in various formats for AI-powered analysis.
            Maximum file size: 50MB
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Research Project Selection */}
          {researchProjects.length > 0 && (
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Associate with Research Project (Optional)
              </label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a research project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project association</SelectItem>
                  {researchProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title} ({project.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : fileTypeError
                ? 'border-red-300 hover:border-red-400'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className={`h-12 w-12 mx-auto mb-4 ${fileTypeError ? 'text-red-400' : 'text-gray-400'}`} />
            {isDragActive ? (
              <p className="text-lg font-medium text-blue-600">Drop files here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-sm text-gray-500 mb-2">
                  Supports {supportedExtensions} files
                </p>
                {fileTypeError && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                    <p className="font-medium mb-1">Error:</p>
                    <p>{fileTypeError}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="bg-red-50">PDF</Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>PDF Documents</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="bg-blue-50">Word</Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>DOC, DOCX, ODT, RTF</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="bg-green-50">Excel</Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>XLS, XLSX, CSV, ODS</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="bg-gray-50">Text</Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>TXT, MD, Markdown</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="bg-purple-50">Web</Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>HTML, XML, JSON</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Upload Queue ({uploadedFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{file.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                          {getFileTypeLabel(file.type)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {file.status === 'uploading' && (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <Progress value={file.progress} className="w-20" />
                      </div>
                    )}

                    {file.status === 'processing' && (
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 animate-pulse text-blue-500" />
                        <Progress value={file.progress} className="w-20" />
                      </div>
                    )}

                    {file.status === 'completed' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}

                    {file.status === 'error' && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{file.error || 'An error occurred'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    <Badge
                      variant={
                        file.status === 'completed'
                          ? 'default'
                          : file.status === 'error'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {file.status}
                    </Badge>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      disabled={file.status === 'uploading'}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 