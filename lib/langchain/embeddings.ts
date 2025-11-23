import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'

const apiKey = process.env.GOOGLE_API_KEY!

if (!apiKey) {
  throw new Error('GOOGLE_API_KEY environment variable is not set')
}

/**
 * Gemini embeddings instance for the RAG system
 * Using text-embedding-004 model which produces 768-dimensional vectors
 * This model is optimized for:
 * - Semantic search
 * - Document retrieval
 * - Question answering
 */
export const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey,
  modelName: 'text-embedding-004',
})

/**
 * Generate embedding for a single text
 */
export async function embedText(text: string): Promise<number[]> {
  try {
    const embedding = await embeddings.embedQuery(text)
    return embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw new Error('Failed to generate embedding')
  }
}

/**
 * Generate embeddings for multiple texts (batch processing)
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  try {
    const embeddings_array = await embeddings.embedDocuments(texts)
    return embeddings_array
  } catch (error) {
    console.error('Error generating embeddings:', error)
    throw new Error('Failed to generate embeddings')
  }
}

/**
 * Get embedding dimension (768 for text-embedding-004)
 */
export const EMBEDDING_DIMENSION = 768
