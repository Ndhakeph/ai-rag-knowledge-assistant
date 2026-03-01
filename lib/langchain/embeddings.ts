import { Ollama } from 'ollama'

/**
 * Local embedding generation using Ollama
 *
 * Model: nomic-embed-text (768 dimensions)
 * - Runs entirely on-device via Ollama
 * - No API keys or external dependencies
 * - Fast inference on Apple Silicon
 */

const ollama = new Ollama({
  host: 'http://localhost:11434',
})

/**
 * Embedding model configuration
 */
export const EMBEDDING_MODEL = 'nomic-embed-text'
export const EMBEDDING_DIMENSION = 768 // Must match pgvector column dimension

/**
 * Generate embedding for a single text using Ollama
 */
export async function embedText(text: string): Promise<number[]> {
  try {
    const response = await ollama.embed({
      model: EMBEDDING_MODEL,
      input: text,
    })

    // Ollama returns embeddings as array of numbers
    const embedding = response.embeddings[0]

    // Verify dimension
    if (embedding.length !== EMBEDDING_DIMENSION) {
      throw new Error(
        `Unexpected embedding dimension: ${embedding.length} (expected ${EMBEDDING_DIMENSION})`
      )
    }

    return embedding
  } catch (error) {
    console.error('Error generating embedding with Ollama:', error)
    throw new Error(
      `Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Generate embeddings for multiple texts (batch processing)
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  try {
    // Ollama doesn't support true batch processing, so we process sequentially
    // This is still fast enough for typical document chunking (5-20 chunks)
    const embeddings: number[][] = []

    for (const text of texts) {
      const embedding = await embedText(text)
      embeddings.push(embedding)
    }

    return embeddings
  } catch (error) {
    console.error('Error generating embeddings with Ollama:', error)
    throw new Error('Failed to generate embeddings')
  }
}

/**
 * Check if Ollama embedding model is available
 */
export async function checkEmbeddingModelHealth(): Promise<{
  available: boolean
  error?: string
}> {
  try {
    const models = await ollama.list()
    // Check if model is available (Ollama model names may include version tags)
    const modelAvailable = models.models.some(m => m.name.startsWith(EMBEDDING_MODEL))

    if (!modelAvailable) {
      return {
        available: false,
        error: `Model ${EMBEDDING_MODEL} not found. Run: ollama pull ${EMBEDDING_MODEL}`,
      }
    }

    // Test embedding generation
    await embedText('test')

    return { available: true }
  } catch (error) {
    return {
      available: false,
      error: `Ollama error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

