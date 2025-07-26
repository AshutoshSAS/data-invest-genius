import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, FileText, TrendingUp, Lightbulb, ExternalLink } from 'lucide-react';
import { RAGSystem } from '@/lib/rag';
import { useAuth } from '@/hooks/useAuth';

interface ResearchSummaryProps {
  geminiApiKey?: string;
}

export function ResearchSummary({ geminiApiKey }: ResearchSummaryProps) {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const { user } = useAuth();

  const generateSummary = async () => {
    if (!topic.trim() || !geminiApiKey) return;

    setIsLoading(true);
    try {
      const ragSystem = RAGSystem.getInstance(geminiApiKey);
      const result = await ragSystem.generateResearchSummary(topic);
      setSummary(result);
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      generateSummary();
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Research Summary Generator
          </CardTitle>
          <CardDescription>
            Generate comprehensive summaries of research topics using AI analysis of your document database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter a research topic (e.g., 'fintech trends', 'sustainable finance')"
              className="flex-1"
              disabled={isLoading}
            />
            <Button 
              onClick={generateSummary}
              disabled={!topic.trim() || isLoading || !geminiApiKey}
              className="gradient-primary"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Generate Summary
            </Button>
          </div>
          {!geminiApiKey && (
            <p className="text-sm text-muted-foreground mt-2">
              Gemini API key required for AI-powered summaries
            </p>
          )}
        </CardContent>
      </Card>

      {/* Summary Results */}
      {summary && (
        <div className="space-y-6">
          {/* Main Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Summary: {topic}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {summary.summary}
              </p>
            </CardContent>
          </Card>

          {/* Key Insights */}
          {summary.keyInsights && summary.keyInsights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summary.keyInsights.map((insight: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <p className="text-sm">{insight}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Related Topics */}
          {summary.relatedTopics && summary.relatedTopics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Related Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {summary.relatedTopics.map((topic: string, index: number) => (
                    <Badge key={index} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Source Documents */}
          {summary.sources && summary.sources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  Source Documents
                </CardTitle>
                <CardDescription>
                  Documents used to generate this summary
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summary.sources.map((source: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{source.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Relevance: {Math.round(source.similarity * 100)}%
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(source.similarity * 100)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* No Results */}
      {summary && summary.summary === "No research documents found for this topic." && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Research Found</h3>
            <p className="text-muted-foreground mb-4">
              No documents in your research database match this topic.
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/upload'}>
              Upload Documents
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 