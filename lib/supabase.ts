import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Types for database tables
export interface Document {
  id: string
  name: string
  content: string
  file_type: 'pdf' | 'txt' | 'md' | 'docx'
  file_size: number
  upload_date: string
  chunk_count: number
  metadata?: Record<string, any>
}

export interface DocumentChunk {
  id: string
  document_id: string
  content: string
  embedding: number[]
  chunk_index: number
  metadata?: Record<string, any>
  created_at: string
}

export interface MatchResult {
  id: string
  document_id: string
  content: string
  chunk_index: number
  similarity: number
  metadata?: Record<string, any>
}
