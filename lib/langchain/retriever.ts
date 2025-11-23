import { Document } from '@langchain/core/documents'
import { similaritySearch } from './vectorstore'
import { supabase } from '@/lib/supabase'

/**
 * Multi-stage retrieval with reranking
 *
 * Stage 1: Initial retrieval (k=10) using vector similarity
 * Stage 2: Reranking based on multiple factors
 * Stage 3: Context assembly with metadata
 */

interface RetrievalOptions {
  k?: number
  rerankTopK?: number
  includeMetadata?: boolean
}

/**
 * Calculate keyword overlap score between query and document
 */
function calculateKeywordOverlap(query: string, text: string): number {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const textWords = new Set(text.toLowerCase().split(/\s+/))

  if (queryWords.length === 0) return 0

  const matches = queryWords.filter(word => textWords.has(word)).length
  return matches / queryWords.length
}

/**
 * Calculate recency score (newer documents score higher)
 */
function calculateRecencyScore(createdAt: string): number {
  const now = Date.now()
  const created = new Date(createdAt).getTime()
  const ageInDays = (now - created) / (1000 * 60 * 60 * 24)

  // Exponential decay: score decreases as document ages
  // Documents lose ~50% score every 30 days
  return Math.exp(-ageInDays / 30)
}

/**
 * Calculate position score (earlier chunks score higher)
 */
function calculatePositionScore(chunkIndex: number, totalChunks: number = 100): number {
  // Earlier chunks (like introductions) often contain key information
  // Score ranges from 1.0 (first chunk) to 0.5 (last chunk)
  return 1.0 - (chunkIndex / totalChunks) * 0.5
}

/**
 * Rerank documents based on multiple factors
 */
function rerankDocuments(documents: Document[], query: string): Document[] {
  const scored = documents.map(doc => {
    const keywordScore = calculateKeywordOverlap(query, doc.pageContent)
    const positionScore = calculatePositionScore(doc.metadata.chunkIndex || 0)
    const recencyScore = calculateRecencyScore(doc.metadata.created_at || new Date().toISOString())
    const similarityScore = doc.metadata.similarity || 0

    // Weighted combination of scores
    const finalScore =
      similarityScore * 0.5 +    // 50% vector similarity
      keywordScore * 0.25 +       // 25% keyword overlap
      positionScore * 0.15 +      // 15% position in document
      recencyScore * 0.10         // 10% recency

    return {
      document: doc,
      score: finalScore,
    }
  })

  // Sort by final score (highest first)
  scored.sort((a, b) => b.score - a.score)

  return scored.map(item => {
    // Add final score to metadata for debugging
    item.document.metadata.finalScore = item.score
    return item.document
  })
}

/**
 * Enrich documents with additional metadata (document name, etc.)
 */
async function enrichDocumentsWithMetadata(documents: Document[]): Promise<Document[]> {
  // Get unique document IDs
  const documentIds = [...new Set(documents.map(doc => doc.metadata.documentId))]

  // Fetch document metadata from database
  const { data: docMetadata, error } = await supabase
    .from('documents')
    .select('id, name, file_type, upload_date')
    .in('id', documentIds)

  if (error) {
    console.error('Error fetching document metadata:', error)
    return documents
  }

  // Create lookup map
  const metadataMap = new Map(
    (docMetadata || []).map(doc => [doc.id, doc])
  )

  // Enrich documents with metadata
  return documents.map(doc => {
    const meta = metadataMap.get(doc.metadata.documentId)
    if (meta) {
      doc.metadata.documentName = meta.name
      doc.metadata.fileType = meta.file_type
      doc.metadata.uploadDate = meta.upload_date
    }
    return doc
  })
}

/**
 * Main retrieval function with multi-stage processing
 */
export async function getRelevantDocuments(
  query: string,
  options: RetrievalOptions = {}
): Promise<Document[]> {
  const {
    k = 10,
    rerankTopK = 5,
    includeMetadata = true,
  } = options

  try {
    // Stage 1: Initial retrieval using vector similarity
    console.log(`Stage 1: Retrieving top ${k} documents...`)
    let documents = await similaritySearch(query, k)

    if (documents.length === 0) {
      console.log('No relevant documents found')
      return []
    }

    console.log(`Retrieved ${documents.length} documents`)

    // Stage 2: Reranking
    console.log('Stage 2: Reranking documents...')
    documents = rerankDocuments(documents, query)

    // Take top K after reranking
    documents = documents.slice(0, rerankTopK)
    console.log(`After reranking: ${documents.length} documents`)

    // Stage 3: Enrich with metadata
    if (includeMetadata) {
      console.log('Stage 3: Enriching with metadata...')
      documents = await enrichDocumentsWithMetadata(documents)
    }

    return documents
  } catch (error) {
    console.error('Error in retrieval pipeline:', error)
    throw error
  }
}

/**
 * Format retrieved documents for context in RAG chain
 */
export function formatDocumentsForContext(documents: Document[]): string {
  if (documents.length === 0) {
    return 'No relevant documents found.'
  }

  return documents
    .map((doc, index) => {
      const docName = doc.metadata.documentName || 'Unknown Document'
      const chunkIndex = doc.metadata.chunkIndex ?? 'N/A'
      const score = doc.metadata.finalScore?.toFixed(3) || 'N/A'

      return `--- Document ${index + 1} ---
Source: ${docName} (Chunk ${chunkIndex})
Relevance Score: ${score}

${doc.pageContent}
`
    })
    .join('\n\n')
}

/**
 * Group documents by source document for citation
 */
export function groupDocumentsBySource(documents: Document[]): Map<string, Document[]> {
  const grouped = new Map<string, Document[]>()

  for (const doc of documents) {
    const docId = doc.metadata.documentId
    if (!grouped.has(docId)) {
      grouped.set(docId, [])
    }
    grouped.get(docId)!.push(doc)
  }

  return grouped
}
