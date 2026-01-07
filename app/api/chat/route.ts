import { getRelevantDocuments } from '@/lib/langchain/retriever'
import { streamRAGChain } from '@/lib/langchain/chain'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

/**
 * Streaming chat endpoint using Ollama (fully local)
 * Compatible with Vercel AI SDK useChat hook
 */
export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    if (!messages || messages.length === 0) {
      return new Response('No messages provided', { status: 400 })
    }

    const lastMessage = messages[messages.length - 1]
    const question = lastMessage.content

    if (!question || typeof question !== 'string') {
      return new Response('Invalid question format', { status: 400 })
    }

    console.log('Streaming chat request:', question)

    // Stage 1: Retrieve relevant documents
    console.log('Stage 1: Retrieving top 10 documents...')
    const documents = await getRelevantDocuments(question, {
      k: 10,
      rerankTopK: 5,
      includeMetadata: true,
    })

    if (documents.length === 0) {
      // Return plain text response for "no documents" case
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          const message = "I couldn't find any relevant information in the knowledge base to answer your question."
          controller.enqueue(encoder.encode(`0:${JSON.stringify(message)}\n`))
          controller.close()
        },
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Source-Count': '0',
        },
      })
    }

    console.log(`Found ${documents.length} relevant documents`)
    console.log('Stage 2: Generating response with Ollama...')

    // Stage 2: Stream response using Vercel AI SDK format
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullText = ''
          
          // Stream chunks from Ollama in AI SDK format
          for await (const chunk of streamRAGChain(question, documents)) {
            fullText += chunk
            
            // Vercel AI SDK streaming format: "0:\"chunk text\"\n"
            const formattedChunk = `0:${JSON.stringify(chunk)}\n`
            controller.enqueue(encoder.encode(formattedChunk))
          }
          
          // Close the stream
          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
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
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        suggestion: 'Make sure Ollama is running: ollama serve',
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
