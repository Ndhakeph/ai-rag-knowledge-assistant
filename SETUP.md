# Quick Setup Guide

## 🚀 5-Minute Setup

### Step 1: Database Setup (Supabase)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to **SQL Editor** tab
4. Copy the entire contents of `supabase-schema.sql` and run it
5. Verify tables were created: Go to **Table Editor** and check for:
   - `documents` table
   - `document_chunks` table

### Step 2: Get Your API Keys

#### Google Gemini API Key:
1. Visit [ai.google.dev](https://ai.google.dev/)
2. Click "Get API Key"
3. Create a new API key
4. Copy the key

#### Supabase Keys:
1. In your Supabase project, go to **Settings** → **API**
2. Copy the **Project URL** (under Project URL)
3. Copy the **anon public** key (under Project API keys)

### Step 3: Configure Environment

Copy the example env file and add your credentials:
```bash
cp .env.example .env.local
```

Then edit `.env.local` with your actual values:
```env
GOOGLE_API_KEY=your_google_api_key_here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Step 4: Run the Application

```bash
# Already done: npm install

# Start development server
npm run dev
```

Visit http://localhost:3000

### Step 5: Test the System

1. **Upload a document**: Go to /upload and drag-drop a PDF or TXT file
2. **Wait for processing**: You'll see a success message when done
3. **Ask a question**: Go to the home page and ask about your document
4. **See streaming response**: Watch the AI respond in real-time with sources

## ✅ Verification Checklist

- [ ] Supabase project created
- [ ] Schema SQL executed successfully
- [ ] Both tables (documents, document_chunks) exist
- [ ] pgvector extension enabled
- [ ] Environment variables configured
- [ ] Dependencies installed (`npm install`)
- [ ] Dev server running (`npm run dev`)
- [ ] Can access http://localhost:3000
- [ ] Can upload a document
- [ ] Can ask questions and get responses

## 🐛 Common Issues

### "Relation does not exist" error
→ You forgot to run the SQL schema. Go back to Step 1.

### "Invalid API key" for Gemini
→ Check your Google API key is correct and has Gemini access enabled

### "Failed to connect to Supabase"
→ Verify your Supabase URL and anon key are correct

### File upload fails
→ Make sure file is under 10MB and is PDF/TXT/MD/DOCX format

## 📚 What to Upload First

Good test documents:
- Research papers (PDF)
- Documentation (MD)
- Reports (DOCX)
- Articles (TXT)

Avoid:
- Very large files (>10MB)
- Scanned documents without text
- Image-only PDFs

## 🎯 Sample Questions

After uploading a document, try:
- "Summarize this document"
- "What are the main findings?"
- "Explain the methodology"
- "What are the key recommendations?"

## 🚀 Production Deployment

For production deployment:

1. **Push to GitHub**
2. **Deploy to Vercel**:
   - Connect your GitHub repo
   - Add environment variables in Vercel dashboard
   - Deploy!
3. **Update Supabase RLS**:
   - Add proper authentication
   - Update Row Level Security policies

## 📞 Need Help?

Check the main README.md for detailed documentation and troubleshooting.
