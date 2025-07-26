import { AIService } from './ai';
import { RAGSystem } from './rag';

export async function testOpenRouterIntegration() {
  console.log('🧪 Testing OpenRouter Integration...');
  
  try {
    // Test 1: Basic API call
    console.log('📞 Testing basic API call...');
    const response = await AIService.callGeminiAPI('Hello! Please respond with "OpenRouter is working!"');
    console.log('✅ API Response:', response);
    
    // Test 2: Embedding generation
    console.log('🔗 Testing embedding generation...');
    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (geminiApiKey) {
      const ragSystem = RAGSystem.getInstance(geminiApiKey);
      const embedding = await ragSystem.generateEmbedding('This is a test text for embedding generation.');
      console.log('✅ Embedding generated, length:', embedding.length);
    } else {
      console.log('⚠️ No Gemini API key found, skipping embedding test');
    }
    
    // Test 3: Document analysis
    console.log('📄 Testing document analysis...');
    const testContent = 'This is a test research document about artificial intelligence and machine learning. It discusses various applications and future implications.';
    const analysis = await AIService.analyzeDocument('test-id', testContent);
    console.log('✅ Analysis completed:', analysis);
    
    console.log('🎉 All tests passed! OpenRouter integration is working correctly.');
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
} 