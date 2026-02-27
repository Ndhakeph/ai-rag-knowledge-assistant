# RAG Knowledge Assistant

A local document Q&A system using retrieval-augmented generation. Upload documents, ask questions, get answers with source citations—all running on your machine.

## Why I Built This

I wanted to understand how RAG systems actually work, not just call an API and hope for the best. By running everything locally with Ollama, I could see exactly what happens at each stage: how documents get chunked, how embeddings capture meaning, how similarity search finds relevant context, and how the LLM uses that context to generate answers. No API keys, no rate limits, no costs per query.

## How It Works

```
Document Ingestion:
PDF/TXT/MD/DOCX → Parse → Chunk (1000 chars, 200 overlap) → Embed → Store in pgvector

Query Flow:
User Question → Embed → Vector Search (HNSW) → Rerank → Generate Response → Stream to UI
```

The retrieval pipeline has three stages:
1. **Initial retrieval**: Fetch top 10 chunks by cosine similarity
2. **Reranking**: Score chunks by combining vector similarity (50%), keyword overlap (25%), document position (15%), and recency (10%)
3. **Generation**: Pass top 5 chunks as context to the LLM, stream the response

## Tech Stack

- **Next.js 14** with App Router and TypeScript
- **LangChain.js** for document processing and RAG orchestration
- **Ollama** for local inference (gemma3:4b for generation, nomic-embed-text for embeddings)
- **Supabase** with pgvector extension and HNSW indexing
- **Tailwind CSS** for styling

## Getting Started

### Prerequisites

Install Ollama and pull the models (~3.5 GB total):

```bash
# Mac
brew install ollama

# Pull models
ollama pull gemma3:4b
ollama pull nomic-embed-text

# Start Ollama (keep this running)
ollama serve
```

### Setup

```bash
git clone https://github.com/tacitusblindsbig/ai-rag-knowledge-assistant
cd ai-rag-knowledge-assistant
npm install

cp .env.example .env.local
# Add your Supabase URL and anon key to .env.local

npm run dev
```

### Database

1. Create a free Supabase project at [supabase.com](https://supabase.com)
2. Open the SQL Editor and run the contents of `supabase-schema.sql`
3. Copy your project URL and anon key to `.env.local`

Then open [localhost:3000](http://localhost:3000).

## What I Learned

The most interesting part was implementing the reranking stage. Pure vector similarity misses a lot—a chunk might be semantically similar but come from the middle of a document where context is assumed from earlier sections. Adding position weighting and keyword overlap as signals made retrieval noticeably better. I also learned that chunk size is a real tradeoff: smaller chunks give better precision but lose context, larger chunks preserve context but dilute relevance. 1000 characters with 200-char overlap was a reasonable middle ground for Q&A.

If I were to extend this, I'd add hybrid search (combining BM25 keyword search with vector search) and conversation memory so follow-up questions work naturally.

## License

MIT
