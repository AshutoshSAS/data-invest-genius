// Simple in-memory cache for AI responses to reduce API calls
class AICache {
  private cache = new Map<string, { response: string; timestamp: number }>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_CACHE_SIZE = 1000;

  private generateKey(prompt: string, context?: string): string {
    const content = context ? `${context}\n\n${prompt}` : prompt;
    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString();
  }

  set(prompt: string, response: string, context?: string): void {
    const key = this.generateKey(prompt, context);
    
    // If cache is too large, remove oldest entries
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      response,
      timestamp: Date.now()
    });
    
    console.log(`Cached AI response for key: ${key.substring(0, 10)}...`);
  }

  get(prompt: string, context?: string): string | null {
    const key = this.generateKey(prompt, context);
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    // Check if cache entry is expired
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      console.log(`Cache expired for key: ${key.substring(0, 10)}...`);
      return null;
    }
    
    console.log(`Cache hit for key: ${key.substring(0, 10)}...`);
    return cached.response;
  }

  clear(): void {
    this.cache.clear();
    console.log('AI cache cleared');
  }

  getStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      hitRate: 0 // Could track this if needed
    };
  }
}

export const aiCache = new AICache(); 