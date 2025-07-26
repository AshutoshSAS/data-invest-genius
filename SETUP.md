# Data Invest Genius - Setup Guide

## Phase 1: Core Backend Setup

### 1. Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# AI Services (Optional - for Phase 2)
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Database Setup

#### Option A: Using Supabase CLI (Recommended)

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your_project_ref_here
   ```

4. Run migrations:
   ```bash
   supabase db push
   ```

#### Option B: Manual Setup via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL from `supabase/migrations/001_initial_schema.sql`
4. Run the SQL from `supabase/migrations/002_rls_policies.sql`

### 3. Storage Configuration

In your Supabase dashboard:

1. Go to Storage
2. Create a new bucket called `research-documents`
3. Set it to private
4. Add the following storage policies:

```sql
-- Create storage bucket for research documents
INSERT INTO storage.buckets (id, name, public) VALUES ('research-documents', 'research-documents', false);

-- Create policies for document access
CREATE POLICY "Users can upload their own documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'research-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their team's documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'research-documents');
```

### 4. Authentication Setup

1. In Supabase Dashboard, go to Authentication > Settings
2. Configure your site URL (e.g., `http://localhost:5173`)
3. Add redirect URLs for your domain
4. Enable email confirmations (optional)

### 5. Install Dependencies

```bash
npm install
```

### 6. Start Development Server

```bash
npm run dev
```

## Phase 2: AI Integration (Coming Soon)

### Gemini AI Setup

1. Get a Gemini API key from Google AI Studio
2. Add it to your `.env` file
3. Deploy edge functions (instructions will be provided)

### OpenAI Embeddings Setup

1. Get an OpenAI API key
2. Add it to your `.env` file
3. Configure vector embeddings

## Current Features

✅ **Authentication System**
- User registration and login
- Role-based access control (admin, analyst, researcher, viewer)
- Protected routes
- Professional auth UI

✅ **Database Schema**
- User profiles with roles
- Research documents with metadata
- Tags system for categorization
- Chat conversations and messages
- Vector embeddings support
- Row Level Security (RLS) policies

✅ **Frontend Foundation**
- React 18 + TypeScript + Vite
- Shadcn/ui components
- Professional design system
- Responsive layout
- React Query for state management

## Next Steps

1. **Test Authentication**: Create an account and verify login/logout
2. **Database Verification**: Check that tables are created correctly
3. **Storage Setup**: Configure file upload bucket
4. **Phase 2 Implementation**: AI integration and RAG system

## Troubleshooting

### Common Issues

1. **Supabase Connection Error**
   - Verify your environment variables
   - Check that your Supabase project is active
   - Ensure RLS policies are applied

2. **Authentication Issues**
   - Check Supabase Auth settings
   - Verify redirect URLs
   - Clear browser cache

3. **Database Errors**
   - Run migrations in correct order
   - Check Supabase logs for errors
   - Verify table permissions

### Support

For issues or questions, check the Supabase documentation or create an issue in the repository. 