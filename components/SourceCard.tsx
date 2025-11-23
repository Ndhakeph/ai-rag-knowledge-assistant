'use client'

import { FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { cn, truncateText } from '@/lib/utils'
import type { SourceInfo } from '@/app/actions/query'

interface SourceCardProps {
  source: SourceInfo
  index: number
}

export function SourceCard({ source, index }: SourceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const similarityPercentage = Math.round(source.similarity * 100)

  return (
    <div className="glass rounded-lg border border-gray-700 p-4 transition-all duration-200 hover:border-gray-600">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <FileText className="h-5 w-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-200 truncate">
                {source.documentName}
              </h4>
              <span className="text-xs text-gray-500 shrink-0">
                Chunk {source.chunkIndex + 1}
              </span>
            </div>

            <p className="text-sm text-gray-400 mb-2">
              {isExpanded ? source.content : truncateText(source.content, 150)}
            </p>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-gray-500">
                  Relevance: {similarityPercentage}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="shrink-0 rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Relevance bar */}
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-gray-800">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            similarityPercentage > 70 ? 'bg-green-500' :
            similarityPercentage > 50 ? 'bg-yellow-500' :
            'bg-orange-500'
          )}
          style={{ width: `${similarityPercentage}%` }}
        />
      </div>
    </div>
  )
}

interface SourceListProps {
  sources: SourceInfo[]
}

export function SourceList({ sources }: SourceListProps) {
  if (sources.length === 0) {
    return null
  }

  return (
    <div className="mt-6 space-y-3">
      <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
        <FileText className="h-5 w-5 text-blue-500" />
        Sources ({sources.length})
      </h3>
      <div className="space-y-3">
        {sources.map((source, index) => (
          <SourceCard key={index} source={source} index={index} />
        ))}
      </div>
    </div>
  )
}
