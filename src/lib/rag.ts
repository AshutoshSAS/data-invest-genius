import { supabase } from './supabase';

export interface DocumentChunk {
  id: string;
  content: string;
  document_id: string;
  chunk_index: number;
  embedding?: number[];
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  similarity: number;
  document_id: string;
  chunk_index: number;
}

export interface RAGContext {
  query: string;
  relevantDocuments: SearchResult[];
  context: string;
}

export class RAGSystem {
  private static instance: RAGSystem;
  private geminiApiKey: string;

  constructor(geminiApiKey: string) {
    this.geminiApiKey = geminiApiKey;
    // OpenRouter API key is accessed via environment variable in generateEmbedding
  }

  static getInstance(geminiApiKey: string): RAGSystem {
    if (!RAGSystem.instance) {
      RAGSystem.instance = new RAGSystem(geminiApiKey);
    }
    return RAGSystem.instance;
  }

  /**
   * Generate embeddings for text using Gemini API
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      console.log('Generating embedding via Gemini API...');
      const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
      
      if (GEMINI_API_KEY) {
        try {
          // Use Gemini embedding API directly as per official documentation
          const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent", {
            method: "POST",
            headers: {
              "x-goog-api-key": GEMINI_API_KEY,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "models/gemini-embedding-001",
              content: {
                parts: [{ text: text }]
              },
              outputDimensionality: 768 // Using 768 dimensions for efficiency
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini embedding API failed:', response.status, errorText);
            throw new Error(`Gemini embedding API error: ${response.status}`);
          }

          const data = await response.json();
          console.log('Gemini API response:', data);

          if (data && data.embedding && data.embedding.values) {
            console.log('Successfully generated Gemini embedding with', data.embedding.values.length, 'dimensions');
            return data.embedding.values;
          } else {
            console.error('Unexpected Gemini API response format:', data);
            throw new Error('Invalid response format from Gemini API');
          }
        } catch (err) {
          console.error('Gemini embedding API failed, falling back to OpenRouter:', err);
        }
      }

      // Fallback to OpenRouter with OpenAI ada-002
      const OPENROUTER_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
      if (OPENROUTER_API_KEY) {
        try {
          const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
              "HTTP-Referer": window.location.origin || "https://data-invest-genius.com",
              "X-Title": "Data Invest Genius",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "openai/text-embedding-ada-002",
              input: text
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenAI ada-002 embedding API failed:', response.status, errorText);
            throw new Error('OpenAI ada-002 embedding API failed');
          }

          const data = await response.json();
          if (data && data.data && data.data[0] && data.data[0].embedding) {
            console.log('Successfully generated OpenAI embedding with', data.data[0].embedding.length, 'dimensions');
            return data.data[0].embedding;
          } else {
            console.error('OpenAI ada-002 embedding API: Unexpected response', data);
            throw new Error('OpenAI ada-002 embedding API: Unexpected response');
          }
        } catch (err) {
          console.error('OpenAI ada-002 embedding API error, falling back to local:', err);
        }
      }
      
      // Final fallback to local embedding
      console.log('Using local embedding as fallback');
      return this.createAdvancedLocalEmbedding(text);
    } catch (err) {
      console.error('generateEmbedding: All embedding methods failed', err);
      return this.createAdvancedLocalEmbedding(text);
    }
  }

  /**
   * Create a simple fallback embedding when API fails
   */
  private createAdvancedLocalEmbedding(text: string): number[] {
    console.log('Creating advanced local embedding for text length:', text.length);
    
    // Advanced TF-IDF inspired embedding with semantic features
    const embedding = new Array(768).fill(0);
    
    // 1. Text preprocessing
    const cleanText = text.toLowerCase().replace(/[^\w\s]/g, ' ');
    const words = cleanText.split(/\s+/).filter(word => word.length > 2);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // 2. Basic statistics (dimensions 0-49)
    embedding[0] = Math.min(words.length / 100, 1); // Word count normalized
    embedding[1] = Math.min(sentences.length / 20, 1); // Sentence count
    embedding[2] = Math.min(text.length / 5000, 1); // Character count
    embedding[3] = words.length > 0 ? text.length / words.length / 10 : 0; // Avg word length
    
    // 3. Word frequency features (dimensions 50-299)
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });
    
    const topWords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 250);
    
    topWords.forEach(([word, freq], index) => {
      if (index + 50 < 300) {
        embedding[index + 50] = Math.min(freq / words.length, 1);
      }
    });
    
    // 4. N-gram features (dimensions 300-499)
    const bigrams = new Map<string, number>();
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = words[i] + ' ' + words[i + 1];
      bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
    }
    
    const topBigrams = Array.from(bigrams.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 200);
    
    topBigrams.forEach(([bigram, freq], index) => {
      if (index + 300 < 500) {
        embedding[index + 300] = Math.min(freq / (words.length - 1), 1);
      }
    });
    
    // 5. Semantic indicators (dimensions 500-599)
    const semanticWords = {
      financial: ['money', 'investment', 'stock', 'market', 'finance', 'profit', 'revenue', 'cost'],
      technical: ['algorithm', 'system', 'data', 'analysis', 'technology', 'software', 'compute'],
      research: ['study', 'research', 'analysis', 'findings', 'conclusion', 'methodology', 'results'],
      business: ['company', 'business', 'management', 'strategy', 'operations', 'customers'],
      academic: ['paper', 'journal', 'citation', 'abstract', 'hypothesis', 'experiment']
    };
    
    let semanticIndex = 500;
    Object.entries(semanticWords).forEach(([category, keywords]) => {
      const matches = keywords.filter(keyword => 
        words.some(word => word.includes(keyword))
      ).length;
      if (semanticIndex < 600) {
        embedding[semanticIndex] = matches / keywords.length;
        semanticIndex += 20;
      }
    });
    
    // 6. Positional features (dimensions 600-699)
    const firstWords = words.slice(0, 10);
    const lastWords = words.slice(-10);
    
    firstWords.forEach((word, index) => {
      if (index + 600 < 650) {
        embedding[index + 600] = this.hashStringToFloat(word);
      }
    });
    
    lastWords.forEach((word, index) => {
      if (index + 650 < 700) {
        embedding[index + 650] = this.hashStringToFloat(word);
      }
    });
    
    // 7. Document structure features (dimensions 700-767)
    const hasNumbers = /\d/.test(text);
    const hasUpperCase = /[A-Z]/.test(text);
    const hasBullets = /[•\-\*]/.test(text);
    const hasQuestions = /\?/.test(text);
    
    embedding[700] = hasNumbers ? 1 : 0;
    embedding[701] = hasUpperCase ? 1 : 0;
    embedding[702] = hasBullets ? 1 : 0;
    embedding[703] = hasQuestions ? 1 : 0;
    
    // Fill remaining with text hash variations
    for (let i = 704; i < 768; i++) {
      embedding[i] = this.hashStringToFloat(text + i.toString());
    }
    
    // Normalize the embedding to unit vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] = embedding[i] / magnitude;
      }
    }
    
    console.log('Created advanced local embedding, length:', embedding.length);
    return embedding;
  }

  private hashStringToFloat(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) / 2147483647; // Normalize to 0-1
  }

  private createFallbackEmbedding(text: string): number[] {
    // Fallback to simple method if advanced fails
    return this.createAdvancedLocalEmbedding(text);
  }

  /**
   * Chunk text into smaller pieces for better retrieval
   */
  chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    let start = 0;

    // Ensure overlap is not larger than chunk size
    const safeOverlap = Math.min(overlap, chunkSize - 100);
    
    console.log(`Chunking text: length=${text.length}, chunkSize=${chunkSize}, overlap=${safeOverlap}`);

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      let chunk = text.slice(start, end);

      // Try to break at sentence boundaries
      if (end < text.length) {
        const lastPeriod = chunk.lastIndexOf('.');
        const lastNewline = chunk.lastIndexOf('\n');
        const breakPoint = Math.max(lastPeriod, lastNewline);
        
        if (breakPoint > start + chunkSize * 0.7) {
          chunk = chunk.slice(0, breakPoint + 1);
        }
      }

      const trimmedChunk = chunk.trim();
      if (trimmedChunk.length > 50) {
        chunks.push(trimmedChunk);
      }

      // Calculate next start position
      const nextStart = end - safeOverlap;
      
      // Prevent infinite loop by ensuring we always move forward
      if (nextStart <= start) {
        console.warn('Preventing infinite loop, moving to end of text');
        break;
      }
      
      start = nextStart;
    }

    console.log(`Created ${chunks.length} chunks`);
    return chunks;
  }

  /**
   * Process and store document chunks with embeddings
   */
  async processDocument(documentId: string, text: string, title: string): Promise<void> {
    try {
      console.log(`Starting RAG processing for document ${documentId}`);
      console.log(`Text length: ${text.length} characters`);
      
      // Validate input
      if (!text || text.length === 0) {
        console.warn('Empty text provided, skipping RAG processing');
        return;
      }
      
      // Check if document already has chunks
      const { data: existingChunks, error: checkError } = await supabase
        .from('document_chunks')
        .select('id')
        .eq('document_id', documentId)
        .limit(1);
        
      if (!checkError && existingChunks && existingChunks.length > 0) {
        console.log('Document already has chunks, skipping processing');
        return;
      }
      
      // Delete existing chunks for this document (just in case)
      console.log('Deleting any existing chunks...');
      const { error: deleteError } = await supabase
        .from('document_chunks')
        .delete()
        .eq('document_id', documentId);

      if (deleteError) {
        console.error('Error deleting existing chunks:', deleteError);
      }

      // Create a simple chunk if text is very short
      if (text.length < 500) {
        console.log('Text is very short, creating a single chunk');
        const chunk = {
          document_id: documentId,
          chunk_index: 0,
          content: text,
          title: title || 'Document',
          embedding: null // Store without embedding for now
        };
        
        const { error } = await supabase
          .from('document_chunks')
          .insert([chunk]);
          
        if (error) {
          console.error('Error storing simple chunk:', error);
        } else {
          console.log('Successfully stored simple chunk');
        }
        
        // Try to generate embedding in the background
        this.generateEmbedding(text).then(embedding => {
          supabase
            .from('document_chunks')
            .update({ embedding })
            .eq('document_id', documentId)
            .eq('chunk_index', 0)
            .then(({ error }) => {
              if (error) {
                console.error('Error updating embedding for simple chunk:', error);
              } else {
                console.log('Successfully updated embedding for simple chunk');
              }
            });
        }).catch(error => {
          console.error('Error generating embedding for simple chunk:', error);
        });
        
        return;
      }

      // Chunk the text
      console.log('Chunking text...');
      const chunks = this.chunkText(text);
      console.log(`Created ${chunks.length} chunks`);
      
      if (chunks.length === 0) {
        console.warn('No chunks created from text, creating fallback chunk');
        // Create at least one chunk with the full text if it's not too large
        if (text.length <= 10000) {
          chunks.push(text);
        } else {
          // Create one chunk with the beginning of the text
          chunks.push(text.substring(0, 5000) + '...');
        }
      }
      
      // Limit number of chunks to prevent memory issues
      const maxChunks = 20; // Reduced from 50 to ensure processing completes
      if (chunks.length > maxChunks) {
        console.warn(`Too many chunks (${chunks.length}), limiting to ${maxChunks}`);
        chunks.splice(maxChunks);
      }

      // First store chunks without embeddings to ensure they exist
      console.log('Storing chunks without embeddings first...');
      const chunksWithoutEmbeddings = chunks.map((chunk, index) => ({
        document_id: documentId,
        chunk_index: index,
        content: chunk,
        title: title || 'Document',
        embedding: null
      }));
      
      // Store in smaller batches
      const storeBatchSize = 5;
      for (let i = 0; i < chunksWithoutEmbeddings.length; i += storeBatchSize) {
        const batch = chunksWithoutEmbeddings.slice(i, i + storeBatchSize);
        console.log(`Storing batch ${Math.floor(i/storeBatchSize) + 1}/${Math.ceil(chunksWithoutEmbeddings.length/storeBatchSize)}`);
        
        const { error } = await supabase
          .from('document_chunks')
          .insert(batch);
  
        if (error) {
          console.error(`Error storing batch ${i/storeBatchSize + 1}:`, error);
        } else {
          console.log(`Successfully stored batch ${i/storeBatchSize + 1}`);
        }
      }

      // Now generate embeddings in the background
      console.log('Starting background embedding generation...');
      this.generateEmbeddingsInBackground(documentId, chunks);

      console.log(`Successfully processed ${chunks.length} chunks for document ${documentId}`);
      
      // Verify chunks were stored
      const { data: storedChunks, error: verifyError } = await supabase
        .from('document_chunks')
        .select('id')
        .eq('document_id', documentId);

      if (verifyError) {
        console.error('Error verifying stored chunks:', verifyError);
      } else {
        console.log(`Verified ${storedChunks?.length || 0} chunks stored in database`);
      }
    } catch (error) {
      console.error('Error processing document:', error);
      // Create at least one chunk even if processing fails
      try {
        const fallbackChunk = {
          document_id: documentId,
          chunk_index: 0,
          content: text.length > 5000 ? text.substring(0, 5000) + '...' : text,
          title: title || 'Document',
          embedding: null
        };
        
        await supabase
          .from('document_chunks')
          .insert([fallbackChunk]);
          
        console.log('Created fallback chunk after error');
      } catch (fallbackError) {
        console.error('Failed to create fallback chunk:', fallbackError);
      }
    }
  }
  
  /**
   * Generate embeddings in the background after chunks are stored
   */
  private async generateEmbeddingsInBackground(documentId: string, chunks: string[]): Promise<void> {
    try {
      // Process in smaller batches to avoid memory issues
      const batchSize = 3;
      
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        console.log(`Processing embedding batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(chunks.length/batchSize)}`);
        
        for (let j = 0; j < batch.length; j++) {
          const chunkIndex = i + j;
          const chunk = batch[j];
          
          try {
            console.log(`Generating embedding for chunk ${chunkIndex + 1}/${chunks.length}`);
            const embedding = await this.generateEmbedding(chunk);
            
            // Update the chunk with the embedding
            const { error } = await supabase
              .from('document_chunks')
              .update({ embedding })
              .eq('document_id', documentId)
              .eq('chunk_index', chunkIndex);
              
            if (error) {
              console.error(`Error updating embedding for chunk ${chunkIndex}:`, error);
            } else {
              console.log(`Successfully updated embedding for chunk ${chunkIndex}`);
            }
            
            // Add a delay between API calls to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error(`Error generating embedding for chunk ${chunkIndex}:`, error);
          }
        }
      }
      
      console.log('Background embedding generation completed');
    } catch (error) {
      console.error('Error in background embedding generation:', error);
    }
  }

  /**
   * Search for relevant documents using semantic similarity
   */
  async searchDocuments(query: string, limit: number = 5): Promise<SearchResult[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);

      // Search using vector similarity
      const { data, error } = await supabase.rpc('match_document_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: limit
      });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error searching documents:', error);
      return [];
    }
  }

  /**
   * Generate AI response with RAG context using local processing
   */
  async generateResponse(query: string, context: RAGContext): Promise<string> {
    try {
      const prompt = this.buildPrompt(query, context);
      
      // Use OpenRouter with reliable free model
      const OPENROUTER_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!OPENROUTER_API_KEY) {
        return this.generateLocalRAGResponse(query, context) || 
               "Based on your documents, I can help you find relevant information. The documents have been processed and are ready for search.";
      }

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "Data Invest Genius",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "qwen/qwen-2.5-72b-instruct:free", // Use the most capable free model
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        console.log('API failed, using local response');
        return this.generateLocalRAGResponse(query, context) || 
               "I found relevant information in your documents. The content has been processed and indexed for future searches.";
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error generating response:', error);
      return this.generateLocalRAGResponse(query, context) || 
             "I can help you search through your documents. The content has been processed and is available for queries.";
    }
  }

  /**
   * Generate local RAG response without API calls
   */
  private generateLocalRAGResponse(query: string, context: RAGContext): string | null {
    if (context.relevantDocuments.length === 0) {
      return `I searched through your documents but didn't find specific content matching "${query}". This might be because the document is still being processed or the query is very specific. Try asking about general topics covered in your documents.`;
    }

    const docs = context.relevantDocuments;
    const docCount = docs.length;
    const firstDoc = docs[0];
    
    // Generate a helpful response based on found documents
    let response = `I found ${docCount} relevant document${docCount > 1 ? 's' : ''} that might help answer your question about "${query}".\n\n`;
    
    if (firstDoc) {
      response += `From "${firstDoc.title}":\n`;
      response += firstDoc.content.substring(0, 300);
      if (firstDoc.content.length > 300) {
        response += '...';
      }
      response += '\n\n';
    }
    
    if (docCount > 1) {
      response += `There ${docCount === 2 ? 'is' : 'are'} ${docCount - 1} additional relevant document${docCount > 2 ? 's' : ''} that might contain more information about this topic.`;
    }
    
    return response;
  }

  /**
   * Build prompt with RAG context
   */
  private buildPrompt(query: string, context: RAGContext): string {
    const relevantDocs = context.relevantDocuments
      .map(doc => `Document: ${doc.title}\nContent: ${doc.content}\nRelevance: ${Math.round(doc.similarity * 100)}%\n`)
      .join('\n');

    if (context.relevantDocuments.length === 0) {
      return `You are an AI research assistant helping users analyze their research documents. 

${context.context}

User Query: ${query}

Instructions:
1. Acknowledge that the document is still processing or not fully analyzed
2. Provide helpful general guidance about what the user might expect once processing is complete
3. Suggest 5 alternative questions they could ask about research documents in general
4. Format your response with clear sections using markdown (## headers)
5. Be encouraging and explain that processing takes time for thorough analysis
6. Mention that the user can try again later when processing is complete

## Response Format:
Start with a brief acknowledgment of the processing status, then provide guidance, followed by alternative questions in a bulleted list.

Please provide a helpful response:`;
    }

    return `You are an AI research assistant helping users analyze their research database. 

Context from relevant documents:
${relevantDocs}

User Query: ${query}

Instructions for answering:
1. Structure your response with clear sections using markdown headers (##)
2. Always include an "Analysis" or "Answer" section at the beginning
3. When appropriate, include a "Recommendation" or "Conclusion" section
4. Cite specific documents when making claims
5. Be concise but thorough
6. If you find conflicting information in the documents, acknowledge this and explain the different perspectives
7. Use bullet points or numbered lists for key points when appropriate
8. Format your response for readability with paragraphs and section breaks

## Response Format:
## Analysis
[Your main answer based on the documents, with specific citations when relevant]

## Key Points
[Bullet points of the most important information]

## Recommendations
[Optional section with actionable suggestions based on the analysis]

Please provide a helpful, well-structured response based on the research context provided:`;
  }

  /**
   * Get RAG context for a query
   */
  async getRAGContext(query: string): Promise<RAGContext> {
    const relevantDocuments = await this.searchDocuments(query);
    
    const context = relevantDocuments
      .map(doc => `${doc.title}: ${doc.content}`)
      .join('\n\n');

    return {
      query,
      relevantDocuments,
      context
    };
  }

  /**
   * Get context from a specific document
   */
  async getDocumentContext(documentId: string, query: string, limit: number = 3): Promise<RAGContext> {
    try {
      console.log(`Getting document context for document ${documentId}`);
      
      // First check if document chunks exist
      const { data: chunks, error: chunksError } = await supabase
        .from('document_chunks')
        .select('*')
        .eq('document_id', documentId)
        .limit(1);

      console.log('Chunks check result:', { chunks, error: chunksError });

      if (chunksError || !chunks || chunks.length === 0) {
        console.log('No chunks found for document, returning fallback context');
        
        // Try to get the document title for better context
        const { data: documentData } = await supabase
          .from('research_documents')
          .select('title, content')
          .eq('id', documentId)
          .single();
          
        const documentTitle = documentData?.title || 'Document';
        
        // No chunks found - document might not be processed yet
        // Try to process the document now
        if (documentData?.content) {
          // Document exists but hasn't been processed - try to process it now
          console.log('Document found but not processed, attempting to process now...');
          try {
            await this.processDocument(documentId, documentData.content, documentData.title);
            console.log('Document processing initiated');
            
            // Check if processing succeeded
            const { data: newChunks } = await supabase
              .from('document_chunks')
              .select('*')
              .eq('document_id', documentId)
              .limit(1);
              
            if (newChunks && newChunks.length > 0) {
              console.log('Document successfully processed, retrying context fetch');
              // Recursively call this method now that chunks exist
              return this.getDocumentContext(documentId, query, limit);
            }
          } catch (processError) {
            console.error('Error processing document:', processError);
          }
        }
        
        // Return fallback context if processing failed or document doesn't exist
        return {
          query,
          relevantDocuments: [],
          context: `This document (${documentTitle}) appears to be still processing or has not been fully analyzed yet. You can still ask general questions about the document.`
        };
      }

      // First try to get chunks with embeddings
      const { data: chunksWithEmbeddings } = await supabase
        .from('document_chunks')
        .select('*')
        .eq('document_id', documentId)
        .not('embedding', 'is', null)
        .limit(10);
        
      // If we have chunks with embeddings, use vector search
      if (chunksWithEmbeddings && chunksWithEmbeddings.length > 0) {
        console.log(`Found ${chunksWithEmbeddings.length} chunks with embeddings, using vector search`);
        
        try {
          // Generate embedding for the query
          console.log('Generating query embedding...');
          const queryEmbedding = await this.generateEmbedding(query);
          
          // Try to use the RPC function for vector search
          console.log('Attempting to use RPC function for similarity search...');
          const { data, error } = await supabase.rpc('match_document_chunks', {
            query_embedding: queryEmbedding,
            document_id: documentId,
            match_threshold: 0.5, // Lower threshold to get more results
            match_count: limit
          });

          if (error) {
            console.log('RPC function failed, falling back to basic search:', error);
            throw error;
          }

          const relevantDocuments = data || [];
          console.log(`Found ${relevantDocuments.length} relevant chunks via RPC`);
          
          if (relevantDocuments.length > 0) {
            // Create context from relevant chunks
            const context = relevantDocuments
              .map((doc: any) => `[${doc.title}]: ${doc.content}`)
              .join('\n\n');

            return {
              query,
              relevantDocuments,
              context
            };
          }
          
          // If no relevant chunks found via vector search, fall back to basic search
          console.log('No relevant chunks found via vector search, using basic search');
          throw new Error('No relevant chunks found via vector search');
        } catch (vectorSearchError) {
          console.log('Vector search failed, falling back to basic search');
        }
      }
      
      // Fallback: Basic text search
      console.log('Using basic text search as fallback');
      
      // Get all chunks for this document
      const { data: allChunks, error: allChunksError } = await supabase
        .from('document_chunks')
        .select('*')
        .eq('document_id', documentId)
        .order('chunk_index', { ascending: true });

      if (allChunksError || !allChunks || allChunks.length === 0) {
        throw new Error('No document chunks available');
      }

      console.log(`Found ${allChunks.length} total chunks, performing basic search`);
      
      // Perform basic text search
      const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
      const scoredChunks = allChunks.map(chunk => {
        const content = chunk.content.toLowerCase();
        let score = 0;
        
        // Score based on term frequency
        queryTerms.forEach(term => {
          const regex = new RegExp(term, 'gi');
          const matches = content.match(regex);
          if (matches) {
            score += matches.length;
          }
        });
        
        return {
          ...chunk,
          score
        };
      });
      
      // Sort by score and take the top chunks
      const topChunks = scoredChunks
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
        
      // If no chunks have a score, just use the first few chunks
      if (topChunks.every(chunk => chunk.score === 0)) {
        console.log('No matching chunks found, using first chunks');
        topChunks.splice(0, topChunks.length, ...allChunks.slice(0, limit));
      }
      
      console.log(`Selected ${topChunks.length} chunks using basic search`);
      
      // Format the chunks as search results
      const relevantDocuments = topChunks.map(chunk => ({
        id: chunk.id,
        title: chunk.title || 'Document',
        content: chunk.content,
        similarity: chunk.score > 0 ? chunk.score / 10 : 0.6, // Normalize score
        document_id: chunk.document_id,
        chunk_index: chunk.chunk_index
      }));
      
      // Create context from relevant chunks
      const context = relevantDocuments
        .map((doc) => `[${doc.title}]: ${doc.content}`)
        .join('\n\n');

      return {
        query,
        relevantDocuments,
        context
      };
    } catch (error) {
      console.error('Error getting document context:', error);
      return {
        query,
        relevantDocuments: [],
        context: 'I apologize, but I encountered an error while searching this document. The document might still be processing or there might be a technical issue.'
      };
    }
  }

  /**
   * Get context from all documents in a project
   */
  async getProjectContext(projectId: string, query: string, limit: number = 5): Promise<RAGContext> {
    try {
      // First, get all documents associated with this project
      const { data: projectDocs, error: projectError } = await supabase
        .from('project_documents')
        .select('document_id')
        .eq('project_id', projectId);

      if (projectError) throw projectError;

      if (!projectDocs || projectDocs.length === 0) {
        return {
          query,
          relevantDocuments: [],
          context: 'No documents found in this project.'
        };
      }

      // Get document IDs
      const documentIds = projectDocs.map(doc => doc.document_id);

      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Search for similar chunks across all project documents
      const { data, error } = await supabase.rpc('match_document_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: 0.6,
        match_count: limit
      });

      if (error) throw error;

      // Filter results to only include documents from this project
      const relevantDocuments = (data || []).filter((doc: any) => 
        documentIds.includes(doc.document_id)
      );
      
      // Create context from relevant chunks
      const context = relevantDocuments
        .map((doc: any) => `[${doc.title}]: ${doc.content}`)
        .join('\n\n');

      return {
        query,
        relevantDocuments,
        context
      };
    } catch (error) {
      console.error('Error getting project context:', error);
      return {
        query,
        relevantDocuments: [],
        context: ''
      };
    }
  }

  /**
   * Test database connection and table structure
   */
  async testDatabaseConnection(): Promise<{
    success: boolean;
    message: string;
    chunksCount?: number;
  }> {
    try {
      console.log('Testing database connection...');
      
      // Test if document_chunks table exists and is accessible
      const { data: chunks, error } = await supabase
        .from('document_chunks')
        .select('id')
        .limit(1);

      if (error) {
        console.error('Database connection test failed:', error);
        return {
          success: false,
          message: `Database error: ${error.message}`
        };
      }

      // Get total count of chunks
      const { count } = await supabase
        .from('document_chunks')
        .select('*', { count: 'exact', head: true });

      console.log('Database connection test successful');
      return {
        success: true,
        message: 'Database connection successful',
        chunksCount: count || 0
      };
    } catch (error) {
      console.error('Database connection test error:', error);
      return {
        success: false,
        message: `Connection error: ${error.message}`
      };
    }
  }

  /**
   * Generate research summary for a topic
   */
  async generateResearchSummary(topic: string): Promise<{
    summary: string;
    keyInsights: string[];
    relatedTopics: string[];
    sources: SearchResult[];
  }> {
    try {
      const relevantDocs = await this.searchDocuments(topic, 10);
      
      if (relevantDocs.length === 0) {
        return {
          summary: "No research documents found for this topic.",
          keyInsights: [],
          relatedTopics: [],
          sources: []
        };
      }

      const context = relevantDocs
        .map(doc => `${doc.title}: ${doc.content}`)
        .join('\n\n');

      const summaryPrompt = `Based on the following research documents, provide a comprehensive summary of "${topic}":

${context}

Please provide:
1. A concise summary of the main findings
2. 3-5 key insights
3. Related topics for further research
4. List of source documents used

Format your response as JSON with keys: summary, keyInsights (array), relatedTopics (array), sources (array of document titles)`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: summaryPrompt
            }]
          }]
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const responseText = data.candidates[0].content.parts[0].text;
      
      try {
        const parsed = JSON.parse(responseText);
        return {
          summary: parsed.summary,
          keyInsights: parsed.keyInsights || [],
          relatedTopics: parsed.relatedTopics || [],
          sources: relevantDocs
        };
      } catch {
        // Fallback if JSON parsing fails
        return {
          summary: responseText,
          keyInsights: [],
          relatedTopics: [],
          sources: relevantDocs
        };
      }
    } catch (error) {
      console.error('Error generating research summary:', error);
      return {
        summary: "Unable to generate summary at this time.",
        keyInsights: [],
        relatedTopics: [],
        sources: []
      };
    }
  }
} 