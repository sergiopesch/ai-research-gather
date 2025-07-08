import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"

// Input validation schema
const RequestSchema = z.object({
  since: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  keywords: z.array(z.string()).optional().default([]),
  limit: z.number().int().min(1).max(50).optional().default(15)
})

type RequestData = z.infer<typeof RequestSchema>

interface Paper {
  title: string
  url: string
  doi?: string
  source: string
  published_date: string
  authors?: string[]
  summary?: string
  importance?: string
}

interface PaperResponse {
  papers: Paper[]
}

const RESEARCH_AREAS = [
  { name: 'Artificial Intelligence', keywords: ['artificial intelligence', 'ai', 'machine learning', 'ml', 'deep learning', 'neural network', 'llm', 'language model', 'transformer', 'gpt', 'bert', 'nlp', 'natural language'] },
  { name: 'Robotics', keywords: ['robotics', 'robot', 'autonomous', 'robotic', 'manipulation', 'navigation', 'slam', 'motion planning', 'humanoid', 'drone', 'uav'] },
  { name: 'Computer Vision', keywords: ['computer vision', 'image processing', 'visual', 'vision', 'opencv', 'segmentation', 'detection', 'recognition', 'cnn', 'yolo', 'object detection', 'image classification'] }
]

// Utility function to check PDF size
async function checkPdfSize(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    const contentLength = response.headers.get('content-length')
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024)
      return sizeInMB <= 25
    }
    return true // Allow if size unknown
  } catch {
    return false
  }
}

// ArXiv API integration
async function fetchArxivPapers(since: string, keywords: string[], timeout: number): Promise<Paper[]> {
  const baseUrl = Deno.env.get('ARXIV_BASE_URL') || 'http://export.arxiv.org/api/query'
  
  let searchQuery = 'cat:cs.AI OR cat:cs.RO OR cat:cs.CV OR cat:cs.LG'
  if (keywords.length > 0) {
    const keywordQuery = keywords.map(k => `all:"${k}"`).join(' OR ')
    searchQuery = `(${searchQuery}) AND (${keywordQuery})`
  }
  
  const params = new URLSearchParams({
    search_query: searchQuery,
    start: '0',
    max_results: '100',
    sortBy: 'submittedDate',
    sortOrder: 'descending'
  })
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    console.log(`Searching arXiv with query: ${searchQuery}`)
    const response = await fetch(`${baseUrl}?${params}`, {
      signal: controller.signal
    })
    
    if (!response.ok) throw new Error(`ArXiv API error: ${response.status}`)
    
    const xmlText = await response.text()
    console.log(`ArXiv response length: ${xmlText.length} characters`)
    
    const papers: Paper[] = []
    
    // Simple XML parsing for ArXiv entries
    const entryRegex = /<entry>(.*?)<\/entry>/gs
    const entries = xmlText.match(entryRegex) || []
    console.log(`Found ${entries.length} entries in arXiv response`)
    
    for (const entry of entries) {
      const titleMatch = entry.match(/<title>(.*?)<\/title>/s)
      const publishedMatch = entry.match(/<published>(.*?)<\/published>/)
      const idMatch = entry.match(/<id>(.*?)<\/id>/)
      const pdfMatch = entry.match(/<link[^>]*href="([^"]*\.pdf)"/)
      const authorMatches = entry.match(/<author>[\s\S]*?<name>(.*?)<\/name>[\s\S]*?<\/author>/g)
      
      if (titleMatch && publishedMatch && idMatch) {
        const publishedDate = publishedMatch[1].split('T')[0]
        console.log(`Paper "${titleMatch[1].substring(0, 50)}..." published: ${publishedDate}, since: ${since}`)
        
        // Make date filtering more lenient - get papers from the last 7 days
        const paperDate = new Date(publishedDate)
        const sinceDate = new Date(since)
        const daysDiff = Math.floor((sinceDate.getTime() - paperDate.getTime()) / (1000 * 60 * 60 * 24))
        
        console.log(`Days difference: ${daysDiff}`)
        
        if (daysDiff <= 7) { // Get papers from last 7 days instead of just today
          const arxivId = idMatch[1].split('/').pop()?.split('v')[0]
          const pdfUrl = pdfMatch ? pdfMatch[1] : `https://arxiv.org/pdf/${arxivId}.pdf`
          
          // Extract authors
          const authors = authorMatches ? 
            authorMatches.map(match => match.replace(/<author>[\s\S]*?<name>(.*?)<\/name>[\s\S]*?<\/author>/, '$1')).slice(0, 3) : 
            []
          
          console.log(`Adding paper: ${titleMatch[1].substring(0, 50)}...`)
          
          papers.push({
            title: titleMatch[1].replace(/\s+/g, ' ').trim(),
            url: idMatch[1],
            doi: arxivId,
            source: 'arXiv',
            published_date: publishedDate,
            authors
          })
        } else {
          console.log(`Skipping paper - too old (${daysDiff} days)`)
        }
      }
    }
    
    console.log(`Returning ${papers.length} papers from arXiv`)
    return papers
  } catch (error) {
    console.warn('ArXiv fetch error:', error.message)
    return []
  } finally {
    clearTimeout(timeoutId)
  }
}

// Semantic Scholar API integration
async function fetchSemanticScholarPapers(since: string, keywords: string[], timeout: number): Promise<Paper[]> {
  const apiKey = Deno.env.get('SEM_SCHOLAR_API_KEY')
  if (!apiKey) {
    console.warn('SEM_SCHOLAR_API_KEY not found')
    return []
  }
  
  const query = keywords.length > 0 ? keywords.join(' OR ') : 'artificial intelligence robotics'
  
  const params = new URLSearchParams({
    query,
    limit: '100',
    fields: 'title,url,doi,publicationDate,isOpenAccess,openAccessPdf',
    publicationDateOrYear: `${since}:`
  })
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(`https://api.semanticscholar.org/graph/v1/paper/search?${params}`, {
      headers: {
        'x-api-key': apiKey
      },
      signal: controller.signal
    })
    
    if (!response.ok) throw new Error(`Semantic Scholar API error: ${response.status}`)
    
    const data = await response.json()
    const papers: Paper[] = []
    
    for (const paper of data.data || []) {
      if (paper.isOpenAccess && paper.openAccessPdf?.url) {
        if (await checkPdfSize(paper.openAccessPdf.url)) {
          papers.push({
            title: paper.title,
            url: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
            doi: paper.doi,
            source: 'Semantic Scholar',
            published_date: paper.publicationDate || since
          })
        }
      }
    }
    
    return papers
  } catch (error) {
    console.warn('Semantic Scholar fetch error:', error.message)
    return []
  } finally {
    clearTimeout(timeoutId)
  }
}

// IEEE Xplore API integration
async function fetchIeeePapers(since: string, keywords: string[], timeout: number): Promise<Paper[]> {
  const apiKey = Deno.env.get('IEEE_API_KEY')
  if (!apiKey) {
    console.warn('IEEE_API_KEY not found')
    return []
  }
  
  let queryText = 'artificial intelligence OR robotics OR machine learning'
  if (keywords.length > 0) {
    queryText = keywords.join(' OR ')
  }
  
  const params = new URLSearchParams({
    apikey: apiKey,
    format: 'json',
    max_records: '100',
    start_record: '1',
    sort_order: 'desc',
    sort_field: 'publication_date',
    querytext: queryText
  })
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(`https://ieeexploreapi.ieee.org/api/v1/search/articles?${params}`, {
      signal: controller.signal
    })
    
    if (!response.ok) throw new Error(`IEEE API error: ${response.status}`)
    
    const data = await response.json()
    const papers: Paper[] = []
    
    for (const article of data.articles || []) {
      const publishedDate = article.publication_date || since
      
      if (publishedDate >= since && article.access_type === 'OPEN_ACCESS' && article.pdf_url) {
        if (await checkPdfSize(article.pdf_url)) {
          papers.push({
            title: article.title,
            url: article.html_url || `https://ieeexplore.ieee.org/document/${article.article_number}`,
            doi: article.doi,
            source: 'IEEE Xplore',
            published_date: publishedDate
          })
        }
      }
    }
    
    return papers
  } catch (error) {
    console.warn('IEEE fetch error:', error.message)
    return []
  } finally {
    clearTimeout(timeoutId)
  }
}

// Deduplicate papers by DOI or title similarity
function deduplicatePapers(papers: Paper[]): Paper[] {
  const seen = new Set<string>()
  const deduplicated: Paper[] = []
  
  for (const paper of papers) {
    let key = ''
    
    if (paper.doi) {
      key = paper.doi.toLowerCase()
    } else {
      // Use normalized title as fallback
      key = paper.title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()
    }
    
    if (!seen.has(key)) {
      seen.add(key)
      deduplicated.push(paper)
    }
  }
  
  return deduplicated
}

// Categorize papers by research area
function categorizePaper(title: string): string {
  const titleLower = title.toLowerCase()
  
  for (const area of RESEARCH_AREAS) {
    if (area.keywords.some(keyword => titleLower.includes(keyword.toLowerCase()))) {
      return area.name
    }
  }
  
  return 'Artificial Intelligence' // Default to AI
}

// Select diverse papers ensuring at least one from each area
function selectDiversePapers(papers: Paper[], limit: number): Paper[] {
  console.log(`Selecting diverse papers from ${papers.length} total papers`)
  
  // Categorize papers by research area
  const categorizedPapers: { [key: string]: Paper[] } = {}
  
  papers.forEach(paper => {
    const category = categorizePaper(paper.title)
    if (!categorizedPapers[category]) {
      categorizedPapers[category] = []
    }
    categorizedPapers[category].push(paper)
  })
  
  console.log('Papers by category:', Object.keys(categorizedPapers).map(cat => `${cat}: ${categorizedPapers[cat].length}`))
  
  const selectedPapers: Paper[] = []
  const areas = RESEARCH_AREAS.map(area => area.name)
  
  // First, ensure we get at least one paper from each area if available
  for (const area of areas) {
    if (categorizedPapers[area] && categorizedPapers[area].length > 0 && selectedPapers.length < limit) {
      selectedPapers.push(categorizedPapers[area][0])
      categorizedPapers[area] = categorizedPapers[area].slice(1)
    }
  }
  
  // Then fill remaining slots with papers from any area, prioritizing areas with fewer papers selected
  while (selectedPapers.length < limit) {
    let paperAdded = false
    
    for (const area of areas) {
      if (categorizedPapers[area] && categorizedPapers[area].length > 0 && selectedPapers.length < limit) {
        selectedPapers.push(categorizedPapers[area][0])
        categorizedPapers[area] = categorizedPapers[area].slice(1)
        paperAdded = true
      }
    }
    
    if (!paperAdded) break // No more papers available
  }
  
  console.log(`Selected ${selectedPapers.length} diverse papers`)
  return selectedPapers
}

// Generate AI summary for a paper
async function generatePaperSummary(title: string): Promise<{ summary: string; importance: string }> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openAIApiKey) {
    return {
      summary: "AI summary unavailable - OpenAI API key not configured.",
      importance: "Summary generation requires OpenAI API configuration."
    }
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in AI, machine learning, robotics, and computer vision research. Provide concise, clear explanations for academic papers.'
          },
          {
            role: 'user',
            content: `Based on this research paper title: "${title}"

Please provide:
1. A one-sentence summary of what this paper is about
2. A one-sentence explanation of why this research is important

Format your response as JSON:
{
  "summary": "one sentence describing what the paper is about",
  "importance": "one sentence explaining why this is important"
}`
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    try {
      const parsed = JSON.parse(content)
      return {
        summary: parsed.summary || "Summary generation failed.",
        importance: parsed.importance || "Importance analysis failed."
      }
    } catch {
      return {
        summary: "Unable to parse AI response.",
        importance: "AI summary generation encountered an error."
      }
    }
  } catch (error) {
    console.warn('OpenAI summary generation error:', error)
    return {
      summary: "AI summary temporarily unavailable.",
      importance: "Summary generation service is currently unavailable."
    }
  }
}

serve(async (req: Request): Promise<Response> => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

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
    const validatedInput = RequestSchema.parse(body)
    const { since, keywords, limit } = validatedInput
    
    console.log(`Fetching papers since ${since} with keywords: ${keywords.join(', ')} (limit: ${limit})`)
    
    // Fetch from arXiv only for now (no API key required)
    const timeout = 5000
    const arxivPapers = await fetchArxivPapers(since, keywords, timeout)
    
    // Use only arXiv papers
    const allPapers = arxivPapers
    const deduplicatedPapers = deduplicatePapers(allPapers)
    
    // Select diverse papers (at least one from each area) before sorting
    const diversePapers = selectDiversePapers(deduplicatedPapers, limit)
    
    // Sort by published_date descending
    const sortedPapers = diversePapers
      .sort((a, b) => b.published_date.localeCompare(a.published_date))
    
    // Generate AI summaries for each paper
    const papersWithSummaries = await Promise.all(
      sortedPapers.map(async (paper) => {
        const { summary, importance } = await generatePaperSummary(paper.title)
        return {
          ...paper,
          summary,
          importance
        }
      })
    )

    const response: PaperResponse = {
      papers: papersWithSummaries
    }
    
    console.log(`Returning ${sortedPapers.length} papers`)
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    })
    
  } catch (error) {
    console.error('PaperFinder error:', error)
    
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
      papers: [] 
    }), {
      status: 200, // Return 200 even on error as specified
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders,
      }
    })
  }
})