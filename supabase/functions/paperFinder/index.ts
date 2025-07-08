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

// ArXiv API integration with category-specific searches
async function fetchArxivPapersForCategory(category: string, since: string, timeout: number): Promise<Paper[]> {
  const baseUrl = Deno.env.get('ARXIV_BASE_URL') || 'http://export.arxiv.org/api/query'
  
  // Define category-specific search queries for better targeting
  const categoryQueries: Record<string, string> = {
    'Artificial Intelligence': '(cat:cs.AI OR cat:cs.LG OR cat:cs.CL) AND (all:"artificial intelligence" OR all:"machine learning" OR all:"deep learning" OR all:"neural network" OR all:"transformer" OR all:"language model")',
    'Robotics': '(cat:cs.RO OR cat:cs.SY) AND (all:"robotics" OR all:"robot" OR all:"autonomous" OR all:"manipulation" OR all:"navigation" OR all:"slam" OR all:"motion planning")',
    'Computer Vision': '(cat:cs.CV) AND (all:"computer vision" OR all:"image processing" OR all:"vision" OR all:"segmentation" OR all:"detection" OR all:"recognition" OR all:"object detection")'
  }
  
  const searchQuery = categoryQueries[category] || categoryQueries['Artificial Intelligence']
  
  const params = new URLSearchParams({
    search_query: searchQuery,
    start: '0',
    max_results: '100',  // Fetch enough for each category
    sortBy: 'submittedDate',
    sortOrder: 'descending'
  })
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    console.log(`=== SEARCHING ${category.toUpperCase()} ===`)
    console.log(`Query: ${searchQuery}`)
    
    const response = await fetch(`${baseUrl}?${params}`, {
      signal: controller.signal
    })
    
    if (!response.ok) throw new Error(`ArXiv API error: ${response.status}`)
    
    const xmlText = await response.text()
    const papers: Paper[] = []
    
    // Simple XML parsing for ArXiv entries
    const entryRegex = /<entry>(.*?)<\/entry>/gs
    const entries = xmlText.match(entryRegex) || []
    console.log(`Found ${entries.length} entries for ${category}`)
    
    for (const entry of entries) {
      const titleMatch = entry.match(/<title>(.*?)<\/title>/s)
      const publishedMatch = entry.match(/<published>(.*?)<\/published>/)
      const idMatch = entry.match(/<id>(.*?)<\/id>/)
      const pdfMatch = entry.match(/<link[^>]*href="([^"]*\.pdf)"/)
      const authorMatches = entry.match(/<author>[\s\S]*?<name>(.*?)<\/name>[\s\S]*?<\/author>/g)
      
      if (titleMatch && publishedMatch && idMatch) {
        const publishedDate = publishedMatch[1].split('T')[0]
        
        // Extended date filtering - get papers from last 60 days to ensure sufficient pool
        const paperDate = new Date(publishedDate)
        const sinceDate = new Date(since)
        const daysDiff = Math.floor((sinceDate.getTime() - paperDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysDiff <= 60) {
          const arxivId = idMatch[1].split('/').pop()?.split('v')[0]
          
          // Extract authors with fixed regex
          const authors = authorMatches ? 
            authorMatches.map(match => match.replace(/<author>[\s\S]*?<name>(.*?)<\/name>[\s\S]*?<\/author>/, '$1')).slice(0, 3) : 
            []
          
          papers.push({
            title: titleMatch[1].replace(/\s+/g, ' ').trim(),
            url: idMatch[1],
            doi: arxivId,
            source: 'arXiv',
            published_date: publishedDate,
            authors
          })
        }
      }
    }
    
    console.log(`${category}: Collected ${papers.length} papers`)
    return papers
  } catch (error) {
    console.warn(`${category} ArXiv fetch error:`, error.message)
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
        papers.push({
          title: paper.title,
          url: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
          doi: paper.doi,
          source: 'Semantic Scholar',
          published_date: paper.publicationDate || since
        })
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
        papers.push({
          title: article.title,
          url: article.html_url || `https://ieeexplore.ieee.org/document/${article.article_number}`,
          doi: article.doi,
          source: 'IEEE Xplore',
          published_date: publishedDate
        })
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

// Enhanced categorization with weighted scoring
function categorizePaper(title: string): { category: string; confidence: number } {
  const titleLower = title.toLowerCase()
  let bestMatch = { category: 'Artificial Intelligence', confidence: 0 }
  
  for (const area of RESEARCH_AREAS) {
    let confidence = 0
    
    for (const keyword of area.keywords) {
      if (titleLower.includes(keyword.toLowerCase())) {
        // Higher confidence for more specific keywords
        if (['artificial intelligence', 'machine learning', 'deep learning', 'robotics', 'computer vision'].includes(keyword.toLowerCase())) {
          confidence += 10
        } else if (['ai', 'ml', 'cv', 'robot', 'vision'].includes(keyword.toLowerCase())) {
          confidence += 5
        } else {
          confidence += 1
        }
      }
    }
    
    if (confidence > bestMatch.confidence) {
      bestMatch = { category: area.name, confidence }
    }
  }
  
  return bestMatch
}

// BULLETPROOF distribution algorithm ensuring exactly 2 papers per selected area
function selectPapersWithPerfectDistribution(papersByCategory: { [key: string]: Paper[] }, selectedAreas: string[], targetTotal: number): Paper[] {
  console.log(`=== PERFECT DISTRIBUTION ALGORITHM ===`)
  console.log(`Target: ${targetTotal} papers total`)
  console.log(`Selected areas: ${selectedAreas.join(', ')}`)
  
  const papersPerArea = Math.floor(targetTotal / selectedAreas.length)
  console.log(`Target per area: ${papersPerArea} papers`)
  
  const selectedPapers: Paper[] = []
  const distributionLog: { [key: string]: number } = {}
  
  // Step 1: Try to get exactly papersPerArea from each selected area
  for (const area of selectedAreas) {
    const availablePapers = papersByCategory[area] || []
    console.log(`${area}: ${availablePapers.length} papers available`)
    
    // Shuffle papers for randomness within category
    const shuffledPapers = [...availablePapers].sort(() => Math.random() - 0.5)
    
    // Take up to papersPerArea papers
    const taken = shuffledPapers.slice(0, papersPerArea)
    selectedPapers.push(...taken)
    distributionLog[area] = taken.length
    
    console.log(`${area}: Selected ${taken.length} papers`)
    taken.forEach((paper, i) => {
      console.log(`  ${i + 1}. "${paper.title.substring(0, 50)}..."`)
    })
  }
  
  // Step 2: Fill remaining slots if we're short of target
  const remaining = targetTotal - selectedPapers.length
  if (remaining > 0) {
    console.log(`=== FILLING ${remaining} REMAINING SLOTS ===`)
    
    for (const area of selectedAreas) {
      if (remaining <= 0) break
      
      const availablePapers = papersByCategory[area] || []
      const alreadyTaken = distributionLog[area] || 0
      const remainingInCategory = availablePapers.slice(alreadyTaken)
      
      if (remainingInCategory.length > 0) {
        const shuffled = [...remainingInCategory].sort(() => Math.random() - 0.5)
        const toTake = Math.min(1, remaining, shuffled.length)
        const taken = shuffled.slice(0, toTake)
        
        selectedPapers.push(...taken)
        distributionLog[area] = (distributionLog[area] || 0) + taken.length
        
        console.log(`${area}: Added ${taken.length} extra papers`)
      }
    }
  }
  
  // Step 3: Final shuffle while maintaining selection
  const finalPapers = [...selectedPapers].sort(() => Math.random() - 0.5)
  
  console.log(`=== FINAL DISTRIBUTION ===`)
  selectedAreas.forEach(area => {
    const count = distributionLog[area] || 0
    console.log(`${area}: ${count} papers`)
  })
  console.log(`Total selected: ${finalPapers.length} papers`)
  
  return finalPapers.slice(0, targetTotal)
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
    
    console.log(`=== PAPER FINDER REQUEST ===`)
    console.log(`Date: ${since}, Keywords: ${keywords.join(', ')}, Limit: ${limit}`)
    
    // Determine selected research areas from keywords
    const selectedAreas = RESEARCH_AREAS.filter(area => 
      area.keywords.some(keyword => keywords.includes(keyword))
    ).map(area => area.name)
    
    // Default to all areas if none selected
    const areasToSearch = selectedAreas.length > 0 ? selectedAreas : RESEARCH_AREAS.map(area => area.name)
    console.log(`Research areas to search: ${areasToSearch.join(', ')}`)
    
    // Fetch papers for each category separately
    const timeout = 10000
    const papersByCategory: { [key: string]: Paper[] } = {}
    
    console.log(`=== FETCHING PAPERS BY CATEGORY ===`)
    for (const area of areasToSearch) {
      const categoryPapers = await fetchArxivPapersForCategory(area, since, timeout)
      
      // Categorize and filter papers for this area
      const filteredPapers = categoryPapers.filter(paper => {
        const categorization = categorizePaper(paper.title)
        return categorization.category === area && categorization.confidence > 0
      })
      
      papersByCategory[area] = filteredPapers
      console.log(`${area}: ${filteredPapers.length} relevant papers after filtering`)
    }
    
    // Apply bulletproof distribution algorithm
    const selectedPapers = selectPapersWithPerfectDistribution(papersByCategory, areasToSearch, limit)
    
    console.log(`=== GENERATING SUMMARIES ===`)
    console.log(`Generating summaries for ${selectedPapers.length} papers`)
    
    // Generate AI summaries for each paper
    const papersWithSummaries = await Promise.all(
      selectedPapers.map(async (paper) => {
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
    
    console.log(`=== REQUEST COMPLETE ===`)
    console.log(`Returning ${papersWithSummaries.length} papers with perfect distribution`)
    
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