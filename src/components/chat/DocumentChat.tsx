import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, FileText, X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RAGSystem, SearchResult } from '@/lib/rag';
import { supabase } from '@/lib/supabase';

interface DocumentChatProps {
  documentId: string;
  documentTitle: string;
  onClose: () => void;
  geminiApiKey?: string;
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  sources?: SearchResult[];
}

export function DocumentChat({ documentId, documentTitle, onClose, geminiApiKey }: DocumentChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingChecked, setProcessingChecked] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [ragSystem, setRagSystem] = useState<RAGSystem | null>(null);

  useEffect(() => {
    if (geminiApiKey) {
      setRagSystem(RAGSystem.getInstance(geminiApiKey));
    }
  }, [geminiApiKey]);

  useEffect(() => {
    // Check if document is processed when component mounts
    const checkDocumentProcessing = async () => {
      if (!ragSystem) return;
      
      try {
        setIsProcessing(true);
        const { data } = await supabase
          .from('document_chunks')
          .select('id')
          .eq('document_id', documentId)
          .limit(1);
          
        setIsProcessing(data === null || data.length === 0);
        setProcessingChecked(true);
        
        // If document is not processed, try to process it
        if (data === null || data.length === 0) {
          console.log('Document not processed, fetching content...');
          const { data: documentData } = await supabase
            .from('research_documents')
            .select('content, title')
            .eq('id', documentId)
            .single();
            
          if (documentData?.content) {
            console.log('Processing document...');
            await ragSystem.processDocument(documentId, documentData.content, documentData.title);
            
            // Check if processing succeeded
            const { data: newChunks } = await supabase
              .from('document_chunks')
              .select('id')
              .eq('document_id', documentId)
              .limit(1);
              
            setIsProcessing(newChunks === null || newChunks.length === 0);
          }
        }
      } catch (error) {
        console.error('Error checking document processing:', error);
      }
    };
    
    if (ragSystem) {
      checkDocumentProcessing();
    }
  }, [documentId, ragSystem]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !ragSystem) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Use RAG system to get context from this specific document
      const context = await ragSystem.getDocumentContext(documentId, input);
      
      // Generate AI response with document context
      const response = await ragSystem.generateResponse(input, context);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date(),
        sources: context.relevantDocuments,
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Update processing state based on context
      setIsProcessing(context.relevantDocuments.length === 0);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "What are the main findings in this document?",
    "Can you summarize the key points?",
    "What methodology was used?",
    "What are the conclusions?",
    "Are there any limitations mentioned?",
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl h-[80vh] flex flex-col">
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Chat with: {documentTitle}
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Ask questions about this specific document
                  {isProcessing && processingChecked && (
                    <span className="ml-2 text-amber-600 font-medium">
                      (Document processing...)
                    </span>
                  )}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages Area */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Start a conversation about this document
                </h3>
                
                {isProcessing && processingChecked ? (
                  <div className="mb-6">
                    <div className="flex items-center justify-center gap-2 text-amber-600 mb-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600"></div>
                      <span className="font-medium">Document is being processed</span>
                    </div>
                    <p className="text-gray-600">
                      This document is still being analyzed. You can still ask questions,
                      but responses may be limited until processing completes.
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-600 mb-6">
                    Ask questions, request summaries, or explore specific topics within this document.
                  </p>
                )}
                
                {/* Suggested Questions */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Try asking:</p>
                  {suggestedQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="w-full text-left justify-start h-auto p-3"
                      onClick={() => setInput(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Bot className="h-4 w-4 text-blue-600" />
                      </div>
                    )}
                    
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg p-3",
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      )}
                    >
                      <div className="text-sm whitespace-pre-wrap prose prose-sm max-w-none">
                        {message.content}
                      </div>
                      
                      {/* Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-2">Sources from this document:</p>
                          <div className="space-y-1">
                            {message.sources.slice(0, 3).map((source, index) => (
                              <div key={index} className="flex items-center justify-between text-xs">
                                <span className="text-gray-600 truncate max-w-[80%]">
                                  {source.title}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {Math.round(source.similarity * 100)}%
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {message.role === "user" && (
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-gray-600">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="flex-shrink-0 p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question about this document..."
                disabled={isLoading || !ragSystem}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading || !ragSystem}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {!ragSystem && (
              <p className="text-xs text-red-600 mt-2">
                API key not configured. Please check your environment variables.
              </p>
            )}
            {isProcessing && processingChecked && (
              <p className="text-xs text-amber-600 mt-2">
                Document is still being processed. Responses may be limited until processing completes.
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
} 