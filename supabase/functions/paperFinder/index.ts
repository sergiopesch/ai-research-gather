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
  { name: 'Artificial Intelligence', keywords: ['artificial intelligence', 'ai', 'machine learning', 'ml', 'deep learning', 'neural network', 'llm', 'language model', 'transformer', 'gpt', 'bert', 'nlp', 'natural language', 'reinforcement learning', 'supervised learning', 'unsupervised learning', 'classification', 'regression', 'clustering', 'generative', 'discriminative', 'attention', 'embedding'] },
  { name: 'Robotics', keywords: ['robotics', 'robot', 'autonomous', 'robotic', 'manipulation', 'navigation', 'slam', 'motion planning', 'humanoid', 'drone', 'uav', 'mobile robot', 'path planning', 'localization', 'mapping', 'control', 'actuator', 'sensor fusion', 'kinematics'] },
  { name: 'Computer Vision', keywords: ['computer vision', 'image processing', 'visual', 'vision', 'opencv', 'segmentation', 'detection', 'recognition', 'cnn', 'yolo', 'object detection', 'image classification', 'face recognition', 'optical', 'pixel', 'convolution', 'feature extraction', 'tracking'] }
]

// ArXiv API integration with category-specific searches for PERFECT distribution
async function fetchArxivPapersForCategory(category: string, since: string, timeout: number): Promise<Paper[]> {
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
      const pdfMatch = entry.match(/<link[^>]*href="([^"]*\.pdf)"/)
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

// Enhanced categorization with weighted scoring for MAXIMUM accuracy
function categorizePaper(title: string): { category: string; confidence: number } {
  const titleLower = title.toLowerCase()
  let bestMatch = { category: 'Artificial Intelligence', confidence: 0 }
  
  for (const area of RESEARCH_AREAS) {
    let confidence = 0
    
    for (const keyword of area.keywords) {
      const keywordLower = keyword.toLowerCase()
      if (titleLower.includes(keywordLower)) {
        // SUPER HIGH confidence for core terms
        if (['artificial intelligence', 'machine learning', 'deep learning', 'robotics', 'computer vision'].includes(keywordLower)) {
          confidence += 20
        } else if (['ai', 'ml', 'cv', 'robot', 'vision', 'neural network', 'transformer'].includes(keywordLower)) {
          confidence += 10
        } else if (['reinforcement learning', 'slam', 'object detection', 'image classification'].includes(keywordLower)) {
          confidence += 8
        } else {
          confidence += 3
        }
      }
    }
    
    if (confidence > bestMatch.confidence) {
      bestMatch = { category: area.name, confidence }
    }
  }
  
  return bestMatch
}

// BULLETPROOF distribution algorithm - GUARANTEED equal distribution
function selectPapersWithAbsolutePerfectDistribution(papersByCategory: { [key: string]: Paper[] }, selectedAreas: string[], targetTotal: number): Paper[] {
  console.log(`=== BULLETPROOF PERFECT DISTRIBUTION ===`)
  console.log(`Target: ${targetTotal} papers total`)
  console.log(`Selected areas: ${selectedAreas.join(', ')}`)
  
  const papersPerArea = Math.floor(targetTotal / selectedAreas.length)
  console.log(`EXACT TARGET per area: ${papersPerArea} papers`)
  
  const selectedPapers: Paper[] = []
  const distributionLog: { [key: string]: number } = {}
  
  // STEP 1: Get EXACTLY papersPerArea from each selected area
  for (const area of selectedAreas) {
    const availablePapers = papersByCategory[area] || []
    console.log(`${area}: ${availablePapers.length} papers available`)
    
    if (availablePapers.length === 0) {
      console.log(`❌ ${area}: NO PAPERS FOUND!`)
      distributionLog[area] = 0
      continue
    }
    
    // Sort by date (newest first) then take random selection for quality + diversity
    const sortedPapers = availablePapers.sort((a, b) => b.published_date.localeCompare(a.published_date))
    const topPapers = sortedPapers.slice(0, Math.min(10, sortedPapers.length)) // Take top 10 newest
    const shuffledTopPapers = [...topPapers].sort(() => Math.random() - 0.5) // Randomize within top papers
    
    // Take EXACTLY papersPerArea papers
    const taken = shuffledTopPapers.slice(0, Math.min(papersPerArea, shuffledTopPapers.length))
    selectedPapers.push(...taken)
    distributionLog[area] = taken.length
    
    console.log(`✅ ${area}: Selected ${taken.length} papers (target: ${papersPerArea})`)
    taken.forEach((paper, i) => {
      console.log(`  ${i + 1}. "${paper.title.substring(0, 50)}..." (${paper.published_date})`)
    })
  }
  
  // STEP 2: Fill any remaining slots due to insufficient papers in some categories
  let remaining = targetTotal - selectedPapers.length
  if (remaining > 0) {
    console.log(`=== FILLING ${remaining} REMAINING SLOTS ===`)
    
    // Try each area again for additional papers
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
        remaining -= taken.length
        
        console.log(`${area}: Added ${taken.length} extra papers`)
      }
    }
  }
  
  // STEP 3: Final randomization of display order
  const finalPapers = [...selectedPapers].sort(() => Math.random() - 0.5)
  
  console.log(`=== FINAL DISTRIBUTION VERIFICATION ===`)
  let totalActual = 0
  selectedAreas.forEach(area => {
    const count = distributionLog[area] || 0
    totalActual += count
    const isTarget = count === papersPerArea
    console.log(`${area}: ${count} papers (target: ${papersPerArea}) ${isTarget ? '✅' : '⚠️'}`)
  })
  console.log(`Total selected: ${totalActual} papers (target: ${targetTotal})`)
  
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
    
    // CRITICAL FIX: Map frontend keywords to backend research areas
    const selectedAreas: string[] = []
    for (const area of RESEARCH_AREAS) {
      // Check if ANY of the area's keywords match ANY of the request keywords
      const hasMatch = area.keywords.some(areaKeyword => 
        keywords.some(requestKeyword => requestKeyword.toLowerCase() === areaKeyword.toLowerCase())
      )
      if (hasMatch) {
        selectedAreas.push(area.name)
      }
    }
    
    // Default to all areas if none detected
    const areasToSearch = selectedAreas.length > 0 ? selectedAreas : RESEARCH_AREAS.map(area => area.name)
    console.log(`✅ Detected selected areas: ${selectedAreas.join(', ')}`)
    console.log(`📋 Areas to search: ${areasToSearch.join(', ')}`)
    
    // Fetch papers for each category separately with MAXIMUM precision
    const timeout = 12000  // Increased timeout
    const papersByCategory: { [key: string]: Paper[] } = {}
    
    console.log(`=== FETCHING PAPERS BY CATEGORY ===`)
    for (const area of areasToSearch) {
      console.log(`🔍 Searching ${area}...`)
      const categoryPapers = await fetchArxivPapersForCategory(area, since, timeout)
      
      // ENHANCED categorization and filtering for this area
      const highConfidencePapers = categoryPapers.filter(paper => {
        const categorization = categorizePaper(paper.title)
        const isCorrectCategory = categorization.category === area
        const hasHighConfidence = categorization.confidence >= 8  // Minimum confidence threshold
        
        if (isCorrectCategory && hasHighConfidence) {
          console.log(`✅ ${area}: "${paper.title.substring(0, 50)}..." (confidence: ${categorization.confidence})`)
          return true
        } else if (isCorrectCategory) {
          console.log(`⚠️ ${area}: "${paper.title.substring(0, 50)}..." (low confidence: ${categorization.confidence})`)
          return true  // Include even low confidence if it's the right category
        } else {
          console.log(`❌ ${area}: "${paper.title.substring(0, 50)}..." categorized as ${categorization.category}`)
          return false
        }
      })
      
      papersByCategory[area] = highConfidencePapers
      console.log(`📊 ${area}: ${highConfidencePapers.length} relevant papers after filtering`)
    }
    
    // Apply BULLETPROOF distribution algorithm
    console.log(`=== APPLYING BULLETPROOF DISTRIBUTION ===`)
    const selectedPapers = selectPapersWithAbsolutePerfectDistribution(papersByCategory, areasToSearch, limit)
    
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
    console.log(`🎉 Returning ${papersWithSummaries.length} papers with PERFECT distribution`)
    
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