import { Document } from '@langchain/core/documents'
import { formatDocumentsForContext } from './retriever'
import { generateText, streamText, formatRAGPrompt, formatConversationalPrompt } from './ollama'

/**
 * UPDATED: Now using Ollama for local LLM inference
 * 
 * Benefits:
 * - No API quota limits
 * - Fast inference on Mac M4
 * - Free unlimited usage
 * - Privacy - all data stays local
 * 
 * Previous: ChatGoogleGenerativeAI (gemini-2.0-flash-exp)
 * Current: Ollama (gemma3:4b)
 */

/**
 * Invoke RAG chain with Ollama
 * Non-streaming version for simple Q&A
 */
export async function invokeRAGChain(
  question: string,
  documents: Document[]
): Promise<string> {
  const context = formatDocumentsForContext(documents)
  const prompt = formatRAGPrompt(context, question)

  const response = await generateText(prompt, {
    temperature: 0.3,
    maxTokens: 2048,
  })

  return response
}

/**
 * Stream RAG chain response using Ollama
 * Returns async iterable for streaming responses
 */
export async function* streamRAGChain(
  question: string,
  documents: Document[]
): AsyncIterable<string> {
  const context = formatDocumentsForContext(documents)
  const prompt = formatRAGPrompt(context, question)

  const stream = streamText(prompt, {
    temperature: 0.3,
    maxTokens: 2048,
  })

  for await (const chunk of stream) {
    yield chunk
  }
}

/**
 * Invoke conversational RAG with history
 */
export async function invokeConversationalRAG(
  question: string,
  documents: Document[],
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const context = formatDocumentsForContext(documents)
  const historyText = formatConversationHistory(history)
  const prompt = formatConversationalPrompt(context, question, historyText)

  const response = await generateText(prompt, {
    temperature: 0.3,
    maxTokens: 2048,
  })

  return response
}

/**
 * Stream conversational RAG with history
 */
export async function* streamConversationalRAG(
  question: string,
  documents: Document[],
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): AsyncIterable<string> {
  const context = formatDocumentsForContext(documents)
  const historyText = formatConversationHistory(history)
  const prompt = formatConversationalPrompt(context, question, historyText)

  const stream = streamText(prompt, {
    temperature: 0.3,
    maxTokens: 2048,
  })

  for await (const chunk of stream) {
    yield chunk
  }
}

/**
 * Format conversation history for the chain
 */
export function formatConversationHistory(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): string {
  if (messages.length === 0) {
    return 'No previous conversation.'
  }

  return messages
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n\n')
}

