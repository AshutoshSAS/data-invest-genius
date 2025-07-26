# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/29ec31d8-1bea-4a8d-8acb-c6dc46dfe6c5

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/29ec31d8-1bea-4a8d-8acb-c6dc46dfe6c5) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Set up environment variables
# Create a .env file in the project root with the following variables:
cat > .env << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# AI API Keys
# Primary: Gemini API for embeddings (get from https://ai.google.dev/)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Fallback: OpenRouter API key (for OpenAI ada-002 embeddings and chat)
VITE_OPENAI_API_KEY=your_openrouter_api_key_here

# Optional: Other AI APIs
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
EOF

# Step 5: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (database and authentication)
- Gemini API (primary embedding model)
- OpenRouter API (fallback for OpenAI models)

## API Setup

### Required API Keys

1. **Gemini API** (Primary for embeddings):
   - Visit [Google AI Studio](https://ai.google.dev/)
   - Sign up/login and create an API key
   - Add as `VITE_GEMINI_API_KEY` in your .env file

2. **OpenRouter API** (Fallback and chat):
   - Visit [OpenRouter](https://openrouter.ai/)
   - Sign up and get your API key
   - Add as `VITE_OPENAI_API_KEY` in your .env file

3. **Supabase** (Database):
   - Visit [Supabase](https://supabase.com/)
   - Create a new project
   - Get your URL and anon key from Settings > API
   - Add as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Features

- **Document Upload & Analysis**: Supports multiple formats (.docx, .pdf, .txt, .md, etc.)
- **AI-Powered Embeddings**: Uses Gemini API for high-quality text embeddings
- **RAG System**: Retrieval-Augmented Generation for document Q&A
- **Project Management**: Organize documents into research projects
- **Auto-Tagging**: AI-powered project categorization
- **Multi-format Support**: Comprehensive document type support

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/29ec31d8-1bea-4a8d-8acb-c6dc46dfe6c5) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Deployment Guide

### Deploy to Vercel (Recommended)

1. **Fork or clone this repository**
2. **Connect to Vercel**:
   - Visit [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will automatically detect it's a Vite project

3. **Set Environment Variables** in Vercel Dashboard:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key (optional)
   VITE_OPENAI_API_KEY=your_openrouter_api_key (optional)
   ```

4. **Deploy**: Vercel will automatically build and deploy your app

### Deploy to Netlify

1. **Connect Repository**:
   - Visit [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your repository

2. **Build Settings** (auto-detected from `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Environment Variables**: Add the same variables as above in Netlify's Environment Variables section

4. **Deploy**: Netlify will build and deploy automatically

### Deploy to Other Platforms

The app is a standard Vite React application and can be deployed to:
- **GitHub Pages** (using `gh-pages` package)
- **Railway**
- **Render**
- **DigitalOcean App Platform**
- **Firebase Hosting**

### Post-Deployment Setup

After deployment:

1. **Update Supabase Settings**:
   - Add your deployed URL to Supabase Auth settings
   - Update redirect URLs in Supabase Dashboard

2. **Run Database Migrations**:
   - Ensure all SQL migrations in `/supabase/migrations/` are applied
   - You can run them via Supabase Dashboard SQL Editor

3. **Test Features**:
   - User registration/login
   - Document upload (ensure Supabase Storage is configured)
   - Project creation
   - Team functionality

### Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Your Supabase anonymous key |
| `VITE_GEMINI_API_KEY` | ⚠️ | Google Gemini API key (for AI features) |
| `VITE_OPENAI_API_KEY` | ⚠️ | OpenRouter API key (fallback for AI features) |

**Note**: AI features are currently disabled and marked as "Coming Soon".
