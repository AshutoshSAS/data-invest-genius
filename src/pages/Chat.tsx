import { useState } from "react";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bot, Key, AlertCircle, CheckCircle, Settings } from "lucide-react";

export default function Chat() {
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [isKeyValid, setIsKeyValid] = useState(false);
  const [showSettings, setShowSettings] = useState(!geminiApiKey);

  const handleApiKeySubmit = () => {
    if (geminiApiKey.startsWith("AIza") && geminiApiKey.length > 30) {
      setIsKeyValid(true);
      setShowSettings(false);
      // Here you would typically validate the key with a test API call
    } else {
      setIsKeyValid(false);
    }
  };

  const suggestedQueries = [
    "Summarize the latest investment reports from Q4 2024",
    "What are the key trends in fintech according to our research?", 
    "Find all documents related to sustainable finance and ESG",
    "Compare the performance metrics across our portfolio companies",
    "What regulatory changes might affect our investment strategy?",
    "Generate a summary of due diligence findings for recent deals"
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Research Assistant</h1>
          <p className="text-muted-foreground mt-2">
            Chat with your research database using advanced AI. Get insights, summaries, and intelligent analysis.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowSettings(!showSettings)}
          className="gap-2"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>

      {/* API Key Configuration */}
      {showSettings && (
        <Card className="p-6 border-primary/20 bg-primary-light">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <Key className="h-4 w-4 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-primary">Gemini API Configuration</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="apikey" className="text-primary">Gemini API Key</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="apikey"
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key (AIza...)"
                  className="flex-1"
                />
                <Button onClick={handleApiKeySubmit} className="gradient-primary">
                  Connect
                </Button>
              </div>
            </div>

            {geminiApiKey && (
              <Alert className={isKeyValid ? "border-success bg-success/5" : "border-destructive bg-destructive/5"}>
                <div className="flex items-center gap-2">
                  {isKeyValid ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                  <AlertDescription className={isKeyValid ? "text-success" : "text-destructive"}>
                    {isKeyValid 
                      ? "API key connected successfully! You can now use the full AI capabilities."
                      : "Invalid API key format. Please check your Gemini API key."
                    }
                  </AlertDescription>
                </div>
              </Alert>
            )}

            <div className="text-sm text-primary/80">
              <p className="mb-2">To get your Gemini API key:</p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Visit <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Google AI Studio</a></li>
                <li>Sign in with your Google account</li>
                <li>Create a new API key for your project</li>
                <li>Copy and paste the key above</li>
              </ol>
            </div>
          </div>
        </Card>
      )}

      {/* Status Badge */}
      <div className="flex items-center gap-3">
        <Badge variant={isKeyValid ? "default" : "secondary"} className="gap-2">
          <Bot className="h-3 w-3" />
          {isKeyValid ? "AI Assistant Connected" : "Demo Mode"}
        </Badge>
        {!isKeyValid && (
          <p className="text-sm text-muted-foreground">
            Connect your Gemini API key to enable full RAG capabilities
          </p>
        )}
      </div>

      {/* Main Chat Interface */}
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
            <ChatInterface geminiApiKey={isKeyValid ? geminiApiKey : undefined} />
          </div>
        </div>
      </div>

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