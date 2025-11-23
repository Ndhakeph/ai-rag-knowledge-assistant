import { supabase } from '@/lib/supabase'
import { embedText } from './embeddings'
import type { Document } from '@langchain/core/documents'

/**
 * Add documents to the vector store
 */
export async function addDocumentsToVectorStore(
  documentId: string,
  chunks: string[],
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    // Import embeddings here to avoid circular dependencies
    const { embedTexts } = await import('./embeddings')

    // Generate embeddings for all chunks
    const embeddings = await embedTexts(chunks)

    // Prepare chunk records
    const chunkRecords = chunks.map((content, index) => ({
      document_id: documentId,
      content,
      embedding: embeddings[index],
      chunk_index: index,
      metadata,
    }))

    // Insert chunks into database in batches (to avoid payload limits)
    const batchSize = 50
    for (let i = 0; i < chunkRecords.length; i += batchSize) {
      const batch = chunkRecords.slice(i, i + batchSize)
      const { error } = await supabase
        .from('document_chunks')
        .insert(batch)

      if (error) {
        throw new Error(`Failed to insert chunks: ${error.message}`)
      }
    }

    console.log(`Successfully added ${chunks.length} chunks for document ${documentId}`)
  } catch (error) {
    console.error('Error adding documents to vector store:', error)
    throw error
  }
}

/**
 * Similarity search in the vector store
 */
export async function similaritySearch(
  query: string,
  k: number = 10,
  filter: Record<string, any> = {}
): Promise<Document[]> {
  try {
    // Generate embedding for query
    const queryEmbedding = await embedText(query)

    // Use the match_documents function for similarity search
    const { data, error } = await supabase
      .rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: k,
        filter: filter,
      })

    if (error) {
      throw new Error(`Similarity search failed: ${error.message}`)
    }

    // Convert to LangChain Document format
    const documents: Document[] = (data || []).map((item: any) => ({
      pageContent: item.content,
      metadata: {
        id: item.id,
        documentId: item.document_id,
        chunkIndex: item.chunk_index,
        similarity: item.similarity,
        ...item.metadata,
      },
    }))

    return documents
  } catch (error) {
    console.error('Error performing similarity search:', error)
    throw error
  }
}

/**
 * Get all chunks for a specific document
 */
export async function getDocumentChunks(documentId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('document_chunks')
      .select('content, chunk_index')
      .eq('document_id', documentId)
      .order('chunk_index', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch chunks: ${error.message}`)
    }

    return (data || []).map((chunk) => chunk.content)
  } catch (error) {
    console.error('Error getting document chunks:', error)
    throw error
  }
}

/**
 * Delete all chunks for a document
 */
export async function deleteDocumentChunks(documentId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('document_chunks')
      .delete()
      .eq('document_id', documentId)

    if (error) {
      throw new Error(`Failed to delete chunks: ${error.message}`)
    }

    console.log(`Successfully deleted chunks for document ${documentId}`)
  } catch (error) {
    console.error('Error deleting document chunks:', error)
    throw error
  }
}

/**
 * Get total number of chunks in the vector store
 */
export async function getTotalChunkCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('document_chunks')
      .select('*', { count: 'exact', head: true })

    if (error) {
      throw new Error(`Failed to count chunks: ${error.message}`)
    }

    return count || 0
  } catch (error) {
    console.error('Error counting chunks:', error)
    return 0
  }
}
