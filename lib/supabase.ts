import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create client only if credentials are available (allows build to succeed)
function createSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Copy .env.example to .env.local and add your Supabase credentials.'
    )
  }
  return createClient(supabaseUrl, supabaseKey)
}

// Lazy initialization - throws at runtime if env vars are missing, not at build time
let _supabase: SupabaseClient | null = null

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (!_supabase) {
      _supabase = createSupabaseClient()
    }
    return (_supabase as any)[prop]
  },
})

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
