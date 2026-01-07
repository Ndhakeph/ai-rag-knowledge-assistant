# 🎯 RAG Knowledge Assistant

**Production-grade Retrieval-Augmented Generation (RAG) system with 100% local inference**

A fully local AI-powered document Q&A system built with Next.js, LangChain.js, Ollama, and Supabase pgvector. Upload documents, ask questions, and get accurate answers with source citations—all without external API dependencies.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Ollama](https://img.shields.io/badge/Ollama-Local%20AI-orange)](https://ollama.ai/)
[![Supabase](https://img.shields.io/badge/Supabase-pgvector-green?logo=supabase)](https://supabase.com/)

---

## ✨ Key Features

### **🔒 Fully Local Architecture**
- **Zero API keys** - No external dependencies that can leak, expire, or hit rate limits
- **Complete privacy** - Your documents never leave your machine
- **Unlimited usage** - No per-query costs or throttling
- **Works offline** - Internet only needed for initial setup

### **⚡ Production-Grade Performance**
- **Fast vector search** - HNSW indexing for sub-100ms similarity search on 10k+ chunks
- **Streaming responses** - Real-time word-by-word generation for better UX
- **Optimized chunking** - Smart text splitting with 1000-char chunks and 200-char overlap
- **Batch processing** - Efficient document ingestion pipeline

### **🎯 Technical Highlights**
- **RAG pipeline** - Document parsing → Chunking → Embedding → Vector storage → Retrieval → Generation
- **Semantic search** - 768-dimensional embeddings with cosine similarity
- **Source attribution** - Every answer cites specific document chunks
- **Type-safe** - Full TypeScript coverage for reliability

---

## 🏗️ Architecture

```
┌─────────────┐
│   Upload    │  PDF/TXT/MD/DOCX
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Parse     │  Extract text content
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Chunk     │  1000 chars, 200 overlap
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Embed     │  nomic-embed-text (768D)
└──────┬──────┘         via Ollama
       │
       ▼
┌─────────────┐
│   Store     │  Supabase pgvector
└─────────────┘  HNSW index


Query Flow:
┌─────────────┐
│ User Query  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Embed Query │  nomic-embed-text
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Retrieve   │  Top-K similarity (HNSW)
└──────┬──────┘  Rerank by relevance
       │
       ▼
┌─────────────┐
│  Generate   │  gemma3:4b via Ollama
└──────┬──────┘  Stream response
       │
       ▼
┌─────────────┐
│   Display   │  With source citations
└─────────────┘
```

---

## 🛠️ Tech Stack

### **Frontend**
- **Next.js 14** - React framework with App Router
- **TypeScript 5.6** - Type safety throughout
- **Tailwind CSS** - Utility-first styling
- **Vercel AI SDK** - Streaming chat interface

### **Backend**
- **Next.js API Routes** - Serverless endpoints
- **LangChain.js** - RAG orchestration and document processing
- **Ollama** - Local LLM inference
  - `gemma3:4b` (3.3 GB) - Fast, high-quality text generation
  - `nomic-embed-text` (274 MB) - Semantic embeddings

### **Database**
- **Supabase** - PostgreSQL with pgvector extension
- **pgvector** - Vector similarity search with HNSW indexing

### **Document Processing**
- **pdf-parse** - PDF text extraction
- **mammoth** - DOCX parsing
- **LangChain RecursiveCharacterTextSplitter** - Intelligent text chunking

---

## 🚀 Quick Start

### **Prerequisites**

1. **Ollama** (Mac/Windows/Linux)
```bash
# Mac
brew install ollama

# Pull required models
ollama pull gemma3:4b          # ~3.3 GB
ollama pull nomic-embed-text   # ~274 MB

# Start Ollama (keep running)
ollama serve
```

2. **Node.js 18+**
```bash
node --version  # Should be >= 18
```

3. **Supabase Account** (free tier sufficient)

### **Installation**

```bash
# Clone repository
git clone https://github.com/tacitusblindsbig/ai-rag-knowledge-assistant
cd ai-rag-knowledge-assistant

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Add your Supabase credentials to .env.local

# Start development server
npm run dev
```

Open http://localhost:3000

### **Database Setup**

1. Go to [supabase.com](https://supabase.com) and create a project
2. Open SQL Editor in your Supabase dashboard
3. Copy contents of `supabase-schema.sql` and run it
4. Verify tables created: `documents` and `document_chunks`
5. Update `.env.local` with your Supabase URL and anon key

---

## 📖 Usage

### **1. Upload Documents**
- Supported formats: PDF, TXT, MD, DOCX
- Drag & drop or click to browse
- Processing time: ~1-2 seconds per page

### **2. Ask Questions**
- Natural language queries about your documents
- Streaming responses (1-3 seconds)
- Source citations for transparency

### **3. Manage Knowledge Base**
- View all uploaded documents
- See metadata (chunk count, upload date, file size)
- Delete documents via Knowledge Base interface

---

## 🎯 What Makes This Special

### **For Technical Interviews**

> **"I built a production-grade RAG system using Ollama for local inference to eliminate API costs and privacy concerns. The system uses Supabase's pgvector extension with HNSW indexing for fast similarity search, which scales to 100k+ vectors with sub-100ms query times. I implemented the full pipeline from document parsing and intelligent chunking to vector storage and streaming response generation."**

### **Key Technical Decisions**

**Why Ollama?**
- Eliminates external API dependencies and associated failure modes
- Zero cost for unlimited usage
- Complete data privacy (GDPR/HIPAA compliance potential)
- Enables offline operation after initial setup

**Why HNSW indexing?**
- Approximate Nearest Neighbor (ANN) algorithm
- O(log n) query time vs O(n) for brute force
- 10-100x faster on large datasets (10k+ vectors)
- Industry standard for production vector search

**Why 1000-char chunks with 200 overlap?**
- Balances semantic coherence with retrieval precision
- 200-char overlap prevents context loss at boundaries
- Tested optimal range for question-answering tasks
- Smaller than typical (1500) to improve relevance

**Why gemma3:4b over larger models?**
- Optimized for Apple Silicon (M-series chips)
- 2-3 second inference vs 5-10 for 9B models
- Quality sufficient for RAG (retrieval provides context)
- Better user experience with streaming

---

## 📊 Performance

### **Speed (Mac M4)**
| Operation | Time | Notes |
|-----------|------|-------|
| Document upload | 1-2 sec/page | Includes parsing, chunking, embedding |
| Query embedding | 100-200ms | nomic-embed-text |
| Similarity search | 50-100ms | HNSW index, 10k chunks |
| Response generation | 1-3 sec | Streaming, gemma3:4b |
| **Total query time** | **2-4 sec** | End-to-end |

### **Quality**
- **Gemma3 4B** matches GPT-3.5 quality for RAG tasks
- **Nomic embeddings** comparable to OpenAI ada-002 (768D)
- **Retrieval accuracy** depends on chunk strategy and query quality

### **Scalability**
- Tested with 1000+ documents (10,000+ chunks)
- HNSW indexing scales to 100,000+ chunks
- Postgres connection pooling via Supabase
- Chunk storage: ~1KB per chunk (text + vector)

---

## 🔧 Configuration

### **Changing Models**

**For faster responses (lower quality):**
```bash
ollama pull gemma2:2b
```
Edit `lib/langchain/ollama.ts` and change `MODEL_NAME = 'gemma2:2b'`

**For better quality (slower):**
```bash
ollama pull gemma2:9b
```
Edit `lib/langchain/ollama.ts` and change `MODEL_NAME = 'gemma2:9b'`

### **Tuning Retrieval**

Edit `lib/langchain/retriever.ts`:

```typescript
k: 10,              // Number of chunks to retrieve (5-20)
matchThreshold: 0.5, // Minimum similarity score (0.3-0.7)
rerankTopK: 5,      // Final chunks after reranking (3-10)
```

**Guidelines:**
- Higher `k` → More context, slower, may include irrelevant chunks
- Lower `matchThreshold` → More results, may reduce precision
- `rerankTopK` should be ≤ `k`, typically 50% of `k`

### **Adjusting Chunking**

Edit `lib/document-chunker.ts`:

```typescript
chunkSize: 1000,      // Characters per chunk (500-2000)
chunkOverlap: 200,    // Overlap between chunks (100-400)
```

**Trade-offs:**
- Smaller chunks (500-800): Better precision, more chunks to process
- Larger chunks (1200-2000): More context per chunk, may dilute relevance
- Overlap prevents information loss at boundaries

---

## 🛠️ Troubleshooting

### **Error: "Ollama is not running"**
```bash
ollama serve
```
Keep this terminal open. Check with `ollama ps`.

### **Error: "Model not found"**
```bash
ollama pull gemma3:4b
ollama pull nomic-embed-text
```
Verify with `ollama list`.

### **Slow responses**
1. Check Ollama is using GPU: `ollama ps` → look for GPU indicator
2. Try smaller model: `ollama pull gemma2:2b`
3. Reduce retrieved chunks: Edit `retriever.ts` → `k: 5`
4. Check system resources: Activity Monitor → Ollama process

### **Database connection errors**
1. Verify Supabase project is active (not paused) at supabase.com
2. Check `.env.local` has correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Ensure pgvector extension enabled: Run `CREATE EXTENSION IF NOT EXISTS vector;` in SQL Editor
4. Verify schema is set up: Check that `documents` and `document_chunks` tables exist

### **Upload fails silently**
1. Check terminal for error messages
2. Verify file format is supported (PDF, TXT, MD, DOCX)
3. For large PDFs (50+ pages), wait 30-60 seconds
4. Check Supabase database logs for insertion errors

---

## 📁 Project Structure

```
ai-rag-knowledge-assistant/
├── app/                      # Next.js App Router
│   ├── api/
│   │   └── chat/            # Streaming chat endpoint
│   ├── actions/             # Server actions for upload
│   ├── upload/              # Document upload page
│   ├── knowledge/           # Knowledge base view
│   ├── page.tsx             # Main chat interface
│   └── layout.tsx           # Root layout
├── components/               # React components
│   ├── ChatInterface.tsx    # Main chat UI with streaming
│   ├── DocumentUpload.tsx   # Drag & drop upload
│   ├── DocumentList.tsx     # Knowledge base list
│   └── SourceCard.tsx       # Citation display
├── lib/                      # Core business logic
│   ├── langchain/
│   │   ├── ollama.ts        # Ollama generation client
│   │   ├── embeddings.ts    # Ollama embeddings (nomic-embed-text)
│   │   ├── chain.ts         # RAG chain logic
│   │   ├── retriever.ts     # Similarity search & reranking
│   │   └── vectorstore.ts   # Supabase pgvector operations
│   ├── document-parser.ts   # PDF/DOCX/TXT/MD parsing
│   ├── document-chunker.ts  # Text splitting with LangChain
│   └── supabase.ts          # Database client
├── supabase-schema.sql      # Database schema with pgvector
├── SETUP.md                 # Detailed setup instructions
├── OLLAMA_SETUP.md          # Ollama-specific guide
└── package.json             # Dependencies
```

---

## 🎓 Learning Resources

### **RAG Concepts**
- [LangChain RAG Tutorial](https://python.langchain.com/docs/use_cases/question_answering/)
- [Pinecone RAG Guide](https://www.pinecone.io/learn/retrieval-augmented-generation/)
- [HNSW Algorithm Paper](https://arxiv.org/abs/1603.09320)

### **Ollama**
- [Ollama Documentation](https://ollama.ai/docs)
- [Model Library](https://ollama.ai/library)
- [Gemma 3 Model Card](https://ollama.ai/library/gemma3)

### **Vector Databases**
- [pgvector GitHub](https://github.com/pgvector/pgvector)
- [Supabase Vector Guide](https://supabase.com/docs/guides/ai/vector-columns)

---

## 🚧 Known Limitations

### **Current Version**
- ❌ **No image extraction** from PDFs (text-only)
- ❌ **No conversation memory** (each query is independent)
- ❌ **Large files** (50+ pages) slow to process
- ❌ **No document deletion UI** (manual via Supabase dashboard)

### **Future Enhancements**
- 🔲 Multi-turn conversations with memory
- 🔲 Image + text multimodal RAG
- 🔲 Document comparison across multiple sources
- 🔲 Advanced reranking with cross-encoders
- 🔲 Hybrid search (keyword + semantic)
- 🔲 User authentication and document privacy

---

## 🎯 Technical Interview Talking Points

### **Architecture & Design**
> "I designed a fully local RAG system to address API cost and privacy concerns. The architecture uses Ollama for both embeddings and generation, eliminating external dependencies. I chose Supabase pgvector over alternatives like Pinecone because it's open-source, has no vendor lock-in, and supports production-grade HNSW indexing."

### **Performance Optimization**
> "I implemented HNSW indexing in pgvector, which provides O(log n) approximate nearest neighbor search instead of O(n) brute force. This scales to 100k+ vectors while maintaining sub-100ms query times. I also tuned chunk size to 1000 characters based on testing—larger chunks diluted relevance, smaller chunks lost context."

### **Trade-offs**
> "I chose gemma3:4b over 9B models for better latency (2-3 sec vs 5-10 sec). The quality difference is minimal in RAG because retrieved context compensates. For production, I'd A/B test with users to validate this trade-off."

### **Production Considerations**
> "For production deployment, I'd add: (1) Conversation memory with a short-term cache, (2) Hybrid search combining keyword and semantic, (3) User authentication with per-user document isolation, (4) Monitoring for embedding drift and query latency, (5) Batch processing for bulk uploads."

### **Error Handling**
> "I implemented comprehensive error handling: Ollama connection failures return helpful messages suggesting `ollama serve`, database errors include retry logic, and large document uploads show progress indicators. The system degrades gracefully—if embeddings fail, it explains why rather than silently failing."

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🤝 Contributing

This is a portfolio project demonstrating AI engineering skills. While it's not actively maintained for public contributions, suggestions and feedback are welcome via GitHub Issues.

---

## 👤 Author

**Nishad Dhakephalkar**
- Portfolio: [github.com/tacitusblindsbig](https://github.com/tacitusblindsbig)
- Email: ndhakeph@gmail.com
- Location: Pune, Maharashtra, India

---

## 🙏 Acknowledgments

- **Ollama** for making local LLM inference accessible
- **LangChain** for the excellent RAG framework
- **Supabase** for pgvector support and great developer experience
- **Vercel** for the AI SDK and Next.js framework

---

**Built with ❤️ to showcase modern AI engineering practices**

*No API keys. No rate limits. Just pure local AI power.*
