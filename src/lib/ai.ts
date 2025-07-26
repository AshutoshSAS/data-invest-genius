import { supabase } from './supabase';
import { RAGSystem } from './rag';
import { aiCache } from './ai-cache';

// Google Gemini AI Configuration
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

export interface AIAnalysis {
  summary: string;
  keyInsights: string[];
  topics: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  processingTime: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: string[];
}

export class AIService {
  static async callGeminiAPI(prompt: string, context?: string): Promise<string> {
    try {
      const OPENROUTER_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!OPENROUTER_API_KEY) {
        throw new Error("OpenRouter API key not configured");
      }
      
      console.log('🤖 Using DeepSeek model');
      
      const requestBody = {
        model: "deepseek/deepseek-chat-v3-0324:free",
        messages: [
          {
            role: "system",
            content: "You are an AI research assistant that provides well-structured, clear responses. Always format your responses with appropriate headers, paragraphs, and lists for readability. Use markdown formatting with ## for section headers. When analyzing documents, cite specific sources and organize information logically."
          },
          {
            role: "user",
            content: context ? `${context}\n\n${prompt}` : prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2048
      };
      
      // Add exponential backoff for retries
      const maxRetries = 3;
      let retryCount = 0;
      let delay = 1000; // Start with 1 second delay
      
      while (retryCount <= maxRetries) {
        try {
          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
              "HTTP-Referer": window.location.origin || "https://data-invest-genius.com",
              "X-Title": "Data Invest Genius",
              "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody),
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ Success with DeepSeek model');
            return data.choices[0].message.content;
          }
          
          // Handle specific error codes
          if (response.status === 429) {
            // Rate limit error - retry with backoff
            const errorText = await response.text();
            console.log(`❌ DeepSeek model failed: ${response.status} - ${errorText}`);
            console.log(`Retrying in ${delay/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
            retryCount++;
            continue;
          }
          
          if (response.status === 503) {
            // Service unavailable - retry with backoff
            const errorText = await response.text();
            console.log(`❌ DeepSeek model failed: ${response.status} - ${errorText}`);
            console.log(`Retrying in ${delay/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
            retryCount++;
            continue;
          }
          
          // For other errors, throw
          const errorText = await response.text();
          throw new Error(`API error: ${response.status} - ${errorText}`);
        } catch (error) {
          // Network errors should retry
          if (error.message && (error.message.includes('fetch') || error.message.includes('network'))) {
            console.log(`❌ Network error: ${error.message}`);
            console.log(`Retrying in ${delay/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
            retryCount++;
            continue;
          }
          
          // Other errors should be thrown
          throw error;
        }
      }
      
      // If we've exhausted retries, throw an error
      throw new Error(`Failed after ${maxRetries} retries`);
    } catch (error) {
      console.error('API call failed:', error);
      console.log('API call failed, using fallback response');
      return this.generateFallbackResponse(prompt, context);
    }
  }

  static generateLocalAIResponse(prompt: string, context?: string): string | null {
    const fullText = context ? `${context}\n\n${prompt}` : prompt;
    
    // Check if this is a request for JSON analysis - use structured fallback
    if (prompt.includes('JSON') || prompt.includes('analyze') || prompt.includes('"summary"')) {
      return this.generateStructuredAnalysis(fullText);
    }
    
    // Check if this is a summary request
    if (prompt.includes('summarize') || prompt.includes('summary')) {
      return this.generateLocalSummary(fullText);
    }
    
    // Check if this is asking for insights
    if (prompt.includes('insights') || prompt.includes('key points')) {
      return this.generateLocalInsights(fullText);
    }
    
    // Check if this is categorization
    if (prompt.includes('categorize') || prompt.includes('category')) {
      return this.generateLocalCategory(fullText);
    }
    
    // Check if this is tag extraction
    if (prompt.includes('tags') || prompt.includes('keywords')) {
      return this.generateLocalTags(fullText);
    }
    
    return null; // Let it try API for other requests
  }

  static generateFallbackResponse(prompt: string, context?: string): string {
    const fullText = context ? `${context}\n\n${prompt}` : prompt;
    
    // Provide helpful fallback responses based on prompt type
    if (prompt.includes('JSON') || prompt.includes('analyze')) {
      return this.generateStructuredAnalysis(fullText);
    }
    
    if (prompt.includes('summarize') || prompt.includes('summary')) {
      return this.generateLocalSummary(fullText);
    }
    
    return 'I apologize, but AI analysis is temporarily unavailable. The document has been uploaded successfully and you can view it in your documents list.';
  }

  static generateStructuredAnalysis(text: string): string {
    // Generate a valid JSON structure for analysis
    const wordCount = text.split(/\s+/).length;
    const hasNumbers = /\d/.test(text);
    const hasFinancialTerms = /\b(investment|profit|revenue|cost|financial|money|stock|market)\b/i.test(text);
    const hasTechTerms = /\b(AI|algorithm|data|analysis|technology|software|system)\b/i.test(text);
    
    let category = 'Other';
    if (hasFinancialTerms) category = 'Financial Report';
    else if (hasTechTerms) category = 'Technical Document';
    else if (wordCount > 1000) category = 'Research Paper';
    
    const sentiment = hasFinancialTerms ? 'positive' : 'neutral';
    
    return JSON.stringify({
      summary: this.generateLocalSummary(text),
      keyInsights: this.generateLocalInsights(text).split('\n').filter(i => i.trim()),
      topics: this.generateLocalTags(text).split(',').map(t => t.trim()),
      sentiment: sentiment,
      confidence: 0.7,
      processingTime: 1000
    });
  }

  static generateLocalSummary(text: string): string {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const wordCount = text.split(/\s+/).length;
    
    if (sentences.length === 0) {
      return 'This document contains information that has been processed and stored successfully.';
    }
    
    // Take first sentence and a middle sentence as summary
    let summary = sentences[0].trim();
    if (sentences.length > 3) {
      const midSentence = sentences[Math.floor(sentences.length / 2)];
      summary += '. ' + midSentence.trim();
    }
    
    return `This ${wordCount > 500 ? 'detailed' : 'brief'} document discusses ${summary.toLowerCase()}. The content has been analyzed and is ready for search and chat functionality.`.substring(0, 500);
  }

  static generateLocalInsights(text: string): string {
    const insights = [];
    const wordCount = text.split(/\s+/).length;
    
    // Basic insights based on content analysis
    if (wordCount > 1000) {
      insights.push('This is a comprehensive document with detailed information');
    }
    
    if (/\b(data|analysis|research|study)\b/i.test(text)) {
      insights.push('The document contains analytical or research content');
    }
    
    if (/\b(recommendation|suggest|should|must)\b/i.test(text)) {
      insights.push('The document includes recommendations or actionable items');
    }
    
    if (/\b(future|trend|predict|forecast)\b/i.test(text)) {
      insights.push('The document discusses future trends or predictions');
    }
    
    if (insights.length === 0) {
      insights.push('The document has been successfully processed and indexed for search');
    }
    
    return insights.join('\n');
  }

  static generateLocalCategory(text: string): string {
    if (/\b(investment|financial|profit|revenue|stock|market)\b/i.test(text)) {
      return 'Financial Report';
    }
    
    if (/\b(research|study|analysis|findings|methodology)\b/i.test(text)) {
      return 'Research Paper';
    }
    
    if (/\b(technology|software|AI|algorithm|data|system)\b/i.test(text)) {
      return 'Technical Document';
    }
    
    if (/\b(market|business|strategy|company|operations)\b/i.test(text)) {
      return 'Market Analysis';
    }
    
    return 'Other';
  }

  static generateLocalTags(text: string): string {
    const tags = [];
    const commonTerms = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const termFreq = new Map<string, number>();
    
    // Count word frequency
    commonTerms.forEach(term => {
      if (!/\b(the|and|for|are|but|not|you|all|can|her|was|one|our|had|will|there|what|your|when|him|them|she|each|which|their|said|have|from|they|been)\b/.test(term)) {
        termFreq.set(term, (termFreq.get(term) || 0) + 1);
      }
    });
    
    // Get most frequent terms
    const sortedTerms = Array.from(termFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([term]) => term);
    
    tags.push(...sortedTerms);
    
    // Add category-based tags
    if (/financial|investment/i.test(text)) tags.push('finance', 'investment');
    if (/technology|AI/i.test(text)) tags.push('technology', 'AI');
    if (/research|study/i.test(text)) tags.push('research', 'analysis');
    
    return tags.slice(0, 10).join(', ');
  }

  static async callGeminiAPIFallback(prompt: string, context?: string, retryCount: number = 0): Promise<any> {
    const MAX_RETRIES = 3;
    const BASE_DELAY = 1000;
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const requestBody = {
      contents: [{
        parts: [{
          text: context ? `${context}\n\n${prompt}` : prompt
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        // Handle rate limiting with exponential backoff
        if (response.status === 429 && retryCount < MAX_RETRIES) {
          const delay = BASE_DELAY * Math.pow(2, retryCount);
          console.log(`Gemini rate limited (429). Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.callGeminiAPIFallback(prompt, context, retryCount + 1);
        }
        
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API call failed:', error);
      throw error;
    }
  }

  static async analyzeDocument(documentId: string, content: string): Promise<AIAnalysis> {
    const startTime = Date.now();

    try {
      const analysisPrompt = `
        Analyze the following research document and provide:
        
        1. A concise summary (2-3 sentences)
        2. 5-7 key insights or findings
        3. Main topics/themes discussed
        4. Overall sentiment (positive/negative/neutral)
        5. Confidence level in the analysis (0-100)
        
        Document content:
        ${content.substring(0, 8000)} // Limit content length
        
        Return ONLY a JSON object without any markdown formatting:
        {
          "summary": "brief summary",
          "keyInsights": ["insight1", "insight2"],
          "topics": ["topic1", "topic2"],
          "sentiment": "positive",
          "confidence": 85
        }
      `;

      const response = await this.callGeminiAPI(analysisPrompt);
      
      // Clean the response to extract JSON
      let jsonString = response.trim();
      
      // Remove markdown code blocks if present
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Try to find JSON object in the response
      const jsonMatch = jsonString.match(/\{.*\}/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      }
      
      console.log('Cleaned analysis JSON string:', jsonString);
      
      // Parse JSON response
      const analysis = JSON.parse(jsonString);
      
      const processingTime = Date.now() - startTime;

      return {
        ...analysis,
        processingTime,
      };
    } catch (error) {
      console.error('Document analysis failed:', error);
      
      // Return fallback analysis
      return {
        summary: "Analysis failed. Please try again.",
        keyInsights: ["Unable to extract insights at this time"],
        topics: ["Unknown"],
        sentiment: "neutral",
        confidence: 0,
        processingTime: Date.now() - startTime,
      };
    }
  }

  static async generateSummary(content: string): Promise<string> {
    try {
      const prompt = `
        Create a professional summary of the following research document. 
        Focus on key findings, methodology, and conclusions.
        Keep it concise but comprehensive (150-200 words).
        
        Document:
        ${content.substring(0, 6000)}
      `;

      return await this.callGeminiAPI(prompt);
    } catch (error) {
      console.error('Summary generation failed:', error);
      return "Unable to generate summary at this time.";
    }
  }

  static async extractKeyInsights(text: string): Promise<any> {
    try {
      console.log('Extracting insights from text:', text.substring(0, 200) + '...');
      
      // Try to extract JSON from the response robustly
      let jsonString = text.trim();
      
      // Remove markdown code block wrappers
      jsonString = jsonString.replace(/```json\s*([\s\S]*?)\s*```/gi, '$1');
      jsonString = jsonString.replace(/```\s*([\s\S]*?)\s*```/gi, '$1');
      
      // Remove any text before the first { and after the last }
      const firstBrace = jsonString.indexOf('{');
      const lastBrace = jsonString.lastIndexOf('}');
      
      if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
        throw new Error('No valid JSON object found in AI response');
      }
      
      jsonString = jsonString.substring(firstBrace, lastBrace + 1).trim();
      
      console.log('Attempting to parse JSON:', jsonString.substring(0, 100) + '...');
      
      const insights = JSON.parse(jsonString);
      console.log('Successfully parsed insights:', insights);
      return insights;
    } catch (error) {
      console.error('Key insights extraction failed:', error);
      console.error('Original text:', text);
      return { 
        error: 'Key insights extraction failed', 
        details: error instanceof Error ? error.message : String(error),
        summary: 'Failed to extract structured insights from document',
        keyPoints: ['Document analysis could not be completed'],
        themes: [],
        relevantEntities: []
      };
    }
  }

  static async chatWithDocument(
    question: string, 
    documentContext: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<ChatMessage> {
    try {
      const historyContext = conversationHistory
        .slice(-5) // Last 5 messages for context
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      const prompt = `
        You are an AI research assistant. Answer the user's question based on the provided document context.
        Be helpful, accurate, and cite specific parts of the document when possible.
        
        Document Context:
        ${documentContext.substring(0, 4000)}
        
        Conversation History:
        ${historyContext}
        
        User Question: ${question}
        
        Please provide a comprehensive answer based on the document content.
      `;

      const response = await this.callGeminiAPI(prompt);

      return {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        sources: ['Document Analysis'],
      };
    } catch (error) {
      console.error('Chat with document failed:', error);
      
      return {
        role: 'assistant',
        content: "I'm sorry, I'm unable to process your question at the moment. Please try again.",
        timestamp: new Date(),
      };
    }
  }

  static async categorizeDocument(content: string): Promise<string> {
    try {
      const prompt = `
        Categorize this research document into one of these categories:
        - Research Paper
        - Financial Report
        - Market Analysis
        - Technical Document
        - News Article
        - Other
        
        Document:
        ${content.substring(0, 2000)}
        
        Respond with just the category name.
      `;

      return await this.callGeminiAPI(prompt);
    } catch (error) {
      console.error('Document categorization failed:', error);
      return 'Other';
    }
  }

  static async extractTags(content: string): Promise<string[]> {
    try {
      const prompt = `
        Extract relevant tags/keywords from this research document.
        Focus on topics, industries, companies, and key concepts.
        Return ONLY a JSON array of strings (5-10 tags) without any markdown formatting or additional text.
        
        Document:
        ${content.substring(0, 3000)}
        
        Return format: ["tag1", "tag2", "tag3"]
      `;

      const response = await this.callGeminiAPI(prompt);
      
      // Clean the response to extract JSON
      let jsonString = response.trim();
      
      // Remove markdown code blocks if present
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Try to find JSON array in the response
      const jsonMatch = jsonString.match(/\[.*\]/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      }
      
      console.log('Cleaned JSON string:', jsonString);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Tag extraction failed:', error);
      return [];
    }
  }
}

// Database operations for AI processing
export const AIProcessingService = {

  async processDocument(documentId: string): Promise<void> {
    try {
      console.log(`Starting AI processing for document ${documentId}`);
      
      // Get document from database
      const { data: document, error } = await supabase
        .from('research_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error || !document) {
        console.error('Document not found:', error);
        throw new Error('Document not found');
      }

      console.log(`Found document: ${document.title} (${document.content_type})`);

      // Get file content from storage
      const { data: fileData, error: fileError } = await supabase.storage
        .from('research-documents')
        .download(document.file_path);

      if (fileError || !fileData) {
        console.error('File not found in storage:', fileError);
        throw new Error('File not found in storage');
      }

      console.log(`Downloaded file, size: ${fileData.size} bytes`);

      // Extract text based on file type
      let content = '';
      try {
        content = await this.extractTextFromFile(fileData, document.content_type, document.title);
        console.log(`Extracted text, length: ${content.length} characters`);
        
        // Save extracted text to the database for future use
        const { error: textError } = await supabase
          .from('research_documents')
          .update({
            content: content.substring(0, 1000000) // Limit to 1M chars to avoid DB issues
          })
          .eq('id', documentId);
          
        if (textError) {
          console.error('Error saving extracted text:', textError);
          // Continue processing even if saving text fails
        }
      } catch (extractError) {
        console.error('Text extraction failed:', extractError);
        throw new Error('Text extraction failed');
      }

      // Perform AI analysis
      console.log('Starting AI analysis...');
      const analysis = await AIService.analyzeDocument(documentId, content);
      console.log('Analysis complete:', analysis);
      
      console.log('Generating summary...');
      let summary = "Unable to generate summary at this time.";
      try {
        summary = await AIService.generateSummary(content);
        console.log('Summary generated');
      } catch (error) {
        console.error('Summary generation failed:', error);
      }
      
      console.log('Extracting key insights...');
      let keyInsights = ["Unable to extract insights at this time"];
      try {
        keyInsights = await AIService.extractKeyInsights(content);
        console.log('Key insights extracted:', keyInsights);
      } catch (error) {
        console.error('Key insights extraction failed:', error);
      }
      
      console.log('Categorizing document...');
      let category = "Other";
      try {
        category = await AIService.categorizeDocument(content);
        console.log('Category:', category);
      } catch (error) {
        console.error('Document categorization failed:', error);
      }
      
      console.log('Extracting tags...');
      let tags: string[] = [];
      try {
        tags = await AIService.extractTags(content);
        console.log('Tags extracted:', tags);
      } catch (error) {
        console.error('Tag extraction failed:', error);
        tags = [];
      }

      // Update document with AI analysis
      console.log('Updating document in database...');
      const { error: updateError } = await supabase
        .from('research_documents')
        .update({
          ai_summary: summary,
          category: category,
          status: 'completed',
        })
        .eq('id', documentId);

      if (updateError) {
        console.error('Error updating document:', updateError);
        throw updateError;
      }
      console.log('Document updated successfully');

      // Process document for RAG system
      if (GEMINI_API_KEY) {
        try {
          console.log('Processing document for RAG system...');
          const ragSystem = RAGSystem.getInstance(GEMINI_API_KEY);
          
          // Test database connection first
          const dbTest = await ragSystem.testDatabaseConnection();
          console.log('Database test result:', dbTest);
          
          if (!dbTest.success) {
            console.error('Database connection failed, skipping RAG processing');
            return;
          }
          
          await ragSystem.processDocument(documentId, content, document.title);
          console.log(`Document ${documentId} processed for RAG system`);
        } catch (error) {
          console.error('RAG processing failed:', error);
          console.error('RAG error details:', {
            documentId,
            contentLength: content.length,
            title: document.title,
            error: error.message
          });
          // Don't fail the entire process if RAG fails
        }
      } else {
        console.log('No Gemini API key, skipping RAG processing');
      }

      // Insert tags
      console.log('Processing tags...');
      for (const tagName of tags) {
        try {
          // Insert tag if it doesn't exist
          const { data: existingTags, error: selectError } = await supabase
            .from('tags')
            .select('id')
            .eq('name', tagName);

          if (selectError) {
            console.error(`Error checking for existing tag "${tagName}":`, selectError);
            continue;
          }

          let tagId;
          if (!existingTags || existingTags.length === 0) {
            const { data: newTag, error: insertError } = await supabase
              .from('tags')
              .insert({ name: tagName, created_by: document.user_id })
              .select('id')
              .single();
            
            if (insertError) {
              console.error(`Error creating tag "${tagName}":`, insertError);
              continue;
            }
            tagId = newTag?.id;
          } else {
            tagId = existingTags[0].id;
          }

          // Link tag to document
          if (tagId) {
            const { error: linkError } = await supabase
              .from('document_tags')
              .insert({
                document_id: documentId,
                tag_id: tagId,
              });
            
            if (linkError) {
              console.error(`Error linking tag "${tagName}" to document:`, linkError);
              // Continue with other tags
            }
          }
        } catch (tagError) {
          console.error(`Error processing tag "${tagName}":`, tagError);
          // Continue with other tags
        }
      }
      console.log('Tags processed');

      console.log(`Document ${documentId} processed successfully`);
    } catch (error) {
      console.error('Document processing failed:', error);
      
      // Update document status to failed
      try {
        const { error: updateError } = await supabase
          .from('research_documents')
          .update({
            status: 'error',
          })
          .eq('id', documentId);
        
        if (updateError) {
          console.error('Error updating document status to failed:', updateError);
        }
      } catch (statusError) {
        console.error('Error updating document status:', statusError);
      }
    }
  },

  /**
   * Auto-tag a research project with industry and sub-industry based on title and description
   */
  async autoTagProject(title: string, description: string): Promise<{
    industry: string;
    subIndustry: string;
    tags: string[];
    confidence: number;
  }> {
    try {
      const prompt = `
Analyze the following research project and determine:
1. The industry it belongs to
2. The sub-industry or sector within that industry
3. 3-5 relevant tags (keywords) for this project
4. Your confidence level in this classification (0-100%)

Research Project Title: ${title}
Research Project Description: ${description}

Format your response as valid JSON with the following structure:
{
  "industry": "Main industry name",
  "subIndustry": "Sub-industry or sector name",
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 85
}

Only return the JSON object, no other text.
`;

      const response = await this.callGeminiAPI(prompt);
      
      // Extract JSON from the response (handling potential markdown code blocks)
      let jsonStr = response;
      
      // Check if the response is wrapped in markdown code blocks
      const jsonRegex = /```(?:json)?\s*({[\s\S]*?})\s*```/;
      const match = jsonRegex.exec(jsonStr);
      if (match && match[1]) {
        jsonStr = match[1];
      }
      
      // Remove any non-JSON text before or after the JSON object
      const jsonStartIndex = jsonStr.indexOf('{');
      const jsonEndIndex = jsonStr.lastIndexOf('}') + 1;
      if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
        jsonStr = jsonStr.substring(jsonStartIndex, jsonEndIndex);
      }
      
      // Parse the JSON
      const result = JSON.parse(jsonStr);
      
      // Ensure tags is always an array
      if (!result.tags) {
        result.tags = [];
      } else if (!Array.isArray(result.tags)) {
        if (typeof result.tags === 'string') {
          result.tags = result.tags.split(',').map(tag => tag.trim());
        } else {
          result.tags = [];
        }
      }
      
      // Ensure confidence is a number
      if (typeof result.confidence !== 'number') {
        result.confidence = parseInt(result.confidence) || 75;
      }
      
      // Ensure industry and subIndustry are strings
      result.industry = result.industry || '';
      result.subIndustry = result.subIndustry || '';
      
      return {
        industry: result.industry,
        subIndustry: result.subIndustry,
        tags: result.tags,
        confidence: result.confidence
      };
    } catch (error) {
      console.error('Error auto-tagging project:', error);
      
      // Return default values if auto-tagging fails
      return {
        industry: 'Unknown',
        subIndustry: 'General',
        tags: ['research', 'analysis', 'project'],
        confidence: 50
      };
    }
  },

  /**
   * Extract text from various file types
   */
  async extractTextFromFile(fileData: Blob, contentType: string, fileName: string): Promise<string> {
    console.log(`Extracting text from ${contentType} file: ${fileName}`);
    
    // For plain text files
    if (contentType === 'text/plain') {
      return await fileData.text();
    }
    
    // For PDF files
    if (contentType === 'application/pdf') {
      try {
        // Use PDF.js to extract text
        // This is a simplified version - in production, you'd use a more robust solution
        const arrayBuffer = await fileData.arrayBuffer();
        const text = await this.extractTextFromPDF(arrayBuffer);
        return text || 'PDF text extraction failed';
      } catch (error) {
        console.error('PDF extraction error:', error);
        return 'PDF text extraction failed';
      }
    }
    
    // For Word documents (docx)
    if (contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        const arrayBuffer = await fileData.arrayBuffer();
        const text = await this.extractTextFromDOCX(arrayBuffer);
        return text || 'DOCX text extraction failed';
      } catch (error) {
        console.error('DOCX extraction error:', error);
        return 'DOCX text extraction failed';
      }
    }
    
    // For older Word documents (doc)
    if (contentType === 'application/msword') {
      try {
        const text = await fileData.text();
        // Try to extract readable text from binary format
        return this.cleanBinaryText(text) || 'DOC text extraction failed';
      } catch (error) {
        console.error('DOC extraction error:', error);
        return 'DOC text extraction failed';
      }
    }
    
    // For Excel files (xlsx)
    if (contentType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      try {
        const arrayBuffer = await fileData.arrayBuffer();
        const text = await this.extractTextFromXLSX(arrayBuffer);
        return text || 'XLSX text extraction failed';
      } catch (error) {
        console.error('XLSX extraction error:', error);
        return 'XLSX text extraction failed';
      }
    }
    
    // For older Excel files (xls)
    if (contentType === 'application/vnd.ms-excel') {
      try {
        const text = await fileData.text();
        // Try to extract readable text from binary format
        return this.cleanBinaryText(text) || 'XLS text extraction failed';
      } catch (error) {
        console.error('XLS extraction error:', error);
        return 'XLS text extraction failed';
      }
    }
    
    // For CSV files
    if (contentType === 'text/csv') {
      try {
        const text = await fileData.text();
        // Format CSV content for better readability
        return this.formatCSV(text);
      } catch (error) {
        console.error('CSV extraction error:', error);
        return 'CSV text extraction failed';
      }
    }
    
    // Fallback for unsupported types
    try {
      return await fileData.text();
    } catch (error) {
      console.error('Text extraction fallback error:', error);
      return `Could not extract text from ${contentType} file`;
    }
  },
  
  /**
   * Extract text from PDF using PDF.js
   */
  async extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
    // In a real implementation, you'd use PDF.js
    // This is a placeholder that would be replaced with actual PDF.js code
    console.log('PDF extraction: Using simplified extraction');
    
    // Convert ArrayBuffer to text and look for PDF content
    const textDecoder = new TextDecoder('utf-8');
    const text = textDecoder.decode(arrayBuffer);
    
    // Extract text content between PDF markers
    const contentMatches = text.match(/\/(Contents|Text|Title|Subject|Author|Keywords|Creator|Producer|CreationDate|ModDate)[^\n]+/g);
    if (contentMatches && contentMatches.length > 0) {
      return contentMatches.join('\n');
    }
    
    // Return a portion of the text if we can't find PDF markers
    return text.replace(/[\x00-\x1F\x7F-\xFF]/g, '')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
      .substring(0, 100000);
  },
  
  /**
   * Extract text from DOCX files
   */
  async extractTextFromDOCX(arrayBuffer: ArrayBuffer): Promise<string> {
    // In a real implementation, you'd use a library like mammoth.js
    // This is a simplified version that extracts text from XML in the DOCX
    console.log('DOCX extraction: Using simplified extraction');
    
    try {
      // Convert ArrayBuffer to text
      const textDecoder = new TextDecoder('utf-8');
      const text = textDecoder.decode(arrayBuffer);
      
      // Look for document.xml content in the DOCX (ZIP) file
      const documentXmlMatch = text.match(/<w:document[^>]*>([\s\S]*?)<\/w:document>/);
      if (documentXmlMatch && documentXmlMatch[1]) {
        // Extract text from XML
        const textMatches = documentXmlMatch[1].match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g);
        if (textMatches && textMatches.length > 0) {
          // Clean XML tags
          return textMatches.map(match => {
            const content = match.replace(/<[^>]+>/g, '');
            return content;
          }).join(' ');
        }
      }
      
      // Fallback: try to find any text content
      const textMatches = text.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g);
      if (textMatches && textMatches.length > 0) {
        return textMatches.map(match => {
          const content = match.replace(/<[^>]+>/g, '');
          return content;
        }).join(' ');
      }
      
      // If all else fails, return cleaned text
      return this.cleanBinaryText(text);
    } catch (error) {
      console.error('DOCX extraction error:', error);
      return '';
    }
  },
  
  /**
   * Extract text from XLSX files
   */
  async extractTextFromXLSX(arrayBuffer: ArrayBuffer): Promise<string> {
    // In a real implementation, you'd use a library like xlsx.js
    // This is a simplified version that extracts text from XML in the XLSX
    console.log('XLSX extraction: Using simplified extraction');
    
    try {
      // Convert ArrayBuffer to text
      const textDecoder = new TextDecoder('utf-8');
      const text = textDecoder.decode(arrayBuffer);
      
      // Look for sheet data in the XLSX (ZIP) file
      const sheetMatches = text.match(/<row[^>]*>([\s\S]*?)<\/row>/g);
      if (sheetMatches && sheetMatches.length > 0) {
        // Extract cell values
        return sheetMatches.map(row => {
          const cellMatches = row.match(/<c[^>]*><v>([\s\S]*?)<\/v><\/c>/g);
          if (cellMatches && cellMatches.length > 0) {
            return cellMatches.map(cell => {
              const valueMatch = cell.match(/<v>([\s\S]*?)<\/v>/);
              return valueMatch ? valueMatch[1] : '';
            }).join('\t');
          }
          return '';
        }).join('\n');
      }
      
      // Fallback: try to find any cell values
      const cellMatches = text.match(/<v>([\s\S]*?)<\/v>/g);
      if (cellMatches && cellMatches.length > 0) {
        return cellMatches.map(match => {
          const content = match.replace(/<[^>]+>/g, '');
          return content;
        }).join(' ');
      }
      
      // If all else fails, return cleaned text
      return this.cleanBinaryText(text);
    } catch (error) {
      console.error('XLSX extraction error:', error);
      return '';
    }
  },
  
  /**
   * Format CSV content for better readability
   */
  formatCSV(text: string): string {
    try {
      // Split into rows
      const rows = text.split(/\r?\n/);
      if (rows.length === 0) return text;
      
      // Get headers
      const headers = rows[0].split(',').map(header => header.trim());
      
      // Format as readable text
      let result = 'CSV Data:\n\n';
      
      // Add header row
      result += headers.join(' | ') + '\n';
      result += headers.map(() => '---').join(' | ') + '\n';
      
      // Add data rows (limit to 1000 rows for performance)
      const dataRows = rows.slice(1, 1001);
      for (const row of dataRows) {
        if (!row.trim()) continue;
        const cells = row.split(',').map(cell => cell.trim());
        result += cells.join(' | ') + '\n';
      }
      
      // Add note if truncated
      if (rows.length > 1001) {
        result += `\n[Note: Showing 1000 of ${rows.length - 1} data rows]`;
      }
      
      return result;
    } catch (error) {
      console.error('CSV formatting error:', error);
      return text;
    }
  },
  
  /**
   * Clean binary text by removing non-printable characters
   */
  cleanBinaryText(text: string): string {
    // Remove non-printable characters
    let cleaned = text.replace(/[\x00-\x1F\x7F-\xFF]/g, '');
    cleaned = cleaned.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
    
    // Find longest sequence of readable text
    const segments = cleaned.split(/[^\w\s.,;:!?'"()[\]{}@#$%^&*=+\-_|\\/<>`~]+/).filter(s => s.length > 20);
    
    if (segments.length > 0) {
      // Sort by length (descending) and take the top 10 segments
      return segments
        .sort((a, b) => b.length - a.length)
        .slice(0, 10)
        .join('\n\n');
    }
    
    return cleaned.substring(0, 50000); // Limit to 50K chars
  },
}; 