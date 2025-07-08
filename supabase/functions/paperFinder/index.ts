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
}

interface PaperResponse {
  papers: Paper[]
}

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
    const response = await fetch(`${baseUrl}?${params}`, {
      signal: controller.signal
    })
    
    if (!response.ok) throw new Error(`ArXiv API error: ${response.status}`)
    
    const xmlText = await response.text()
    const papers: Paper[] = []
    
    // Simple XML parsing for ArXiv entries
    const entryRegex = /<entry>(.*?)<\/entry>/gs
    const entries = xmlText.match(entryRegex) || []
    
    for (const entry of entries) {
      const titleMatch = entry.match(/<title>(.*?)<\/title>/s)
      const publishedMatch = entry.match(/<published>(.*?)<\/published>/)
      const idMatch = entry.match(/<id>(.*?)<\/id>/)
      const pdfMatch = entry.match(/<link[^>]*href="([^"]*\.pdf)"/)
      
      if (titleMatch && publishedMatch && idMatch) {
        const publishedDate = publishedMatch[1].split('T')[0]
        
        if (publishedDate >= since) {
          const arxivId = idMatch[1].split('/').pop()?.split('v')[0]
          const pdfUrl = pdfMatch ? pdfMatch[1] : `https://arxiv.org/pdf/${arxivId}.pdf`
          
          // Check if PDF is accessible and not too large
          if (await checkPdfSize(pdfUrl)) {
            papers.push({
              title: titleMatch[1].replace(/\s+/g, ' ').trim(),
              url: idMatch[1],
              doi: arxivId,
              source: 'arXiv',
              published_date: publishedDate
            })
          }
        }
      }
    }
    
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

serve(async (req: Request): Promise<Response> => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }
  
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  try {
    const body = await req.json()
    const validatedInput = RequestSchema.parse(body)
    const { since, keywords, limit } = validatedInput
    
    console.log(`Fetching papers since ${since} with keywords: ${keywords.join(', ')} (limit: ${limit})`)
    
    // Fetch from all sources in parallel with 5s timeout
    const timeout = 5000
    const [arxivPapers, scholarPapers, ieeePapers] = await Promise.all([
      fetchArxivPapers(since, keywords, timeout),
      fetchSemanticScholarPapers(since, keywords, timeout),
      fetchIeeePapers(since, keywords, timeout)
    ])
    
    // Combine and process papers
    const allPapers = [...arxivPapers, ...scholarPapers, ...ieeePapers]
    const deduplicatedPapers = deduplicatePapers(allPapers)
    
    // Sort by published_date descending and limit results
    const sortedPapers = deduplicatedPapers
      .sort((a, b) => b.published_date.localeCompare(a.published_date))
      .slice(0, limit)
    
    const response: PaperResponse = {
      papers: sortedPapers
    }
    
    console.log(`Returning ${sortedPapers.length} papers`)
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
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
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      papers: [] 
    }), {
      status: 200, // Return 200 even on error as specified
      headers: { 'Content-Type': 'application/json' }
    })
  }
})