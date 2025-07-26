import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Mic, Bot, User, FileText, Check, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RAGSystem, SearchResult } from "@/lib/rag";
import { useToast } from "@/components/ui/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  sources?: SearchResult[];
  error?: boolean;
  thinking?: boolean;
}

interface ChatInterfaceProps {
  geminiApiKey?: string;
}

export function ChatInterface({ geminiApiKey }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm your AI research assistant. I can help you analyze documents, find insights in your research database, and answer questions about your investment research. How can I assist you today?",
      role: "assistant",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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

  // Format the AI response for better readability
  const formatAIResponse = (response: string, sources?: SearchResult[]): string => {
    // Check if response already has citations
    const hasCitations = /\[\d+\]/.test(response);
    
    // If no sources or already has citations, return as is
    if (!sources || sources.length === 0 || hasCitations) {
      return response;
    }
    
    // Add section headers if not present
    let formattedResponse = response;
    
    // Check if response is too short or lacks structure
    if (response.length < 200 || !response.includes('\n\n')) {
      // Add more structure to short responses
      formattedResponse = `## Answer\n${response}\n\n`;
    }
    
    // Add sources section if not already present
    if (!formattedResponse.toLowerCase().includes('source') && sources.length > 0) {
      formattedResponse += '\n\n## Sources\n';
      sources.forEach((source, index) => {
        const relevance = Math.round(source.similarity * 100);
        formattedResponse += `${index + 1}. **${source.title}** (${relevance}% relevant)\n`;
      });
    }
    
    return formattedResponse;
  };

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

    // Add thinking message
    const thinkingId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: thinkingId,
      content: "Analyzing your research documents...",
      role: "assistant",
      timestamp: new Date(),
      thinking: true
    }]);

    try {
      // Use RAG system for real AI response
      if (geminiApiKey) {
        try {
          const ragSystem = RAGSystem.getInstance(geminiApiKey);
          const context = await ragSystem.getRAGContext(input);
          
          // Remove thinking message
          setMessages(prev => prev.filter(m => m.id !== thinkingId));
          
          if (context.relevantDocuments.length === 0) {
            // No relevant documents found
            const noResultsMessage: Message = {
              id: (Date.now() + 2).toString(),
              content: "I couldn't find any relevant information in your research documents about that topic. Would you like to try a different query or upload more documents related to this subject?",
              role: "assistant",
              timestamp: new Date(),
              sources: []
            };
            setMessages(prev => [...prev, noResultsMessage]);
            setIsLoading(false);
            return;
          }
          
          const response = await ragSystem.generateResponse(input, context);
          const formattedResponse = formatAIResponse(response, context.relevantDocuments);
          
          const assistantMessage: Message = {
            id: (Date.now() + 2).toString(),
            content: formattedResponse,
            role: "assistant",
            timestamp: new Date(),
            sources: context.relevantDocuments
          };
          setMessages(prev => [...prev, assistantMessage]);
          
        } catch (error) {
          console.error("Error generating AI response:", error);
          
          // Remove thinking message
          setMessages(prev => prev.filter(m => m.id !== thinkingId));
          
          const errorMessage: Message = {
            id: (Date.now() + 2).toString(),
            content: "I apologize, but I'm having trouble processing your request right now. This might be due to a connection issue or because I'm still learning about your research documents. Please try again or rephrase your question.",
            role: "assistant",
            timestamp: new Date(),
            error: true
          };
          setMessages(prev => [...prev, errorMessage]);
          
          toast({
            title: "AI Response Error",
            description: "There was a problem generating a response. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        // Remove thinking message
        setMessages(prev => prev.filter(m => m.id !== thinkingId));
        
        // Fallback for demo mode
        const demoSources = [
          { id: "1", title: "Investment Analysis Q3 2024", content: "Sample content about investment trends and market analysis for the third quarter.", similarity: 0.95, document_id: "1", chunk_index: 0 },
          { id: "2", title: "Market Research Report", content: "Comprehensive analysis of market conditions and future projections.", similarity: 0.87, document_id: "2", chunk_index: 0 },
          { id: "3", title: "Term Sheet Analysis", content: "Detailed breakdown of investment terms and conditions.", similarity: 0.82, document_id: "3", chunk_index: 0 },
        ];
        
        const demoResponse = `## Analysis

Based on your query about "${input}", I've analyzed the relevant documents in your research database.

The Investment Analysis Q3 2024 report indicates significant trends in this area, with market projections showing potential growth in the coming months. According to the Market Research Report, there are several key factors to consider:

1. Market conditions remain favorable for strategic investments
2. Sector performance varies with technology and healthcare showing strongest indicators
3. Risk factors include regulatory changes expected in Q4

## Recommendation

Consider reviewing the Term Sheet Analysis for specific investment parameters that align with these findings.

`;
        
        const assistantMessage: Message = {
          id: (Date.now() + 2).toString(),
          content: demoResponse,
          role: "assistant",
          timestamp: new Date(),
          sources: demoSources
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
      setIsLoading(false);
    } catch (error) {
      // Remove thinking message
      setMessages(prev => prev.filter(m => m.id !== thinkingId));
      
      setIsLoading(false);
      console.error("Error sending message:", error);
      
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: "I apologize, but I encountered an unexpected error. Please try again later.",
        role: "assistant",
        timestamp: new Date(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Function to render message content with proper formatting
  const renderMessageContent = (content: string) => {
    // Split content by section headers
    const sections = content.split(/^##\s+/m).filter(Boolean);
    
    if (sections.length <= 1) {
      // No section headers, render as plain text with paragraph breaks
      return content.split('\n\n').map((paragraph, i) => (
        <p key={i} className={`${i > 0 ? 'mt-2' : ''}`}>{paragraph}</p>
      ));
    }
    
    // Render with section headers
    return sections.map((section, idx) => {
      const lines = section.split('\n');
      const title = idx > 0 ? lines[0] : null;
      const content = idx > 0 ? lines.slice(1).join('\n') : section;
      
      return (
        <div key={idx} className={`${idx > 0 ? 'mt-4' : ''}`}>
          {title && <h3 className="text-sm font-semibold mb-2">{title}</h3>}
          {content.split('\n\n').map((paragraph, i) => (
            <p key={i} className={`${i > 0 ? 'mt-2' : ''} text-sm`}>{paragraph}</p>
          ))}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border shadow-research">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">AI Research Assistant</h3>
            <p className="text-sm text-muted-foreground">
              {geminiApiKey ? "Connected to Gemini AI" : "Demo Mode - Connect API Key"}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1">
          <div className="w-2 h-2 bg-success rounded-full" />
          Online
        </Badge>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
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
                    : message.error 
                      ? "bg-destructive/10 border-destructive/20" 
                      : message.thinking
                        ? "bg-muted/50 border-dashed"
                        : "bg-muted"
                )}>
                  {message.thinking ? (
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-100" />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-200" />
                      </div>
                      <span className="text-sm text-muted-foreground">{message.content}</span>
                    </div>
                  ) : (
                    <div className="text-sm leading-relaxed">
                      {renderMessageContent(message.content)}
                    </div>
                  )}
                </Card>

                {message.sources && message.sources.length > 0 && (
                  <div className="space-y-2 max-w-full">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      <span>Sources ({message.sources.length}):</span>
                    </div>
                    <div className="grid gap-2">
                      {message.sources.map((source, index) => (
                        <TooltipProvider key={index}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Card className="p-2 bg-accent/50 hover:bg-accent transition-colors cursor-pointer">
                                <div className="flex items-center justify-between gap-2 text-xs">
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <FileText className="h-3 w-3 text-accent-foreground flex-shrink-0" />
                                    <span className="font-medium truncate">{source.title}</span>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <Badge variant="secondary" className="text-xs">
                                      {Math.round(source.similarity * 100)}%
                                    </Badge>
                                    <ExternalLink className="h-3 w-3" />
                                  </div>
                                </div>
                              </Card>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-medium">{source.title}</p>
                              <p className="text-xs mt-1 max-w-xs">{source.content.substring(0, 100)}...</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </div>
                )}

                {message.error && (
                  <div className="flex items-center gap-1 text-xs text-destructive">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Error processing request</span>
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

          {isLoading && !messages.some(m => m.thinking) && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <Card className="p-3 bg-muted">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-100" />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-200" />
                  </div>
                  <span className="text-sm text-muted-foreground">Analyzing research...</span>
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t bg-muted/30">
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your research, request summaries, or get insights..."
              className="min-h-[40px] resize-none bg-background border-border/50"
              disabled={isLoading}
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Tip: Try "Summarize recent investment reports" or "Find research on fintech trends"</span>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" disabled={isLoading}>
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" disabled={isLoading}>
              <Mic className="h-4 w-4" />
            </Button>
            <Button 
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="gradient-primary"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}