import { StreamingTextResponse, LangChainStream } from 'ai'
import { getRelevantDocuments, formatDocumentsForContext } from '@/lib/langchain/retriever'
import { createRAGChain } from '@/lib/langchain/chain'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

/**
 * Streaming chat endpoint using Vercel AI SDK
 * Provides real-time streaming responses from the RAG system
 */
export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    if (!messages || messages.length === 0) {
      return new Response('No messages provided', { status: 400 })
    }

    // Get the last user message
    const lastMessage = messages[messages.length - 1]
    const question = lastMessage.content

    if (!question || typeof question !== 'string') {
      return new Response('Invalid question format', { status: 400 })
    }

    console.log('Streaming chat request:', question)

    // Retrieve relevant documents
    const documents = await getRelevantDocuments(question, {
      k: 10,
      rerankTopK: 5,
      includeMetadata: true,
    })

    if (documents.length === 0) {
      return new Response(
        "I couldn't find any relevant information in the knowledge base to answer your question.",
        { status: 200 }
      )
    }

    // Format context
    const context = formatDocumentsForContext(documents)

    // Set up streaming
    const { stream, handlers } = LangChainStream()

    // Create and invoke RAG chain with streaming
    const chain = createRAGChain(true)

    // Don't await - let it stream
    chain
      .invoke(
        {
          context,
          question,
        },
        { callbacks: [handlers] }
      )
      .catch((error) => {
        console.error('Streaming error:', error)
      })

    // Return streaming response
    return new StreamingTextResponse(stream, {
      headers: {
        'X-Source-Count': documents.length.toString(),
        'X-Documents': JSON.stringify(
          documents.map(doc => ({
            id: doc.metadata.id,
            documentName: doc.metadata.documentName,
            chunkIndex: doc.metadata.chunkIndex,
          }))
        ),
      },
    })
  } catch (error) {
    console.error('Error in streaming chat:', error)
    return new Response(
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    )
  }
}
