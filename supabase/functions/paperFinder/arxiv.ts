import type { Paper } from './types.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept, cache-control',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ArXiv API integration with category-specific searches
export async function fetchArxivPapersForCategory(category: string, since: string, timeout: number): Promise<Paper[]> {
  const baseUrl = Deno.env.get('ARXIV_BASE_URL') || 'http://export.arxiv.org/api/query'
  
  // ULTRA-SPECIFIC category queries for maximum precision
  const categoryQueries: Record<string, string> = {
    'Artificial Intelligence': '(cat:cs.AI OR cat:cs.LG OR cat:cs.CL) AND (all:"artificial intelligence" OR all:"machine learning" OR all:"deep learning" OR all:"neural network" OR all:"transformer" OR all:"language model" OR all:"reinforcement learning")',
    'Robotics': '(cat:cs.RO OR cat:cs.SY) AND (all:"robotics" OR all:"robot" OR all:"autonomous" OR all:"manipulation" OR all:"navigation" OR all:"slam" OR all:"motion planning" OR all:"humanoid")',
    'Computer Vision': '(cat:cs.CV) AND (all:"computer vision" OR all:"image processing" OR all:"vision" OR all:"segmentation" OR all:"detection" OR all:"recognition" OR all:"object detection" OR all:"image classification")'
  }
  
  const searchQuery = categoryQueries[category] || categoryQueries['Artificial Intelligence']
  
  const params = new URLSearchParams({
    search_query: searchQuery,
    start: '0',
    max_results: '150',  // Higher to ensure we get enough per category
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
    console.log(`Found ${entries.length} raw entries for ${category}`)
    
    for (const entry of entries) {
      const titleMatch = entry.match(/<title>(.*?)<\/title>/s)
      const publishedMatch = entry.match(/<published>(.*?)<\/published>/)
      const idMatch = entry.match(/<id>(.*?)<\/id>/)
      const authorMatches = entry.match(/<author>[\s\S]*?<name>(.*?)<\/name>[\s\S]*?<\/author>/g)
      
      if (titleMatch && publishedMatch && idMatch) {
        const publishedDate = publishedMatch[1].split('T')[0]
        
        // MUCH MORE LENIENT date filtering - get papers from last 90 days
        const paperDate = new Date(publishedDate)
        const sinceDate = new Date(since)
        const daysDiff = Math.floor((sinceDate.getTime() - paperDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysDiff <= 90) {
          const arxivId = idMatch[1].split('/').pop()?.split('v')[0]
          
          // Extract authors with CORRECTED regex
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
    
    console.log(`${category}: Collected ${papers.length} total papers`)
    return papers
  } catch (error) {
    console.warn(`${category} ArXiv fetch error:`, error.message)
    return []
  } finally {
    clearTimeout(timeoutId)
  }
}