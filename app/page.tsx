import Link from 'next/link'
import { ChatInterface } from '@/components/ChatInterface'
import { Brain, Upload, Library } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">RAG Knowledge Assistant</h1>
              <p className="text-xs text-gray-500">Powered by Ollama (Local AI)</p>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              href="/upload"
              className="flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-gray-700"
            >
              <Upload className="h-4 w-4" />
              Upload
            </Link>
            <Link
              href="/knowledge"
              className="flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-gray-700"
            >
              <Library className="h-4 w-4" />
              Knowledge Base
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="mx-auto h-full max-w-5xl p-6">
          <div className="glass h-full overflow-hidden rounded-lg border border-gray-700">
            <ChatInterface />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900/50 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-3 text-center text-xs text-gray-500">
          Built with Next.js 14, LangChain.js, Supabase pgvector, and Ollama
        </div>
      </footer>
    </div>
  )
}
