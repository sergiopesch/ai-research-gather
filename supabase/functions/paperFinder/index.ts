import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"

import { RequestSchema, type RequestData, type Paper, type PaperResponse } from './types.ts'
import { RESEARCH_AREAS } from './research-areas.ts'
import { fetchArxivPapersForCategory } from './arxiv.ts'
import { categorizePaper } from './categorization.ts'
import { selectPapersWithAbsolutePerfectDistribution } from './distribution.ts'
import { generatePaperSummary } from './openai.ts'

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