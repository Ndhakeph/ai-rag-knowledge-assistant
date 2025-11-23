import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'

/**
 * Chunk document text into smaller pieces for embedding
 * Uses RecursiveCharacterTextSplitter from LangChain for intelligent splitting
 */

export interface ChunkingOptions {
  chunkSize?: number
  chunkOverlap?: number
  separators?: string[]
}

/**
 * Default chunking configuration
 * Optimized for semantic coherence and retrieval quality
 */
const DEFAULT_CHUNK_SIZE = 1000
const DEFAULT_CHUNK_OVERLAP = 200
const DEFAULT_SEPARATORS = [
  '\n\n',  // Paragraph breaks
  '\n',    // Line breaks
  '. ',    // Sentences
  '! ',    // Exclamations
  '? ',    // Questions
  '; ',    // Semicolons
  ', ',    // Commas
  ' ',     // Words
  ''       // Characters
]

/**
 * Create a text splitter instance
 */
function createTextSplitter(options: ChunkingOptions = {}): RecursiveCharacterTextSplitter {
  return new RecursiveCharacterTextSplitter({
    chunkSize: options.chunkSize || DEFAULT_CHUNK_SIZE,
    chunkOverlap: options.chunkOverlap || DEFAULT_CHUNK_OVERLAP,
    separators: options.separators || DEFAULT_SEPARATORS,
  })
}

/**
 * Chunk a document into smaller pieces
 */
export async function chunkDocument(
  text: string,
  options: ChunkingOptions = {}
): Promise<string[]> {
  try {
    const splitter = createTextSplitter(options)
    const chunks = await splitter.splitText(text)

    // Filter out empty or very short chunks
    const filteredChunks = chunks.filter(chunk => chunk.trim().length > 50)

    console.log(`Chunked document into ${filteredChunks.length} chunks`)
    return filteredChunks
  } catch (error) {
    console.error('Error chunking document:', error)
    throw new Error('Failed to chunk document')
  }
}

/**
 * Chunk multiple documents
 */
export async function chunkDocuments(
  texts: string[],
  options: ChunkingOptions = {}
): Promise<string[][]> {
  const chunkedDocuments = await Promise.all(
    texts.map(text => chunkDocument(text, options))
  )
  return chunkedDocuments
}

/**
 * Get chunking statistics
 */
export function getChunkingStats(chunks: string[]): {
  totalChunks: number
  avgChunkSize: number
  minChunkSize: number
  maxChunkSize: number
} {
  if (chunks.length === 0) {
    return {
      totalChunks: 0,
      avgChunkSize: 0,
      minChunkSize: 0,
      maxChunkSize: 0,
    }
  }

  const sizes = chunks.map(chunk => chunk.length)
  const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length

  return {
    totalChunks: chunks.length,
    avgChunkSize: Math.round(avgSize),
    minChunkSize: Math.min(...sizes),
    maxChunkSize: Math.max(...sizes),
  }
}
