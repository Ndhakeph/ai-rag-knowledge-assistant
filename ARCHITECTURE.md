# Architecture Deep Dive

## 🏛️ System Architecture

This document provides a detailed technical overview of the RAG Knowledge Assistant architecture.

## Core Components

### 1. Frontend Layer (Next.js 14 App Router)

#### Pages
- **`/` (Home)**: Main chat interface with streaming responses
- **`/upload`**: Document upload with stats dashboard
- **`/knowledge`**: Document management and search

#### Components
- **ChatInterface**: Uses Vercel AI SDK's `useChat` hook for streaming
- **DocumentUpload**: React Dropzone for drag-drop functionality
- **DocumentList**: Displays documents with delete functionality
- **SourceCard**: Shows retrieved chunks with relevance scores

### 2. Backend Layer (Server Actions & API Routes)

#### Server Actions (`app/actions/`)
- **`ingest.ts`**: Handles document upload, parsing, chunking, embedding
- **`query.ts`**: Processes RAG queries (non-streaming)

#### API Routes (`app/api/`)
- **`/api/chat`**: Streaming chat endpoint using Edge runtime

### 3. RAG Pipeline (`lib/langchain/`)

#### Embeddings (`embeddings.ts`)
```typescript
Model: text-embedding-004 (Google)
Dimension: 768
Use case: Semantic search, document retrieval
```

#### Vector Store (`vectorstore.ts`)
```typescript
Database: Supabase PostgreSQL with pgvector
Index: HNSW (Hierarchical Navigable Small World)
Distance metric: Cosine similarity
```

#### Retriever (`retriever.ts`)
```typescript
Stage 1: Vector Similarity Search (k=10)
  ↓
Stage 2: Multi-factor Reranking
  • Vector similarity: 50%
  • Keyword overlap: 25%
  • Position in document: 15%
  • Recency: 10%
  ↓
Stage 3: Metadata Enrichment
  ↓
Output: Top 5 most relevant chunks
```

#### RAG Chain (`chain.ts`)
```typescript
Model: gemini-2.0-flash-exp
Temperature: 0.3
Max tokens: 2048
Streaming: Enabled
Prompt: Custom RAG template with source attribution
```

### 4. Database Layer (Supabase PostgreSQL)

#### Schema Design

**documents table**
```sql
id UUID PRIMARY KEY
name TEXT
content TEXT (full document)
file_type TEXT (pdf|txt|md|docx)
file_size INTEGER
upload_date TIMESTAMPTZ
chunk_count INTEGER
metadata JSONB
```

**document_chunks table**
```sql
id UUID PRIMARY KEY
document_id UUID (FK → documents.id)
content TEXT (chunk text)
embedding vector(768) (Gemini embedding)
chunk_index INTEGER (position in document)
metadata JSONB
created_at TIMESTAMPTZ
```

**Indexes**
```sql
-- Fast vector similarity search
CREATE INDEX USING hnsw (embedding vector_cosine_ops)

-- Fast filtering by document
CREATE INDEX ON (document_id)

-- Recency queries
CREATE INDEX ON (created_at DESC)

-- JSONB metadata queries
CREATE INDEX USING GIN (metadata)
```

## Data Flow

### Document Ingestion Flow

```
User uploads file
    ↓
FormData sent to ingestDocument() Server Action
    ↓
File validation (type, size)
    ↓
Document parsing (pdf-parse, mammoth)
    ↓
Text chunking (RecursiveCharacterTextSplitter)
    • 1000 character chunks
    • 200 character overlap
    ↓
Store document metadata in 'documents' table
    ↓
Generate embeddings for all chunks (Gemini API)
    • Batch processing (50 chunks at a time)
    ↓
Store chunks + embeddings in 'document_chunks' table
    ↓
Trigger updates chunk_count in 'documents' table
    ↓
Return success with document ID + chunk count
```

### Query Processing Flow

```
User submits question
    ↓
/api/chat receives message
    ↓
Generate query embedding (Gemini)
    ↓
Vector similarity search (pgvector)
    • Use match_documents() function
    • Returns top 10 chunks with similarity scores
    ↓
Reranking algorithm
    • Calculate keyword overlap
    • Apply position scoring
    • Apply recency scoring
    • Compute weighted final score
    • Select top 5 chunks
    ↓
Enrich with document metadata
    • Fetch document names
    • Add file types
    ↓
Format context for LLM
    ↓
Invoke RAG chain (Gemini 2.0 Flash)
    • Streaming enabled
    • Custom prompt template
    ↓
Stream response chunks to client
    ↓
Display with source citations
```

## Technical Decisions

### Why LangChain.js?

✅ **Pros:**
- Industry standard abstraction layer
- Rich ecosystem of integrations
- Handles complex orchestration
- Built-in retry logic and error handling
- Future-proof (easy to swap LLM providers)

❌ **Alternatives considered:**
- Direct API calls: Too low-level, error-prone
- Llamaindex.ts: Smaller community, fewer integrations

### Why Supabase pgvector?

✅ **Pros:**
- PostgreSQL-based (ACID, transactions, FK constraints)
- 10x cheaper than dedicated vector DBs
- Single database for all data
- Excellent performance with HNSW indexing
- Built-in RLS for security
- Free tier is generous

❌ **Alternatives considered:**
- Pinecone: Expensive, vendor lock-in
- Weaviate: Complex setup, overkill for this use case
- Qdrant: Good but another service to manage

### Why Google Gemini?

✅ **Pros:**
- **text-embedding-004**: State-of-the-art embeddings
- **gemini-2.0-flash**: Fast and cost-effective
- Native streaming support
- Generous free tier
- Excellent performance on RAG tasks

❌ **Alternatives considered:**
- OpenAI: More expensive, rate limits
- Anthropic Claude: No embedding model
- Local models: Too slow for production

### Why Next.js 14 App Router?

✅ **Pros:**
- Server Actions eliminate API boilerplate
- React Server Components for better performance
- Edge runtime support
- Streaming built-in
- Best-in-class DX

## Performance Optimizations

### 1. Embedding Generation
- Batch processing (50 chunks at a time)
- Parallel API calls where possible
- Error handling with retries

### 2. Vector Search
- HNSW indexing for O(log n) search
- Configurable ef_search parameter
- Index-only scans where possible

### 3. Reranking
- Done in-memory (post-retrieval)
- Minimal computational overhead
- Leverages pre-computed similarity scores

### 4. Streaming
- Edge runtime for low latency
- Chunk-by-chunk response streaming
- No waiting for full completion

### 5. Database
- Connection pooling via Supabase
- Prepared statements
- Batch inserts for chunks
- Cascade deletes on FK

## Security Considerations

### Current State (MVP)
- ⚠️ Public access (RLS policies set to `true`)
- ⚠️ No authentication
- ⚠️ No rate limiting

### Production Recommendations

1. **Authentication**
```typescript
// Add NextAuth.js or Supabase Auth
// Update RLS policies to filter by user_id
```

2. **Rate Limiting**
```typescript
// Use Upstash Redis for rate limiting
// Limit uploads per hour
// Limit queries per minute
```

3. **Input Validation**
```typescript
// Validate file types on server
// Scan for malware
// Limit file sizes
// Sanitize text content
```

4. **API Key Management**
```typescript
// Rotate keys regularly
// Use different keys per environment
// Monitor usage quotas
```

## Scaling Strategies

### Vertical Scaling (Single Instance)
- ✅ Handles 100s of concurrent users
- ✅ Supabase connection pooling
- ✅ Edge functions for low latency

### Horizontal Scaling (Multiple Instances)
- ✅ Stateless architecture (no sessions)
- ✅ Database handles concurrency
- ✅ CDN for static assets

### Database Scaling
- Upgrade Supabase plan for more connections
- Add read replicas for queries
- Partition tables by date if needed
- Implement caching layer (Redis)

### Cost Optimization
- Cache frequent queries
- Batch embedding generation
- Use smaller models for classification
- Implement query deduplication

## Monitoring & Observability

### Recommended Tools

1. **Error Tracking**: Sentry
2. **Logging**: Axiom, Logtail
3. **Performance**: Vercel Analytics
4. **LLM Tracing**: LangSmith
5. **Database**: Supabase built-in metrics

### Key Metrics to Track

- Query latency (p50, p95, p99)
- Embedding generation time
- Retrieval accuracy
- LLM token usage
- Database query performance
- Error rates by endpoint
- User engagement (queries per session)

## Future Enhancements

### Short-term (1-2 weeks)
- [ ] Conversation memory
- [ ] Multi-query retrieval
- [ ] Better error messages
- [ ] Loading skeletons

### Medium-term (1 month)
- [ ] Hybrid search (vector + keyword)
- [ ] Document summarization
- [ ] User authentication
- [ ] Export conversations

### Long-term (3 months)
- [ ] Multilingual support
- [ ] OCR for scanned PDFs
- [ ] Team collaboration features
- [ ] Custom model fine-tuning
- [ ] Analytics dashboard

## Testing Strategy

### Unit Tests
- Document parser functions
- Chunking algorithm
- Reranking scoring
- Utility functions

### Integration Tests
- End-to-end upload flow
- Query processing pipeline
- Database operations
- API endpoints

### E2E Tests
- User upload journey
- Chat interaction flow
- Document management

## Deployment

### Vercel (Recommended)

```bash
# Push to GitHub
git push origin main

# In Vercel dashboard:
# 1. Import repository
# 2. Add environment variables
# 3. Deploy
```

### Environment Variables (Production)
```env
GOOGLE_API_KEY=<production-key>
NEXT_PUBLIC_SUPABASE_URL=<prod-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<prod-key>
```

### Database Migrations
```sql
-- Always test schema changes in staging first
-- Use Supabase migrations for version control
-- Enable backups before major changes
```

## Contributing

See main README for contribution guidelines.

## License

MIT - See LICENSE file for details.
