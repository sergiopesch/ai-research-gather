import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"

const RequestSchema = z.object({
  paper_id: z.string().uuid("Invalid paper ID format"),
  model: z.string().optional().default("gpt-4o")
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept, cache-control',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Utility function to count words
function countWords(text: string): number {
  return text.trim().split(/\s+/).length
}

// Utility function to chunk text by token approximation
function chunkText(text: string, maxTokensPerChunk: number = 2500): string[] {
  const words = text.split(/\s+/)
  const chunks: string[] = []
  const wordsPerToken = 0.75 // Rough approximation: 1 token ≈ 0.75 words
  const maxWordsPerChunk = Math.floor(maxTokensPerChunk * wordsPerToken)
  
  for (let i = 0; i < words.length; i += maxWordsPerChunk) {
    const chunk = words.slice(i, i + maxWordsPerChunk).join(' ')
    chunks.push(chunk)
  }
  
  return chunks
}

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

// Function to call OpenAI with retry logic
async function callOpenAI(
  apiKey: string,
  messages: ChatMessage[],
  model: string = "gpt-4o",
  maxRetries: number = 2
): Promise<string> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 40000) // 40s timeout
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.3,
          max_tokens: 2000
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.status === 429 && attempt < maxRetries) {
        console.log(`Rate limited, retrying attempt ${attempt + 1}`)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        continue
      }
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      return data.choices[0].message.content
      
    } catch (error) {
      if (attempt === maxRetries) {
        throw error
      }
      console.log(`Attempt ${attempt + 1} failed, retrying:`, error.message)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }
  
  throw new Error('Max retries exceeded')
}

// Function to download and extract PDF text
async function extractPdfText(url: string): Promise<string> {
  console.log(`Downloading PDF from: ${url}`)
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download PDF: ${response.status}`)
  }
  
  const contentLength = response.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > 25 * 1024 * 1024) { // 25MB limit
    throw new Error('PDF file too large (>25MB)')
  }
  
  const arrayBuffer = await response.arrayBuffer()
  
  // For now, we'll extract text from the first page as a placeholder
  // In a real implementation, you'd use a PDF parsing library
  const decoder = new TextDecoder()
  const rawText = decoder.decode(arrayBuffer)
  
  // Simple text extraction (this would be replaced with proper PDF parsing)
  // Extract text between common PDF text markers
  const textMatches = rawText.match(/BT[\s\S]*?ET/g) || []
  let extractedText = textMatches.join(' ')
    .replace(/[^\x20-\x7E\n]/g, ' ') // Remove non-printable characters
    .replace(/\s+/g, ' ')
    .trim()
  
  // If we couldn't extract much text, return the title and URL as fallback
  if (extractedText.length < 100) {
    extractedText = `This appears to be a research paper available at ${url}. The PDF content could not be fully extracted, but the paper is available for manual review.`
  }
  
  console.log(`Extracted ${extractedText.length} characters from PDF`)
  return extractedText
}

// Function to create summary using map-reduce approach
async function createSummary(text: string, apiKey: string, model: string): Promise<string> {
  console.log('Creating summary using map-reduce approach')
  
  const chunks = chunkText(text, 2500)
  console.log(`Split text into ${chunks.length} chunks`)
  
  // Step 1: Summarize each chunk
  const chunkSummaries: string[] = []
  for (let i = 0; i < chunks.length; i++) {
    console.log(`Summarizing chunk ${i + 1}/${chunks.length}`)
    
    const chunkSummary = await callOpenAI(apiKey, [
      {
        role: 'system',
        content: 'You are an expert at summarizing research papers. Create a concise summary of this text chunk, focusing on key findings, methodology, and conclusions.'
      },
      {
        role: 'user',
        content: `Summarize this chunk of a research paper:\n\n${chunks[i]}`
      }
    ], model)
    
    chunkSummaries.push(chunkSummary)
  }
  
  // Step 2: Combine chunk summaries into final summary
  console.log('Combining chunk summaries into final summary')
  const combinedSummaries = chunkSummaries.join('\n\n')
  
  const finalSummary = await callOpenAI(apiKey, [
    {
      role: 'system',
      content: 'You are an expert at synthesizing research paper summaries. Create a cohesive summary of exactly 300 words or less that captures the essential findings, methodology, and significance of this research.'
    },
    {
      role: 'user',
      content: `Create a final 300-word summary from these chunk summaries:\n\n${combinedSummaries}`
    }
  ], model)
  
  // Ensure word count is under 300
  const words = finalSummary.trim().split(/\s+/)
  if (words.length > 300) {
    return words.slice(0, 300).join(' ') + '...'
  }
  
  return finalSummary
}

// Function to generate podcast script
async function generatePodcastScript(title: string, summary: string, apiKey: string, model: string): Promise<string> {
  console.log('Generating podcast script')
  
  const script = await callOpenAI(apiKey, [
    {
      role: 'system',
      content: `You are a podcast script writer. Create an engaging 1800-word dialogue between:
- Dr. Ada (expert researcher, knowledgeable, explains complex topics clearly)
- Sam (curious layperson, asks good questions, represents the audience)

Structure:
1. Intro music cue (30 words)
2. Overview (400 words) - What is this research about?
3. Deep-Dive (800 words) - How does it work? What's novel?
4. Practical Impact (500 words) - Why does this matter? Real-world applications?
5. Outro music cue (70 words) - Wrap up and next episode tease

Make it conversational, engaging, and accessible. Use "Dr. Ada:" and "Sam:" as speaker labels.`
    },
    {
      role: 'user',
      content: `Create a podcast script for this research paper:

Title: ${title}

Summary: ${summary}

Make it exactly around 1800 words total.`
    }
  ], model)
  
  return script
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }
  
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders,
      }
    })
  }

  try {
    const body = await req.json()
    const { paper_id, model } = RequestSchema.parse(body)
    
    console.log(`=== PROCESS PAPER REQUEST ===`)
    console.log(`Paper ID: ${paper_id}, Model: ${model}`)

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch paper with SELECTED status
    const { data: paper, error: fetchError } = await supabase
      .from('papers')
      .select('*')
      .eq('id', paper_id)
      .eq('status', 'SELECTED')
      .single()

    if (fetchError || !paper) {
      console.error('Paper not found or not selected:', fetchError)
      return new Response(JSON.stringify({ 
        error: 'Paper not found or not in SELECTED status',
        paper_id 
      }), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      })
    }

    console.log(`Processing paper: "${paper.title}"`)

    // Step 1: Download and extract PDF text
    let fullText: string
    try {
      fullText = await extractPdfText(paper.url)
    } catch (error) {
      console.error('PDF extraction failed:', error)
      // Fallback to using title and available metadata
      fullText = `Title: ${paper.title}\nSource: ${paper.source}\nDOI: ${paper.doi || 'N/A'}\nPublished: ${paper.published_date}\n\nThis research paper is available at: ${paper.url}`
    }

    // Step 2: Create summary using map-reduce
    const summary = await createSummary(fullText, openAIApiKey, model)
    console.log(`Generated summary: ${countWords(summary)} words`)

    // Step 3: Generate podcast script
    const script = await generatePodcastScript(paper.title, summary, openAIApiKey, model)
    console.log(`Generated script: ${countWords(script)} words`)

    // Step 4: Save to paper_assets and update status
    const { data: assetData, error: assetError } = await supabase
      .from('paper_assets')
      .insert({
        paper_id,
        summary,
        script,
        full_text_path: null // We're not storing the full text in this implementation
      })
      .select()
      .single()

    if (assetError) {
      console.error('Failed to create paper asset:', assetError)
      throw new Error('Failed to save paper assets')
    }

    // Update paper status to PROCESSED
    const { error: updateError } = await supabase
      .from('papers')
      .update({ status: 'PROCESSED' })
      .eq('id', paper_id)

    if (updateError) {
      console.error('Failed to update paper status:', updateError)
      throw new Error('Failed to update paper status')
    }

    console.log(`✅ Paper ${paper_id} processed successfully`)

    return new Response(JSON.stringify({ 
      paper_id,
      summary,
      script,
      word_counts: {
        summary: countWords(summary),
        script: countWords(script)
      },
      created_at: assetData.created_at
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    })
    
  } catch (error) {
    console.error('ProcessPaper error:', error)
    
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ 
        error: 'Invalid input', 
        details: error.errors 
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      })
    }
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders,
      }
    })
  }
})