import { useState, useEffect } from "react";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ResearchSummary } from "@/components/research/ResearchSummary";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bot, CheckCircle, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Chat() {
  // Disable AI chat feature - Coming Soon
  const isComingSoon = true;
  const [isKeyValid, setIsKeyValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if Gemini API key is available in environment
  useEffect(() => {
    if (isComingSoon) {
      setIsLoading(false);
      return;
    }
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    console.log('API Key check:', {
      hasKey: !!apiKey,
      keyLength: apiKey?.length,
      startsWithAIza: apiKey?.startsWith('AIza'),
      keyPreview: apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined'
    });
    setIsKeyValid(!!apiKey && apiKey.startsWith('AIza'));
    setIsLoading(false);
  }, [isComingSoon]);

  const suggestedQueries = [
    "Summarize the latest investment reports from Q4 2024",
    "What are the key trends in fintech according to our research?", 
    "Find all documents related to sustainable finance and ESG",
    "Compare the performance metrics across our portfolio companies",
    "What regulatory changes might affect our investment strategy?",
    "Generate a summary of due diligence findings for recent deals"
  ];

  if (isComingSoon) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Research Assistant</h1>
          <p className="text-muted-foreground mt-2">
            Advanced AI-powered research assistant for your documents and data.
          </p>
        </div>

        {/* Coming Soon Message */}
        <Card className="p-12 text-center shadow-lg">
          <div className="flex justify-center mb-6">
            <div className="p-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full">
              <Bot className="h-16 w-16 text-blue-600" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            AI Chat Assistant Coming Soon!
          </h2>
          
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            We're working hard to bring you an advanced AI-powered research assistant that will help you 
            analyze documents, generate insights, and answer complex questions about your research data.
          </p>
          
          <div className="space-y-4">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              🚀 Advanced RAG Technology
            </Badge>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              🧠 Multi-Document Analysis
            </Badge>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              📊 Intelligent Insights
            </Badge>
          </div>
          
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">What to expect:</h3>
            <ul className="text-left text-gray-600 space-y-2 max-w-md mx-auto">
              <li>• Chat with your uploaded documents</li>
              <li>• Generate research summaries</li>
              <li>• Extract key insights automatically</li>
              <li>• Compare multiple documents</li>
              <li>• Export AI-generated reports</li>
            </ul>
          </div>
          
          <p className="text-sm text-gray-500 mt-6">
            Stay tuned for updates! This feature will be available in the next release.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">AI Research Assistant</h1>
        <p className="text-muted-foreground mt-2">
          Chat with your research database using advanced AI. Get insights, summaries, and intelligent analysis.
        </p>
      </div>

      {/* API Key Status */}
      {!isLoading && (
        <Alert className={isKeyValid ? "border-success bg-success/5" : "border-destructive bg-destructive/5"}>
          <div className="flex items-center gap-2">
            {isKeyValid ? (
              <CheckCircle className="h-4 w-4 text-success" />
            ) : (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
            <AlertDescription className={isKeyValid ? "text-success" : "text-destructive"}>
              {isKeyValid 
                ? "Gemini API key configured successfully! Full AI capabilities are available."
                : "Gemini API key not found. Please add VITE_GEMINI_API_KEY to your .env file."
              }
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Status Badge */}
      {!isLoading && (
        <div className="flex items-center gap-3">
          <Badge variant={isKeyValid ? "default" : "secondary"} className="gap-2">
            <Bot className="h-3 w-3" />
            {isKeyValid ? "AI Assistant Ready" : "API Key Required"}
          </Badge>
          {!isKeyValid && (
            <p className="text-sm text-muted-foreground">
              Add VITE_GEMINI_API_KEY to your .env file to enable AI chat capabilities
            </p>
          )}
        </div>
      )}

      {/* Main Interface with Tabs */}
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat">AI Chat Assistant</TabsTrigger>
          <TabsTrigger value="summary">Research Summaries</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Suggested Queries */}
            <div className="lg:col-span-1">
              <Card className="p-4 shadow-research h-fit">
                <h3 className="font-semibold mb-3">Suggested Queries</h3>
                <div className="space-y-2">
                  {suggestedQueries.map((query, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full text-left text-sm h-auto p-3 justify-start whitespace-normal"
                      onClick={() => {
                        // This would trigger the query in the chat interface
                        console.log("Suggested query:", query);
                      }}
                    >
                      {query}
                    </Button>
                  ))}
                </div>
              </Card>
            </div>

            {/* Chat Interface */}
            <div className="lg:col-span-3">
              <div className="h-[700px]">
                <ChatInterface geminiApiKey={isKeyValid ? import.meta.env.VITE_GEMINI_API_KEY : undefined} />
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="summary" className="mt-6">
          <ResearchSummary geminiApiKey={isKeyValid ? import.meta.env.VITE_GEMINI_API_KEY : undefined} />
        </TabsContent>
      </Tabs>

      {/* Capabilities Overview */}
      <Card className="p-6 shadow-research">
        <h3 className="text-lg font-semibold mb-4">AI Assistant Capabilities</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-2 text-primary">Document Analysis</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Intelligent document summarization</li>
              <li>• Key entity and topic extraction</li>
              <li>• Cross-document correlation analysis</li>
              <li>• Sentiment and risk assessment</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2 text-primary">Research Insights</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Market trend identification</li>
              <li>• Competitive landscape analysis</li>
              <li>• Investment opportunity discovery</li>
              <li>• Regulatory impact assessment</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2 text-primary">Knowledge Retrieval</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Semantic search across documents</li>
              <li>• Contextual question answering</li>
              <li>• Related research recommendations</li>
              <li>• Source attribution and citations</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}