import { FileUpload } from "@/components/upload/FileUpload";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Zap, Shield, Database } from "lucide-react";

export default function Upload() {
  const features = [
    {
      icon: Zap,
      title: "AI Processing",
      description: "Automatic text extraction, summarization, and intelligent tagging"
    },
    {
      icon: Shield,
      title: "Secure Storage", 
      description: "Enterprise-grade security with end-to-end encryption"
    },
    {
      icon: Database,
      title: "RAG Integration",
      description: "Documents are indexed for intelligent retrieval and analysis"
    },
    {
      icon: FileText,
      title: "Format Support",
      description: "PDF, DOC, DOCX, TXT, CSV and more supported formats"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Upload Research Documents</h1>
        <p className="text-muted-foreground mt-2">
          Upload your research files for AI-powered analysis and intelligent search. 
          Documents are automatically processed and integrated into your knowledge base.
        </p>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((feature) => (
          <Card key={feature.title} className="p-4 text-center shadow-research">
            <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center mx-auto mb-3">
              <feature.icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <h3 className="font-semibold mb-2">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </Card>
        ))}
      </div>

      {/* Upload Component */}
      <FileUpload />

      {/* Processing Information */}
      <Card className="p-6 bg-primary-light border-primary/20">
        <h3 className="text-lg font-semibold mb-3 text-primary">How Document Processing Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0 mt-0.5">
              1
            </div>
            <div>
              <h4 className="font-medium text-primary mb-1">Upload & Extract</h4>
              <p className="text-primary/80">
                Files are uploaded securely and text content is extracted using advanced OCR and parsing
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0 mt-0.5">
              2
            </div>
            <div>
              <h4 className="font-medium text-primary mb-1">AI Analysis</h4>
              <p className="text-primary/80">
                Gemini AI analyzes content for key topics, entities, and generates intelligent summaries
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0 mt-0.5">
              3
            </div>
            <div>
              <h4 className="font-medium text-primary mb-1">RAG Integration</h4>
              <p className="text-primary/80">
                Content is vectorized and indexed for intelligent retrieval during AI conversations
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}