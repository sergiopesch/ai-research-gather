import type { Paper } from './types.ts'

// ArXiv API integration with category-specific searches
export async function fetchArxivPapersForCategory(category: string, since: string, timeout: number): Promise<Paper[]> {
  const baseUrl = Deno.env.get('ARXIV_BASE_URL') || 'http://export.arxiv.org/api/query'

  // Category queries for the 3 research areas
  const categoryQueries: Record<string, string> = {
    'Robotics': '(cat:cs.RO OR cat:cs.SY) AND (all:"robotics" OR all:"robot" OR all:"autonomous" OR all:"manipulation" OR all:"navigation" OR all:"slam" OR all:"motion planning" OR all:"humanoid")',

    'Computer Vision': '(cat:cs.CV) AND (all:"computer vision" OR all:"image" OR all:"visual" OR all:"segmentation" OR all:"detection" OR all:"recognition" OR all:"object detection")',

    'Large Language Models': '(cat:cs.CL OR cat:cs.AI OR cat:cs.LG) AND (all:"large language model" OR all:"llm" OR all:"gpt" OR all:"foundation model" OR all:"instruction tuning" OR all:"prompt" OR all:"in-context learning" OR all:"chain of thought")'
  }

  const searchQuery = categoryQueries[category] || categoryQueries['Large Language Models']

  const params = new URLSearchParams({
    search_query: searchQuery,
    start: '0',
    max_results: '150',
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
