'use client'

import Link from 'next/link'
import { DocumentList } from '@/components/DocumentList'
import { Brain, Home, Upload, Loader2, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getDocuments } from '@/app/actions/ingest'
import type { Document } from '@/lib/supabase'

export default function KnowledgePage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const result = await getDocuments()
      if (result.success) {
        setDocuments(result.documents)
        setFilteredDocuments(result.documents)
      }
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDocuments(documents)
    } else {
      const filtered = documents.filter((doc) =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredDocuments(filtered)
    }
  }, [searchQuery, documents])

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">Knowledge Base</h1>
              <p className="text-xs text-gray-500">Manage your documents</p>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-gray-700"
            >
              <Home className="h-4 w-4" />
              Chat
            </Link>
            <Link
              href="/upload"
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:from-blue-700 hover:to-purple-700"
            >
              <Upload className="h-4 w-4" />
              Upload
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="mx-auto max-w-6xl p-6 space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 py-3 pl-12 pr-4 text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Documents List */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-200">
                All Documents
                {!loading && (
                  <span className="ml-2 text-lg font-normal text-gray-500">
                    ({filteredDocuments.length})
                  </span>
                )}
              </h2>
            </div>

            {loading ? (
              <div className="glass rounded-lg border border-gray-700 p-12 text-center">
                <Loader2 className="h-8 w-8 mx-auto text-blue-500 animate-spin mb-3" />
                <p className="text-sm text-gray-400">Loading documents...</p>
              </div>
            ) : (
              <>
                {filteredDocuments.length === 0 && searchQuery ? (
                  <div className="glass rounded-lg border border-gray-700 p-12 text-center">
                    <Search className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">
                      No documents found
                    </h3>
                    <p className="text-sm text-gray-500">
                      Try a different search term
                    </p>
                  </div>
                ) : (
                  <DocumentList documents={filteredDocuments} onDocumentDeleted={loadDocuments} />
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
