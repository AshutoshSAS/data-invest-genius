import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key_here') {
  throw new Error('Please set your actual Supabase anon key in the .env file. Get it from your Supabase project dashboard under Settings > API.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'analyst' | 'researcher' | 'viewer';
  team_id: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResearchDocument {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  file_path: string;
  file_size: number | null;
  content_type: string | null;
  category: string;
  status: 'processing' | 'completed' | 'error';
  ai_summary: string | null;
  extracted_text: string | null;
  vector_embedding: number[] | null;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_by: string | null;
  created_at: string;
}

export interface DocumentTag {
  document_id: string;
  tag_id: string;
}

export interface ChatConversation {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  sources: any[] | null;
  created_at: string;
}

// Database helper functions
export const db = {
  // Profile operations
  profiles: {
    async get(userId: string): Promise<Profile | null> {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },

    async create(profile: Omit<Profile, 'created_at' | 'updated_at'>): Promise<Profile> {
      const { data, error } = await supabase
        .from('profiles')
        .insert(profile)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async update(userId: string, updates: Partial<Profile>): Promise<Profile> {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  // Research documents operations
  documents: {
    async getAll(userId: string): Promise<ResearchDocument[]> {
      const { data, error } = await supabase
        .from('research_documents')
        .select(`
          *,
          document_tags(tags(*))
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },

    async get(id: string): Promise<ResearchDocument | null> {
      const { data, error } = await supabase
        .from('research_documents')
        .select(`
          *,
          document_tags(tags(*))
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },

    async create(document: Omit<ResearchDocument, 'id' | 'created_at' | 'updated_at'>): Promise<ResearchDocument> {
      const { data, error } = await supabase
        .from('research_documents')
        .insert(document)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async update(id: string, updates: Partial<ResearchDocument>): Promise<ResearchDocument> {
      const { data, error } = await supabase
        .from('research_documents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('research_documents')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    }
  },

  // Tags operations
  tags: {
    async getAll(): Promise<Tag[]> {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },

    async create(tag: Omit<Tag, 'id' | 'created_at'>): Promise<Tag> {
      const { data, error } = await supabase
        .from('tags')
        .insert(tag)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  // Chat operations
  conversations: {
    async getAll(userId: string): Promise<ChatConversation[]> {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },

    async create(conversation: Omit<ChatConversation, 'id' | 'created_at' | 'updated_at'>): Promise<ChatConversation> {
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert(conversation)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async update(id: string, updates: Partial<ChatConversation>): Promise<ChatConversation> {
      const { data, error } = await supabase
        .from('chat_conversations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  messages: {
    async getByConversation(conversationId: string): Promise<ChatMessage[]> {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },

    async create(message: Omit<ChatMessage, 'id' | 'created_at'>): Promise<ChatMessage> {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert(message)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  }
}; 