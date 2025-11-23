/**
 * Document parsers for different file types
 * Supports: PDF, TXT, MD, DOCX
 */

/**
 * Parse PDF file
 */
export async function parsePDF(file: File): Promise<string> {
  try {
    // Dynamic import to avoid build issues
    const pdfParse = (await import('pdf-parse')).default
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const data = await pdfParse(buffer)
    return data.text
  } catch (error) {
    console.error('Error parsing PDF:', error)
    throw new Error('Failed to parse PDF file')
  }
}

/**
 * Parse text file
 */
export async function parseTXT(file: File): Promise<string> {
  try {
    const text = await file.text()
    return text
  } catch (error) {
    console.error('Error parsing TXT:', error)
    throw new Error('Failed to parse text file')
  }
}

/**
 * Parse markdown file
 */
export async function parseMD(file: File): Promise<string> {
  try {
    const text = await file.text()
    return text
  } catch (error) {
    console.error('Error parsing MD:', error)
    throw new Error('Failed to parse markdown file')
  }
}

/**
 * Parse DOCX file
 */
export async function parseDOCX(file: File): Promise<string> {
  try {
    const mammoth = await import('mammoth')
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const result = await mammoth.extractRawText({ buffer })
    return result.value
  } catch (error) {
    console.error('Error parsing DOCX:', error)
    throw new Error('Failed to parse DOCX file')
  }
}

/**
 * Main parser function - routes to appropriate parser based on file type
 */
export async function parseDocument(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase()

  switch (extension) {
    case 'pdf':
      return parsePDF(file)
    case 'txt':
      return parseTXT(file)
    case 'md':
      return parseMD(file)
    case 'docx':
      return parseDOCX(file)
    default:
      throw new Error(`Unsupported file type: ${extension}`)
  }
}
