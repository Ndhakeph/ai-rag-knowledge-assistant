'use server'

/**
 * Server Actions for RAG queries
 * Handles question answering with retrieval and citations
 */

import { getRelevantDocuments } from '@/lib/langchain/retriever'
import { invokeRAGChain } from '@/lib/langchain/chain'

export interface QueryResult {
  success: boolean
  answer?: string
  sources?: SourceInfo[]
  error?: string
}

export interface SourceInfo {
  documentId: string
  documentName: string
  chunkIndex: number
  content: string
  similarity: number
}

/**
 * Query the RAG system
 * Steps:
 * 1. Retrieve relevant documents
 * 2. Generate answer using RAG chain
 * 3. Format sources for citation
 */
export async function queryKnowledgeBase(question: string): Promise<QueryResult> {
  try {
    if (!question || question.trim().length === 0) {
      return { success: false, error: 'Question cannot be empty' }
    }

    console.log(`Processing query: ${question}`)

    // Step 1: Retrieve relevant documents
    console.log('Retrieving relevant documents...')
    const documents = await getRelevantDocuments(question, {
      k: 10,           // Retrieve top 10 initially
      rerankTopK: 5,   // Keep top 5 after reranking
      includeMetadata: true,
    })

    if (documents.length === 0) {
      return {
        success: true,
        answer: "I couldn't find any relevant information in the knowledge base to answer your question. Please try rephrasing your question or upload relevant documents.",
        sources: [],
      }
    }

    console.log(`Retrieved ${documents.length} relevant documents`)

    // Step 2: Generate answer using RAG chain
    console.log('Generating answer...')
    const answer = await invokeRAGChain(question, documents)

    // Step 3: Format sources
    const sources: SourceInfo[] = documents.map(doc => ({
      documentId: doc.metadata.documentId || 'unknown',
      documentName: doc.metadata.documentName || 'Unknown Document',
      chunkIndex: doc.metadata.chunkIndex || 0,
      content: doc.pageContent,
      similarity: doc.metadata.similarity || 0,
    }))

    return {
      success: true,
      answer,
      sources,
    }
  } catch (error) {
    console.error('Error querying knowledge base:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Get related questions based on current query
 * Useful for "suggested questions" feature
 */
export async function getRelatedQuestions(question: string): Promise<string[]> {
  // This is a simple implementation
  // In production, you might use LLM to generate better suggestions
  const suggestions = [
    `Can you elaborate on ${question.toLowerCase()}?`,
    `What are the key points about ${question.toLowerCase()}?`,
    `Are there any examples related to ${question.toLowerCase()}?`,
  ]

  return suggestions
}
