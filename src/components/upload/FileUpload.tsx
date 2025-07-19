import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface UploadedFile {
  id: string;
  file: File;
  status: "uploading" | "processing" | "completed" | "error";
  progress: number;
  tags: string[];
  category: string;
  description: string;
}

const fileCategories = [
  "Investment Reports",
  "Market Research", 
  "Financial Statements",
  "Term Sheets",
  "Due Diligence",
  "Industry Analysis",
  "Competitor Research",
  "Regulatory Filings"
];

export function FileUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [defaultCategory, setDefaultCategory] = useState("");
  const [defaultDescription, setDefaultDescription] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: "uploading",
      progress: 0,
      tags: selectedTags,
      category: defaultCategory,
      description: defaultDescription,
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Simulate upload and processing
    newFiles.forEach(fileData => {
      simulateUpload(fileData.id);
    });
  }, [selectedTags, defaultCategory, defaultDescription]);

  const simulateUpload = (fileId: string) => {
    const intervals = [];
    
    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setFiles(prev => prev.map(f => {
        if (f.id === fileId && f.status === "uploading") {
          const newProgress = Math.min(f.progress + Math.random() * 15, 100);
          if (newProgress >= 100) {
            clearInterval(uploadInterval);
            setTimeout(() => {
              setFiles(prev => prev.map(f => 
                f.id === fileId ? { ...f, status: "processing", progress: 0 } : f
              ));
              simulateProcessing(fileId);
            }, 500);
            return { ...f, progress: 100 };
          }
          return { ...f, progress: newProgress };
        }
        return f;
      }));
    }, 200);

    intervals.push(uploadInterval);
  };

  const simulateProcessing = (fileId: string) => {
    const processingInterval = setInterval(() => {
      setFiles(prev => prev.map(f => {
        if (f.id === fileId && f.status === "processing") {
          const newProgress = Math.min(f.progress + Math.random() * 10, 100);
          if (newProgress >= 100) {
            clearInterval(processingInterval);
            return { ...f, status: "completed", progress: 100 };
          }
          return { ...f, progress: newProgress };
        }
        return f;
      }));
    }, 300);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
    },
    multiple: true,
  });

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const addTag = () => {
    if (newTag && !selectedTags.includes(newTag)) {
      setSelectedTags(prev => [...prev, newTag]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  const getStatusIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading":
      case "processing":
        return <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusText = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading":
        return "Uploading...";
      case "processing":
        return "Processing with AI...";
      case "completed":
        return "Ready for analysis";
      case "error":
        return "Upload failed";
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Configuration */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Upload Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Default Category</Label>
            <Select value={defaultCategory} onValueChange={setDefaultCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {fileCategories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Default Description</Label>
            <Input
              id="description"
              value={defaultDescription}
              onChange={(e) => setDefaultDescription(e.target.value)}
              placeholder="Brief description for uploaded files"
            />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Label>Default Tags</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedTags.map(tag => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-3 w-3 p-0"
                  onClick={() => removeTag(tag)}
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add tag..."
              onKeyPress={(e) => e.key === "Enter" && addTag()}
              className="flex-1"
            />
            <Button onClick={addTag} variant="outline">Add</Button>
          </div>
        </div>
      </Card>

      {/* Drop Zone */}
      <Card className="p-6">
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
            isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          {isDragActive ? (
            <p className="text-lg font-medium text-primary">Drop files here...</p>
          ) : (
            <div>
              <p className="text-lg font-medium mb-2">Drag & drop research files here</p>
              <p className="text-muted-foreground mb-4">
                or click to browse your computer
              </p>
              <p className="text-sm text-muted-foreground">
                Supports: PDF, DOC, DOCX, TXT, CSV
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Uploaded Files ({files.length})
          </h3>
          <div className="space-y-4">
            {files.map(fileData => (
              <div key={fileData.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium truncate">{fileData.file.name}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(fileData.id)}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {getStatusIcon(fileData.status)}
                      <span>{getStatusText(fileData.status)}</span>
                      <span>•</span>
                      <span>{(fileData.file.size / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                    
                    {(fileData.status === "uploading" || fileData.status === "processing") && (
                      <Progress value={fileData.progress} className="h-2" />
                    )}
                    
                    {fileData.category && (
                      <Badge variant="outline">{fileData.category}</Badge>
                    )}
                    
                    {fileData.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {fileData.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}