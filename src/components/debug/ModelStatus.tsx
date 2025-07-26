import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AIService } from '@/lib/ai';

export const ModelStatus: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  const testModels = async () => {
    setIsLoading(true);
    setTestResult('Testing AI models...');
    
    try {
      const result = await AIService.callGeminiAPI(
        'Respond with just: "AI test successful with [model name]"',
        'Test prompt to verify AI functionality'
      );
      setTestResult(result);
    } catch (error) {
      setTestResult(`Test failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const freeModels = [
    { name: "Qwen 2.5 72B Instruct", model: "qwen/qwen-2.5-72b-instruct:free", priority: 1 },
    { name: "Llama 3.1 405B Instruct", model: "meta-llama/llama-3.1-405b-instruct:free", priority: 2 },
    { name: "Qwen 2.5 Coder 32B", model: "qwen/qwen-2.5-coder-32b-instruct:free", priority: 3 },
    { name: "Mistral Nemo", model: "mistralai/mistral-nemo:free", priority: 4 },
    { name: "Gemma 2 9B", model: "google/gemma-2-9b-it:free", priority: 5 },
    { name: "Llama 3.2 3B", model: "meta-llama/llama-3.2-3b-instruct:free", priority: 6 }
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🤖 AI Model Configuration
          <Badge variant="secondary">FREE TIER</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Available Free Models (Priority Order):</h3>
          <div className="space-y-2">
            {freeModels.map((model) => (
              <div key={model.model} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{model.priority}. {model.name}</span>
                  <div className="text-sm text-gray-600">{model.model}</div>
                </div>
                <Badge variant={model.priority === 1 ? "default" : "outline"}>
                  {model.priority === 1 ? "Primary" : `Fallback ${model.priority - 1}`}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button 
            onClick={testModels} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Testing...' : 'Test AI Models'}
          </Button>
          
          {testResult && (
            <div className="mt-3 p-3 bg-gray-100 rounded text-sm">
              <strong>Test Result:</strong>
              <div className="mt-1">{testResult}</div>
            </div>
          )}
        </div>

        <div className="text-sm text-gray-600">
          <p><strong>How it works:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>System tries models in priority order</li>
            <li>Falls back to next model if current fails</li>
            <li>Uses local processing if all models fail</li>
            <li>All models are completely free with OpenRouter</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}; 