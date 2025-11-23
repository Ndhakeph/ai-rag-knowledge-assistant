'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { ingestDocument } from '@/app/actions/ingest'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface DocumentUploadProps {
  onUploadComplete?: () => void
}

export function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return

      const file = acceptedFiles[0]
      setUploading(true)
      setUploadStatus('idle')

      try {
        const formData = new FormData()
        formData.append('file', file)

        toast.loading(`Uploading ${file.name}...`, { id: 'upload' })

        const result = await ingestDocument(formData)

        if (result.success) {
          setUploadStatus('success')
          toast.success(
            `Successfully uploaded ${result.documentName}! Created ${result.chunkCount} chunks.`,
            { id: 'upload' }
          )
          onUploadComplete?.()
        } else {
          setUploadStatus('error')
          toast.error(result.error || 'Upload failed', { id: 'upload' })
        }
      } catch (error) {
        setUploadStatus('error')
        toast.error('An unexpected error occurred', { id: 'upload' })
        console.error('Upload error:', error)
      } finally {
        setUploading(false)
      }
    },
    [onUploadComplete]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploading,
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative overflow-hidden rounded-lg border-2 border-dashed p-12 transition-all duration-200',
        isDragActive && 'border-blue-500 bg-blue-500/10',
        !isDragActive && uploadStatus === 'idle' && 'border-gray-600 hover:border-gray-500',
        !isDragActive && uploadStatus === 'success' && 'border-green-500 bg-green-500/10',
        !isDragActive && uploadStatus === 'error' && 'border-red-500 bg-red-500/10',
        uploading && 'cursor-not-allowed opacity-60'
      )}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center justify-center gap-4 text-center">
        {uploading ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            <div>
              <p className="text-lg font-semibold text-gray-200">Processing document...</p>
              <p className="text-sm text-gray-400">
                Parsing, chunking, and generating embeddings
              </p>
            </div>
          </>
        ) : uploadStatus === 'success' ? (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <div>
              <p className="text-lg font-semibold text-gray-200">Upload successful!</p>
              <p className="text-sm text-gray-400">Drop another file to continue</p>
            </div>
          </>
        ) : uploadStatus === 'error' ? (
          <>
            <XCircle className="h-12 w-12 text-red-500" />
            <div>
              <p className="text-lg font-semibold text-gray-200">Upload failed</p>
              <p className="text-sm text-gray-400">Please try again</p>
            </div>
          </>
        ) : (
          <>
            {isDragActive ? (
              <Upload className="h-12 w-12 text-blue-500" />
            ) : (
              <FileText className="h-12 w-12 text-gray-400" />
            )}
            <div>
              <p className="text-lg font-semibold text-gray-200">
                {isDragActive ? 'Drop your file here' : 'Drag & drop a document'}
              </p>
              <p className="text-sm text-gray-400">or click to browse</p>
            </div>
            <div className="text-xs text-gray-500">
              Supported formats: PDF, TXT, MD, DOCX • Max size: 10MB
            </div>
          </>
        )}
      </div>

      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 blur-3xl animate-gradient" />
      </div>
    </div>
  )
}
