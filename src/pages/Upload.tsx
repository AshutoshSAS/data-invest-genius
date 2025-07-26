import { DocumentUpload } from '@/components/upload/DocumentUpload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Brain, BarChart3, MessageSquare } from 'lucide-react';

const Upload = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Upload Documents</h1>
          <p className="text-gray-600 mt-2">
            Upload your research documents for AI-powered analysis and insights
          </p>
        </div>
      </div>

      {/* Upload Component */}
      <DocumentUpload />

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-lg">AI Analysis</CardTitle>
            <CardDescription>
              Get instant AI-powered summaries, key insights, and analysis of your documents
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-lg">Smart Categorization</CardTitle>
            <CardDescription>
              Documents are automatically categorized and tagged for easy organization
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <MessageSquare className="h-6 w-6 text-purple-600" />
            </div>
            <CardTitle className="text-lg">RAG Chat</CardTitle>
            <CardDescription>
              Ask questions about your documents and get contextual answers with sources
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Supported Formats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Supported File Formats
          </CardTitle>
          <CardDescription>
            We support a wide range of document formats for comprehensive analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">📄</div>
              <div className="font-medium">PDF</div>
              <div className="text-sm text-gray-500">Research Papers</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">📝</div>
              <div className="font-medium">Word</div>
              <div className="text-sm text-gray-500">DOC, DOCX</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">📊</div>
              <div className="font-medium">Excel</div>
              <div className="text-sm text-gray-500">XLS, XLSX, CSV</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">📄</div>
              <div className="font-medium">Text</div>
              <div className="text-sm text-gray-500">TXT Files</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Upload;