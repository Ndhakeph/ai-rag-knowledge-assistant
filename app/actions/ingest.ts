'use server'

/**
 * Server Actions for document ingestion
 * Handles file upload, parsing, chunking, embedding, and storage
 */

import { supabase } from '@/lib/supabase'
import { parseDocument } from '@/lib/document-parser'
import { chunkDocument, getChunkingStats } from '@/lib/document-chunker'
import { addDocumentsToVectorStore } from '@/lib/langchain/vectorstore'

export interface IngestResult {
  success: boolean
  documentId?: string
  documentName?: string
  chunkCount?: number
  error?: string
}

/**
 * Ingest a document into the RAG system
 * Steps:
 * 1. Parse document text
 * 2. Chunk into smaller pieces
 * 3. Generate embeddings
 * 4. Store in database
 */
export async function ingestDocument(formData: FormData): Promise<IngestResult> {
  try {
    const file = formData.get('file') as File

    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|txt|md|docx)$/i)) {
      return { success: false, error: 'Invalid file type. Supported: PDF, TXT, MD, DOCX' }
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return { success: false, error: 'File too large. Maximum size: 10MB' }
    }

    console.log(`Processing file: ${file.name} (${file.size} bytes)`)

    // Step 1: Parse document
    console.log('Parsing document...')
    const text = await parseDocument(file)

    if (!text || text.trim().length === 0) {
      return { success: false, error: 'Could not extract text from document' }
    }

    console.log(`Extracted ${text.length} characters`)

    // Step 2: Chunk document
    console.log('Chunking document...')
    const chunks = await chunkDocument(text, {
      chunkSize: 1000,
      chunkOverlap: 200,
    })

    if (chunks.length === 0) {
      return { success: false, error: 'Failed to chunk document' }
    }

    const stats = getChunkingStats(chunks)
    console.log('Chunking stats:', stats)

    // Step 3: Store document metadata in database
    console.log('Storing document metadata...')
    const fileType = file.name.split('.').pop()?.toLowerCase() || 'unknown'

    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert({
        name: file.name,
        content: text,
        file_type: fileType,
        file_size: file.size,
        chunk_count: 0, // Will be updated by trigger
        metadata: {
          originalSize: file.size,
          chunkingStats: stats,
        },
      })
      .select()
      .single()

    if (docError) {
      console.error('Database error:', docError)
      return { success: false, error: `Database error: ${docError.message}` }
    }

    const documentId = docData.id
    console.log(`Document stored with ID: ${documentId}`)

    // Step 4: Generate embeddings and store chunks
    console.log('Generating embeddings and storing chunks...')
    try {
      await addDocumentsToVectorStore(documentId, chunks, {
        fileName: file.name,
        fileType: fileType,
        uploadDate: new Date().toISOString(),
      })
    } catch (embeddingError) {
      // Rollback: delete the document if embedding fails
      console.error('Embedding error:', embeddingError)
      await supabase.from('documents').delete().eq('id', documentId)
      return {
        success: false,
        error: 'Failed to generate embeddings. Please try again.'
      }
    }

    console.log(`Successfully ingested document: ${file.name}`)

    return {
      success: true,
      documentId,
      documentName: file.name,
      chunkCount: chunks.length,
    }
  } catch (error) {
    console.error('Error ingesting document:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Get all documents
 */
export async function getDocuments() {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('upload_date', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch documents: ${error.message}`)
    }

    return { success: true, documents: data || [] }
  } catch (error) {
    console.error('Error fetching documents:', error)
    return {
      success: false,
      documents: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Delete a document and its chunks
 */
export async function deleteDocument(documentId: string) {
  try {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (error) {
      throw new Error(`Failed to delete document: ${error.message}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting document:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get document statistics
 */
export async function getDocumentStats() {
  try {
    const { count: docCount, error: docError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })

    const { count: chunkCount, error: chunkError } = await supabase
      .from('document_chunks')
      .select('*', { count: 'exact', head: true })

    if (docError || chunkError) {
      throw new Error('Failed to fetch stats')
    }

    return {
      success: true,
      stats: {
        totalDocuments: docCount || 0,
        totalChunks: chunkCount || 0,
      },
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
    return {
      success: false,
      stats: { totalDocuments: 0, totalChunks: 0 },
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
