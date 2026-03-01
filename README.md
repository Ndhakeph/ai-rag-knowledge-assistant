# RAG Knowledge Assistant

A local document Q&A system with multi-stage retrieval and hybrid reranking.

## Why I Built This

Most RAG tutorials stop at "embed documents, do cosine similarity, pass to LLM." But pure vector similarity misses a lot—semantically similar chunks might come from the middle of a document where context is assumed, or match thematically without actually answering the question. I wanted to understand what makes retrieval *good*, so I built a system where I could experiment with different reranking strategies and measure their impact on answer quality. Running everything locally with Ollama meant I could iterate without API costs or rate limits.

## How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DOCUMENT INGESTION                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   PDF/TXT/MD/DOCX                                                           │
│         │                                                                   │
│         ▼                                                                   │
│   ┌─────────────┐    ┌─────────────────────┐    ┌───────────────────────┐  │
│   │   Parse     │───▶│  Chunk (1000 chars, │───▶│  Embed with Ollama    │  │
│   │   Document  │    │  200 overlap)       │    │  (nomic-embed-text)   │  │
│   └─────────────┘    └─────────────────────┘    └───────────────────────┘  │
│                                                           │                 │
│                                                           ▼                 │
│                                              ┌─────────────────────────┐   │
│                                              │  Store in Supabase      │   │
│                                              │  pgvector (HNSW index)  │   │
│                                              └─────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              QUERY PIPELINE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   User Question                                                             │
│         │                                                                   │
│         ▼                                                                   │
│   ┌─────────────┐    ┌─────────────────────┐    ┌───────────────────────┐  │
│   │   Embed     │───▶│  Vector Search      │───▶│  Hybrid Reranking     │  │
│   │   Query     │    │  (top 10, HNSW)     │    │  (weighted scoring)   │  │
│   └─────────────┘    └─────────────────────┘    └───────────────────────┘  │
│                                                           │                 │
│                                                           ▼                 │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                      RERANKING FORMULA                              │  │
│   │                                                                     │  │
│   │   final_score = 0.50 × vector_similarity                           │  │
│   │                + 0.25 × keyword_overlap                             │  │
│   │                + 0.15 × position_score                              │  │
│   │                + 0.10 × recency_score                               │  │
│   │                                                                     │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                           │                 │
│                                                           ▼                 │
│                                              ┌─────────────────────────┐   │
│                                              │  Generate + Stream      │   │
│                                              │  Response (gemma3:4b)   │   │
│                                              └─────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

The retrieval pipeline runs in three stages:

1. **Initial retrieval**: Fetch top 10 chunks by cosine similarity using HNSW index
2. **Hybrid reranking**: Score each chunk with weighted combination of four signals
3. **Generation**: Pass top 5 reranked chunks as context, stream the response

## Key Technical Decisions

- **Hybrid reranking weights (50/25/15/10)**: Vector similarity alone misses keyword matches that humans expect. If a user asks about "authentication," chunks containing that exact word should rank higher even if the embedding thinks "security" is equally relevant. Position weighting gives a small boost to introductions where terms get defined. Recency helps when documents are updated over time.

- **Chunking at 1000 chars with 200-char overlap**: Smaller chunks (500) gave better precision but lost context for multi-sentence answers. Larger chunks (2000) diluted relevance scores. The overlap ensures we don't split mid-paragraph and lose semantic continuity at boundaries.

- **HNSW over IVFFlat**: HNSW has better recall at the same latency. With `m=16` and `ef_construction=64`, I get sub-10ms search times on thousands of chunks while maintaining >95% recall compared to exact search.

## Tech Stack

- **Next.js 14** — App Router, Server Actions, streaming responses
- **TypeScript** — End-to-end type safety
- **LangChain.js** — Document parsing and text splitting
- **Ollama** — Local inference (gemma3:4b for generation, nomic-embed-text for embeddings)
- **Supabase** — Postgres with pgvector extension, HNSW indexing
- **Tailwind CSS** — Utility-first styling with custom glass morphism effects

## Getting Started

### Prerequisites

```bash
# Install Ollama
brew install ollama

# Pull required models (~3.5 GB total)
ollama pull gemma3:4b
ollama pull nomic-embed-text

# Start Ollama server (keep running in background)
ollama serve
```

### Setup

```bash
git clone https://github.com/yourusername/ai-rag-knowledge-assistant
cd ai-rag-knowledge-assistant
npm install

cp .env.example .env.local
# Add your Supabase credentials to .env.local
```

### Database

1. Create a free project at [supabase.com](https://supabase.com)
2. Open SQL Editor and run `supabase-schema.sql`
3. Copy your project URL and anon key to `.env.local`

```bash
npm run dev
# Open http://localhost:3000
```

## Project Structure

```
├── app/
│   ├── api/
│   │   └── chat/route.ts          # Streaming endpoint (Vercel AI SDK format)
│   ├── actions/
│   │   ├── ingest.ts              # Document upload + processing
│   │   └── query.ts               # RAG query orchestration
│   ├── page.tsx                   # Chat interface
│   ├── upload/page.tsx            # Document upload UI
│   └── knowledge/page.tsx         # Document management
│
├── components/
│   ├── ChatInterface.tsx          # Real-time chat with useChat hook
│   ├── DocumentUpload.tsx         # Drag-and-drop with react-dropzone
│   ├── DocumentList.tsx           # Document management grid
│   └── SourceCard.tsx             # Citation display with relevance scores
│
├── lib/
│   ├── langchain/
│   │   ├── retriever.ts           # Multi-stage retrieval + reranking logic
│   │   ├── chain.ts               # RAG chain orchestration
│   │   ├── vectorstore.ts         # Supabase pgvector operations
│   │   ├── embeddings.ts          # Ollama embedding generation
│   │   └── ollama.ts              # LLM client + prompt templates
│   ├── document-chunker.ts        # RecursiveCharacterTextSplitter config
│   ├── document-parser.ts         # PDF/DOCX/MD/TXT parsing
│   └── supabase.ts                # Database client + types
│
└── supabase-schema.sql            # Full database schema with RLS
```

## What I Learned

The core insight from this project is that retrieval quality matters more than model quality for RAG. A mediocre retriever feeding a great LLM produces worse answers than a great retriever feeding a mediocre LLM—the model can only work with the context it receives.

The reranking implementation in `lib/langchain/retriever.ts` was the most iterative part. I started with pure cosine similarity and manually checked whether the top 5 chunks actually contained the answer. They often didn't—chunks would match thematically but miss the specific information needed. Adding keyword overlap as a signal made an immediate difference: exact term matches matter, even if embeddings think synonyms are equivalent. Position weighting was more subtle; I noticed document introductions often define terms that later sections assume, so first chunks deserved a boost.

The streaming implementation required matching Vercel AI SDK's wire format (`0:"chunk"\n`) exactly for the `useChat` hook to parse responses correctly. This wasn't documented anywhere obvious—I traced through the SDK source to figure it out.

## License

MIT
