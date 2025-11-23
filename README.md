# 🧠 RAG Knowledge Assistant

A **production-grade** Retrieval-Augmented Generation (RAG) system built with modern AI technologies. Upload documents, ask questions, and get intelligent answers with source citations and streaming responses.

![Tech Stack](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![LangChain](https://img.shields.io/badge/LangChain.js-Latest-green)
![Supabase](https://img.shields.io/badge/Supabase-pgvector-3ecf8e?logo=supabase)
![Gemini](https://img.shields.io/badge/Google-Gemini_2.0-4285F4?logo=google)

## ✨ Features

### 🔍 **Advanced RAG Pipeline**
- **Multi-stage retrieval** with cosine similarity search
- **Intelligent reranking** based on:
  - Vector similarity (50%)
  - Keyword overlap (25%)
  - Document position (15%)
  - Recency (10%)
- **Smart chunking** using RecursiveCharacterTextSplitter
- **Source attribution** with relevance scores

### 💬 **Streaming Chat Interface**
- Real-time streaming responses using Vercel AI SDK
- Beautiful UI with typing indicators
- Conversation history tracking
- Source citations displayed with each answer

### 📄 **Document Management**
- **Drag-and-drop upload** with visual feedback
- Support for **PDF, TXT, MD, DOCX** files
- Automatic text extraction and processing
- Document search and filtering
- Easy deletion with cascade cleanup

### ⚡ **Performance & Scale**
- HNSW indexing for fast similarity search
- Batch embedding generation
- Optimized database queries
- Edge runtime support

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Chat Page   │  │ Upload Page  │  │ Knowledge    │         │
│  │  (Streaming) │  │ (Drag & Drop)│  │ Management   │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                  │                  │
└─────────┼─────────────────┼──────────────────┼──────────────────┘
          │                 │                  │
          ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS SERVER ACTIONS                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  /api/chat/route.ts - Streaming chat endpoint           │   │
│  │  /actions/query.ts  - RAG query handler                 │   │
│  │  /actions/ingest.ts - Document ingestion pipeline       │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────┬─────────────────────────────────────────────┬─────────┘
          │                                             │
          ▼                                             ▼
┌──────────────────────────────┐          ┌──────────────────────┐
│    LANGCHAIN.JS PIPELINE     │          │   DOCUMENT PARSER    │
│  ┌────────────────────────┐  │          │  ┌────────────────┐  │
│  │ 1. Embeddings          │  │          │  │ PDF Parser     │  │
│  │    (Gemini text-       │  │          │  │ TXT Parser     │  │
│  │     embedding-004)     │  │          │  │ MD Parser      │  │
│  └────────┬───────────────┘  │          │  │ DOCX Parser    │  │
│           │                  │          │  └────────────────┘  │
│  ┌────────▼───────────────┐  │          └──────────┬───────────┘
│  │ 2. Vector Store        │  │                     │
│  │    (Supabase pgvector) │◄─┼─────────────────────┘
│  └────────┬───────────────┘  │
│           │                  │
│  ┌────────▼───────────────┐  │
│  │ 3. Retriever           │  │
│  │    - Similarity Search │  │
│  │    - Reranking         │  │
│  └────────┬───────────────┘  │
│           │                  │
│  ┌────────▼───────────────┐  │
│  │ 4. RAG Chain           │  │
│  │    (Gemini 2.0 Flash)  │  │
│  │    - Context Assembly  │  │
│  │    - Prompt Template   │  │
│  │    - Streaming Output  │  │
│  └────────────────────────┘  │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│   SUPABASE POSTGRESQL        │
│   (with pgvector extension)  │
│  ┌────────────────────────┐  │
│  │ documents table        │  │
│  │ - id, name, content    │  │
│  │ - file_type, metadata  │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ document_chunks table  │  │
│  │ - id, document_id      │  │
│  │ - content, embedding   │  │
│  │ - chunk_index          │  │
│  └────────────────────────┘  │
│                              │
│  HNSW Index for fast search  │
└──────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm 9+
- **Supabase Account** (free tier works!)
- **Google AI API Key** for Gemini

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd ai-rag-knowledge-assistant
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in your Supabase dashboard
3. Run the schema from `supabase-schema.sql`

```sql
-- Copy and paste contents of supabase-schema.sql
```

This will:
- Enable pgvector extension
- Create `documents` and `document_chunks` tables
- Set up HNSW indexes for fast similarity search
- Create helper functions and triggers

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Google Gemini API Key
GOOGLE_API_KEY=your_google_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Get your keys:**
- **Google AI**: Visit [ai.google.dev](https://ai.google.dev/) and create an API key
- **Supabase**: Find in Project Settings → API

### 5. Run the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 📖 How to Use

### Step 1: Upload Documents

1. Navigate to **Upload** page
2. Drag & drop or click to select files (PDF, TXT, MD, DOCX)
3. Wait for processing:
   - Text extraction
   - Intelligent chunking (1000 chars, 200 overlap)
   - Embedding generation (768-dim vectors)
   - Storage in pgvector

### Step 2: Ask Questions

1. Go to the **Chat** page
2. Type your question
3. Get streaming responses with:
   - Accurate answers from your documents
   - Source citations with relevance scores
   - Specific chunk references

### Step 3: Manage Knowledge Base

- View all uploaded documents
- Search by filename
- Delete documents (cascades to chunks)
- See chunk counts and metadata

---

## 🧪 Sample Queries to Try

After uploading some documents, try these queries:

```
"Summarize the main points of the uploaded documents"

"What are the key findings in the research paper?"

"Explain the methodology described in section 3"

"Compare the different approaches mentioned"

"What recommendations are provided?"
```

---

## 🛠️ Tech Stack Justification

### **Next.js 14 (App Router)**
- Server Actions for seamless client-server communication
- Edge runtime support for fast responses
- Built-in optimizations and code splitting

### **LangChain.js**
- Industry standard for building AI applications
- Rich ecosystem of integrations
- Production-ready abstractions for RAG

### **Supabase pgvector**
- PostgreSQL-based (battle-tested, ACID compliant)
- Native vector operations with HNSW indexing
- 10x cheaper than dedicated vector DBs
- Easy to scale and manage

### **Google Gemini**
- **text-embedding-004**: State-of-the-art embeddings (768-dim)
- **gemini-2.0-flash-exp**: Fast, cost-effective generation
- Native support in LangChain.js
- Excellent performance on RAG tasks

### **Vercel AI SDK**
- Seamless streaming integration
- React hooks for chat interfaces
- Edge-ready with minimal overhead

---

## 📊 RAG Pipeline Details

### Document Ingestion

```typescript
File Upload
    ↓
Text Extraction (pdf-parse, mammoth)
    ↓
Chunking (RecursiveCharacterTextSplitter)
    • Size: 1000 characters
    • Overlap: 200 characters
    • Preserves semantic boundaries
    ↓
Embedding Generation (Gemini text-embedding-004)
    • Batch processing for efficiency
    • 768-dimensional vectors
    ↓
Storage (Supabase pgvector)
    • Indexed with HNSW
    • Metadata attached
```

### Query Processing

```typescript
User Question
    ↓
Query Embedding (Gemini)
    ↓
Stage 1: Vector Similarity Search
    • Cosine similarity
    • Top 10 chunks retrieved
    ↓
Stage 2: Reranking
    • Vector similarity: 50%
    • Keyword overlap: 25%
    • Position score: 15%
    • Recency: 10%
    • Top 5 after reranking
    ↓
Stage 3: Context Assembly
    • Format chunks with metadata
    • Group by source document
    ↓
RAG Chain (Gemini 2.0 Flash)
    • Prompt template with instructions
    • Streaming generation
    ↓
Response with Citations
```

---

## 📁 Project Structure

```
ai-rag-knowledge-assistant/
├── app/
│   ├── actions/
│   │   ├── ingest.ts          # Document ingestion logic
│   │   └── query.ts           # RAG query handling
│   ├── api/
│   │   └── chat/
│   │       └── route.ts       # Streaming chat endpoint
│   ├── upload/
│   │   └── page.tsx           # Upload interface
│   ├── knowledge/
│   │   └── page.tsx           # Document management
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Chat interface (home)
│   └── globals.css            # Global styles
├── components/
│   ├── ChatInterface.tsx      # Streaming chat UI
│   ├── DocumentUpload.tsx     # Drag-drop upload
│   ├── DocumentList.tsx       # Document manager
│   └── SourceCard.tsx         # Source citations
├── lib/
│   ├── langchain/
│   │   ├── embeddings.ts      # Gemini embeddings
│   │   ├── vectorstore.ts     # pgvector integration
│   │   ├── retriever.ts       # Multi-stage retrieval
│   │   └── chain.ts           # RAG chain
│   ├── supabase.ts            # Supabase client
│   ├── utils.ts               # Helper functions
│   ├── document-parser.ts     # File parsers
│   └── document-chunker.ts    # Text splitting
├── supabase-schema.sql        # Database schema
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

---

## 🔒 Production Considerations

### Security
- [ ] Implement authentication (NextAuth.js, Clerk, or Supabase Auth)
- [ ] Add rate limiting on API routes
- [ ] Validate and sanitize file uploads
- [ ] Set up proper RLS policies in Supabase
- [ ] Use environment variable validation

### Performance
- [ ] Implement caching for frequent queries
- [ ] Add pagination for large document sets
- [ ] Monitor embedding API costs
- [ ] Set up CDN for static assets
- [ ] Optimize database indexes

### Monitoring
- [ ] Integrate error tracking (Sentry)
- [ ] Set up logging (Axiom, Logtail)
- [ ] Monitor LLM costs and usage
- [ ] Track query latency
- [ ] Add LangSmith for chain debugging

### Scalability
- [ ] Implement job queue for large uploads
- [ ] Add database connection pooling
- [ ] Set up horizontal scaling for API
- [ ] Consider read replicas for Supabase
- [ ] Implement document version control

---

## 🧩 Advanced Features (Future Enhancements)

- **Multi-query retrieval**: Generate query variations for better recall
- **Hybrid search**: Combine vector + keyword (PostgreSQL FTS)
- **Conversation memory**: Maintain context across questions
- **Document summarization**: Auto-generate summaries on upload
- **Multilingual support**: Support documents in multiple languages
- **OCR integration**: Extract text from images and scanned PDFs
- **Export conversations**: Save chat history as markdown
- **Collaborative features**: Share knowledge bases with teams

---

## 🐛 Troubleshooting

### "Failed to generate embeddings"
- Check your `GOOGLE_API_KEY` is valid
- Verify you have quota remaining in Google AI Studio
- Ensure the API key has Gemini API access enabled

### "Database error: relation does not exist"
- Make sure you ran `supabase-schema.sql` in your Supabase SQL Editor
- Verify the pgvector extension is enabled
- Check that tables were created successfully

### "Module not found" errors
- Run `npm install` to ensure all dependencies are installed
- Delete `node_modules` and `.next` folders, then reinstall
- Verify Node.js version is 18 or higher

### Uploads failing
- Check file size is under 10MB
- Verify file format is supported (PDF, TXT, MD, DOCX)
- Ensure Supabase connection is working

---

## 📝 License

MIT License - feel free to use this project for learning or production!

---

## 🙏 Acknowledgments

Built with amazing open-source technologies:
- [LangChain.js](https://js.langchain.com/)
- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Google Gemini](https://ai.google.dev/)
- [Vercel AI SDK](https://sdk.vercel.ai/)

---

## 📧 Support

For questions or issues, please open an issue on GitHub or reach out via the discussions tab.

**Happy knowledge querying! 🚀**
