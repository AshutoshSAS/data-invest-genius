import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, FileText, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { RAGSystem, SearchResult } from "@/lib/rag";
import { supabase } from "@/lib/supabase";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  sources?: SearchResult[];
}

interface ProjectChatProps {
  projectId: string;
  projectTitle: string;
  isOpen: boolean;
  onClose: () => void;
  geminiApiKey?: string;
}

export function ProjectChat({ projectId, projectTitle, isOpen, onClose, geminiApiKey }: ProjectChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: `Hello! I'm your AI research assistant for the project "${projectTitle}". I can help you analyze this project's documents, answer questions about the research, and provide insights. How can I assist you today?`,
      role: "assistant",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [projectDocuments, setProjectDocuments] = useState<any[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Fetch project documents on mount
  useEffect(() => {
    if (isOpen && projectId) {
      fetchProjectDocuments();
    }
  }, [isOpen, projectId]);

  const fetchProjectDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('project_documents')
        .select(`
          document_id,
          research_documents (
            id,
            title,
            description,
            category,
            status,
            summary
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;
      
      const documents = data?.map(item => item.research_documents).filter(Boolean) || [];
      setProjectDocuments(documents);
    } catch (error) {
      console.error('Error fetching project documents:', error);
    }
  };

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      if (geminiApiKey) {
        const ragSystem = RAGSystem.getInstance(geminiApiKey);
        
        // Get context from project documents
        const context = await ragSystem.getProjectContext(projectId, input);
        const response = await ragSystem.generateResponse(input, context);
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response,
          role: "assistant",
          timestamp: new Date(),
          sources: context.relevantDocuments
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Fallback response
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `I understand you're asking about "${input}" in the context of project "${projectTitle}". This project has ${projectDocuments.length} documents that I can analyze. Please configure your Gemini API key to enable full AI capabilities.`,
          role: "assistant",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Error generating response:", error);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I'm having trouble processing your request right now. Please try again later.",
        role: "assistant",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Project Chat: {projectTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* Project Info */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="font-medium">AI Research Assistant</p>
                <p className="text-sm text-muted-foreground">
                  {geminiApiKey ? "Connected to Gemini AI" : "Demo Mode - Connect API Key"}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="gap-1">
              <div className="w-2 h-2 bg-success rounded-full" />
              {projectDocuments.length} documents
            </Badge>
          </div>

          {/* Messages */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 border rounded-lg">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 animate-fade-in",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                  
                  <div className={cn(
                    "max-w-[80%] space-y-2",
                    message.role === "user" ? "items-end" : "items-start"
                  )}>
                    <Card className={cn(
                      "p-3 transition-smooth",
                      message.role === "user" 
                        ? "bg-primary text-primary-foreground ml-auto" 
                        : "bg-muted"
                    )}>
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </Card>

                    {message.sources && message.sources.length > 0 && (
                      <div className="space-y-2 max-w-full">
                        <p className="text-xs text-muted-foreground">Sources from project documents:</p>
                        <div className="grid gap-2">
                          {message.sources.map((source, index) => (
                            <Card key={index} className="p-2 bg-accent/50 hover:bg-accent transition-colors cursor-pointer">
                              <div className="flex items-center gap-2 text-xs">
                                <FileText className="h-3 w-3 text-accent-foreground" />
                                <span className="flex-1 font-medium">{source.title}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {Math.round(source.similarity * 100)}%
                                </Badge>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>

                  {message.role === "user" && (
                    <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="h-4 w-4 text-secondary-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <Card className="p-3 bg-muted">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <p className="text-sm">Thinking...</p>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="flex gap-2 p-4 border-t">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about this project's research..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={isLoading || !input.trim()}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 