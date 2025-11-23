'use client'

import { FileText, Trash2, Calendar, Hash } from 'lucide-react'
import { useState } from 'react'
import { deleteDocument } from '@/app/actions/ingest'
import { toast } from 'sonner'
import { cn, formatDate, formatFileSize } from '@/lib/utils'
import type { Document } from '@/lib/supabase'

interface DocumentListProps {
  documents: Document[]
  onDocumentDeleted?: () => void
}

export function DocumentList({ documents, onDocumentDeleted }: DocumentListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (documentId: string, documentName: string) => {
    if (!confirm(`Are you sure you want to delete "${documentName}"? This action cannot be undone.`)) {
      return
    }

    setDeletingId(documentId)
    toast.loading('Deleting document...', { id: 'delete' })

    try {
      const result = await deleteDocument(documentId)

      if (result.success) {
        toast.success('Document deleted successfully', { id: 'delete' })
        onDocumentDeleted?.()
      } else {
        toast.error(result.error || 'Failed to delete document', { id: 'delete' })
      }
    } catch (error) {
      toast.error('An unexpected error occurred', { id: 'delete' })
      console.error('Delete error:', error)
    } finally {
      setDeletingId(null)
    }
  }

  if (documents.length === 0) {
    return (
      <div className="glass rounded-lg border border-gray-700 p-12 text-center">
        <FileText className="h-16 w-16 mx-auto text-gray-600 mb-4" />
        <h3 className="text-xl font-semibold text-gray-300 mb-2">
          No documents uploaded yet
        </h3>
        <p className="text-sm text-gray-500">
          Upload your first document to get started
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="glass rounded-lg border border-gray-700 p-4 transition-all duration-200 hover:border-gray-600"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                  doc.file_type === 'pdf' && 'bg-red-500/20 text-red-400',
                  doc.file_type === 'txt' && 'bg-blue-500/20 text-blue-400',
                  doc.file_type === 'md' && 'bg-purple-500/20 text-purple-400',
                  doc.file_type === 'docx' && 'bg-blue-600/20 text-blue-400'
                )}
              >
                <FileText className="h-5 w-5" />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-200 truncate mb-1">
                  {doc.name}
                </h4>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(doc.upload_date)}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    <span>{doc.chunk_count} chunks</span>
                  </div>

                  <div>
                    <span className="uppercase">{doc.file_type}</span>
                    {' • '}
                    <span>{formatFileSize(doc.file_size)}</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleDelete(doc.id, doc.name)}
              disabled={deletingId === doc.id}
              className={cn(
                'shrink-0 rounded-lg p-2 text-gray-400 transition-colors',
                'hover:bg-red-500/20 hover:text-red-400',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
              title="Delete document"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
