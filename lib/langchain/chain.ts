import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { PromptTemplate } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { Document } from '@langchain/core/documents'
import { formatDocumentsForContext } from './retriever'

const apiKey = process.env.GOOGLE_API_KEY!

if (!apiKey) {
  throw new Error('GOOGLE_API_KEY environment variable is not set')
}

/**
 * RAG prompt template with strict source attribution requirements
 */
const RAG_TEMPLATE = `You are a knowledgeable AI assistant with access to a document knowledge base. Your task is to answer questions based ONLY on the provided context documents.

IMPORTANT INSTRUCTIONS:
1. Answer based ONLY on the information in the provided context
2. Cite which document(s) you're referencing in your answer
3. If the context doesn't contain enough information, acknowledge this clearly
4. Be concise but complete in your responses
5. Maintain a professional and helpful tone

Context Documents:
{context}

Question: {question}

Answer (with source citations):`.trim()

/**
 * Chat prompt for conversational context (with history)
 */
const CHAT_TEMPLATE = `You are a knowledgeable AI assistant with access to a document knowledge base. Use the conversation history and context to provide helpful, accurate answers.

Conversation History:
{history}

Context Documents:
{context}

Current Question: {question}

Answer (with source citations):`.trim()

/**
 * Initialize the Gemini 2.0 Flash model
 */
export function createLLM(streaming: boolean = false) {
  return new ChatGoogleGenerativeAI({
    apiKey,
    modelName: 'gemini-2.0-flash-exp',
    temperature: 0.3,
    maxOutputTokens: 2048,
    streaming,
  })
}

/**
 * Create the RAG chain for question answering
 */
export function createRAGChain(streaming: boolean = false) {
  const llm = createLLM(streaming)
  const prompt = PromptTemplate.fromTemplate(RAG_TEMPLATE)

  const chain = RunnableSequence.from([
    {
      context: (input: { context: string; question: string }) => input.context,
      question: (input: { context: string; question: string }) => input.question,
    },
    prompt,
    llm,
    new StringOutputParser(),
  ])

  return chain
}

/**
 * Create conversational RAG chain with history
 */
export function createConversationalRAGChain(streaming: boolean = false) {
  const llm = createLLM(streaming)
  const prompt = PromptTemplate.fromTemplate(CHAT_TEMPLATE)

  const chain = RunnableSequence.from([
    {
      context: (input: { context: string; question: string; history: string }) => input.context,
      question: (input: { context: string; question: string; history: string }) => input.question,
      history: (input: { context: string; question: string; history: string }) => input.history,
    },
    prompt,
    llm,
    new StringOutputParser(),
  ])

  return chain
}

/**
 * Simple wrapper to invoke RAG chain
 */
export async function invokeRAGChain(
  question: string,
  documents: Document[]
): Promise<string> {
  const chain = createRAGChain(false)
  const context = formatDocumentsForContext(documents)

  const response = await chain.invoke({
    context,
    question,
  })

  return response
}

/**
 * Stream RAG chain response
 * Returns async iterable for streaming
 */
export async function* streamRAGChain(
  question: string,
  documents: Document[]
): AsyncIterable<string> {
  const chain = createRAGChain(true)
  const context = formatDocumentsForContext(documents)

  const stream = await chain.stream({
    context,
    question,
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
