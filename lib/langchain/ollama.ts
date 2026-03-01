import { Ollama } from 'ollama'

/**
 * Ollama client for local LLM inference
 *
 * Using gemma3:4b - a lightweight model optimized for Apple Silicon.
 * All inference runs on-device with no external API calls.
 */

const ollama = new Ollama({
  host: 'http://localhost:11434', // Default Ollama server
})

/**
 * Available Ollama models
 */
export const OLLAMA_MODELS = {
  GEMMA3_4B: 'gemma3:4b', // Fast, efficient, good quality
} as const

/**
 * Default model for RAG
 */
export const DEFAULT_MODEL = OLLAMA_MODELS.GEMMA3_4B

/**
 * Generate text completion using Ollama
 * 
 * @param prompt - The prompt to send to the model
 * @param options - Generation options
 * @returns Generated text response
 */
export async function generateText(
  prompt: string,
  options?: {
    model?: string
    temperature?: number
    maxTokens?: number
  }
): Promise<string> {
  const model = options?.model || DEFAULT_MODEL
  const temperature = options?.temperature ?? 0.3
  const maxTokens = options?.maxTokens ?? 2048

  try {
    const response = await ollama.generate({
      model,
      prompt,
      options: {
        temperature,
        num_predict: maxTokens,
      },
    })

    return response.response
  } catch (error) {
    console.error('Ollama generation error:', error)
    throw new Error(`Ollama generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Stream text generation using Ollama
 * 
 * @param prompt - The prompt to send to the model
 * @param options - Generation options
 * @returns Async iterable of text chunks
 */
export async function* streamText(
  prompt: string,
  options?: {
    model?: string
    temperature?: number
    maxTokens?: number
  }
): AsyncIterable<string> {
  const model = options?.model || DEFAULT_MODEL
  const temperature = options?.temperature ?? 0.3
  const maxTokens = options?.maxTokens ?? 2048

  try {
    const stream = await ollama.generate({
      model,
      prompt,
      stream: true,
      options: {
        temperature,
        num_predict: maxTokens,
      },
    })

    for await (const chunk of stream) {
      if (chunk.response) {
        yield chunk.response
      }
    }
  } catch (error) {
    console.error('Ollama streaming error:', error)
    throw new Error(`Ollama streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Check if Ollama is running and model is available
 */
export async function checkOllamaHealth(): Promise<{
  running: boolean
  modelAvailable: boolean
  error?: string
}> {
  try {
    // Check if Ollama is running
    const models = await ollama.list()
    
    // Check if our model is available (model names may include version tags)
    const modelAvailable = models.models.some(
      m => m.name.startsWith(DEFAULT_MODEL.split(':')[0])
    )

    return {
      running: true,
      modelAvailable,
      error: modelAvailable ? undefined : `Model ${DEFAULT_MODEL} not found. Run: ollama pull ${DEFAULT_MODEL}`,
    }
  } catch (error) {
    return {
      running: false,
      modelAvailable: false,
      error: 'Ollama is not running. Start it with: ollama serve',
    }
  }
}

/**
 * Format RAG prompt for Ollama
 * Ollama models work best with clear, structured prompts
 */
export function formatRAGPrompt(context: string, question: string): string {
  return `You are a knowledgeable AI assistant with access to a document knowledge base. Your task is to answer questions based ONLY on the provided context documents.

IMPORTANT INSTRUCTIONS:
1. Answer based ONLY on the information in the provided context
2. Cite which document(s) you're referencing in your answer
3. If the context doesn't contain enough information, acknowledge this clearly
4. Be concise but complete in your responses
5. Maintain a professional and helpful tone

Context Documents:
${context}

Question: ${question}

Answer (with source citations):`
}

/**
 * Format conversational RAG prompt with history
 */
export function formatConversationalPrompt(
  context: string,
  question: string,
  history: string
): string {
  return `You are a knowledgeable AI assistant with access to a document knowledge base. Use the conversation history and context to provide helpful, accurate answers.

Conversation History:
${history}

Context Documents:
${context}

Current Question: ${question}

Answer (with source citations):`
}
