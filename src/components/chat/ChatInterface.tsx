import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Mic, Bot, User, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  sources?: Array<{
    title: string;
    type: "pdf" | "document" | "research";
    relevance: number;
  }>;
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
      // Simulate AI response (replace with actual Gemini API call)
      setTimeout(() => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `I understand you're asking about "${input}". Based on your research database, I found several relevant insights. This would be connected to your actual research data through RAG implementation.`,
          role: "assistant",
          timestamp: new Date(),
          sources: [
            { title: "Investment Analysis Q3 2024", type: "pdf", relevance: 0.95 },
            { title: "Market Research Report", type: "document", relevance: 0.87 },
            { title: "Term Sheet Analysis", type: "research", relevance: 0.82 },
          ]
        };
        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      setIsLoading(false);
      console.error("Error sending message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
                    : "bg-muted"
                )}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </Card>

                {message.sources && (
                  <div className="space-y-2 max-w-full">
                    <p className="text-xs text-muted-foreground">Sources:</p>
                    <div className="grid gap-2">
                      {message.sources.map((source, index) => (
                        <Card key={index} className="p-2 bg-accent/50 hover:bg-accent transition-colors cursor-pointer">
                          <div className="flex items-center gap-2 text-xs">
                            <FileText className="h-3 w-3 text-accent-foreground" />
                            <span className="flex-1 font-medium">{source.title}</span>
                            <Badge variant="secondary" className="text-xs">
                              {Math.round(source.relevance * 100)}%
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