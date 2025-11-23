'use client'

import Link from 'next/link'
import { DocumentUpload } from '@/components/DocumentUpload'
import { DocumentList } from '@/components/DocumentList'
import { Brain, Home, FileUp, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getDocuments, getDocumentStats } from '@/app/actions/ingest'
import type { Document } from '@/lib/supabase'

export default function UploadPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [stats, setStats] = useState({ totalDocuments: 0, totalChunks: 0 })
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [docsResult, statsResult] = await Promise.all([
        getDocuments(),
        getDocumentStats()
      ])

      if (docsResult.success) {
        setDocuments(docsResult.documents)
      }

      if (statsResult.success) {
        setStats(statsResult.stats)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

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
              <h1 className="text-xl font-bold gradient-text">Upload Documents</h1>
              <p className="text-xs text-gray-500">Add knowledge to your RAG system</p>
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
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="mx-auto max-w-6xl p-6 space-y-8">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="glass rounded-lg border border-gray-700 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/20">
                  <FileUp className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-200">{stats.totalDocuments}</p>
                  <p className="text-sm text-gray-500">Total Documents</p>
                </div>
              </div>
            </div>

            <div className="glass rounded-lg border border-gray-700 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/20">
                  <Brain className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-200">{stats.totalChunks}</p>
                  <p className="text-sm text-gray-500">Total Chunks</p>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div>
            <h2 className="mb-4 text-2xl font-bold text-gray-200">Upload New Document</h2>
            <DocumentUpload onUploadComplete={loadData} />
          </div>

          {/* Recent Documents */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-200">
                Recent Documents ({documents.length})
              </h2>
              <Link
                href="/knowledge"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                View all →
              </Link>
            </div>

            {loading ? (
              <div className="glass rounded-lg border border-gray-700 p-12 text-center">
                <Loader2 className="h-8 w-8 mx-auto text-blue-500 animate-spin mb-3" />
                <p className="text-sm text-gray-400">Loading documents...</p>
              </div>
            ) : (
              <DocumentList
                documents={documents.slice(0, 5)}
                onDocumentDeleted={loadData}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
