import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"

const RequestSchema = z.object({
  paper_id: z.string().uuid("Invalid paper ID format")
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept, cache-control',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Enhanced OpenAI API call with retry logic
async function callOpenAI(apiKey: string, messages: any[], retryCount = 0): Promise<string> {
  const maxRetries = 2
  const retryDelay = 1000 * Math.pow(2, retryCount)
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages,
        max_tokens: 1500,
        temperature: 0.8,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      if (response.status === 429 && retryCount < maxRetries) {
        console.log(`Rate limited, retrying attempt ${retryCount + 1}`)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        return callOpenAI(apiKey, messages, retryCount + 1)
      }
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
    
  } catch (error) {
    if (retryCount < maxRetries) {
      console.log(`Attempt ${retryCount + 1} failed, retrying:`, error.message)
      await new Promise(resolve => setTimeout(resolve, retryDelay))
      return callOpenAI(apiKey, messages, retryCount + 1)
    }
    throw error
  }
}

// Generate conversation segments for the podcast
async function generateConversationSegments(paperTitle: string, openAIApiKey: string) {
  const segments = []
  const conversationFlow = [
    {
      speaker: "Dr Rowan",
      prompt: `Create a 90-second hook for "${paperTitle}". Start with a vivid image or anecdote, then explain why this research matters. Use concrete metaphors and everyday numbers. Keep it under 120 words and end with a natural hand-off question to Alex.`,
      systemPrompt: `You are Dr Rowan, senior researcher, witty but humble. Your super-power: explaining complex ideas with crisp analogies and mini-stories. Translate every technical claim into everyday scenarios. Use "we", "us", "our" - inclusive language. Keep sentences short, active voice. When you reference numbers, give friendly comparisons. Use labelled turns: "DR ROWAN: <content>" and end with a mic-pass question.`
    },
    {
      speaker: "Alex Hughes", 
      prompt: `Respond to Dr Rowan's hook about "${paperTitle}". Ask the questions someone new to the topic would really ask. Reflect aloud, check understanding, admit curiosity. Keep it under 100 words and bounce back to Rowan.`,
      systemPrompt: `You are Alex Hughes, intellectually curious, representing everyday listeners. Ask real questions beginners would ask. Quote words Dr Rowan used and probe them. Use clarifying questions ("Wait, so is that like...?"). Admit confusion openly, celebrate "aha" moments. Keep jokes tasteful and brief. Use labelled turns: "ALEX: <content>" and end with a bounce-back.`
    },
    {
      speaker: "Dr Rowan",
      prompt: `Explain the problem and method from "${paperTitle}". Break it into back-and-forth chunks, use concrete metaphors, define any jargon in plain English. Anticipate questions and pre-empt confusion. Keep under 120 words, hand off to Alex naturally.`,
      systemPrompt: `You are Dr Rowan, senior researcher, witty but humble. Your super-power: explaining complex ideas with crisp analogies and mini-stories. Translate every technical claim into everyday scenarios. Use "we", "us", "our" - inclusive language. Keep sentences short, active voice. When you reference numbers, give friendly comparisons. Use labelled turns: "DR ROWAN: <content>" and end with a mic-pass question.`
    },
    {
      speaker: "Alex Hughes",
      prompt: `Recap Dr Rowan's explanation in one sentence ("So basically...?"). Ask follow-up questions about the method, probe for clarity. Keep under 80 words and bounce back.`,
      systemPrompt: `You are Alex Hughes, intellectually curious, representing everyday listeners. Ask real questions beginners would ask. Quote words Dr Rowan used and probe them. Use clarifying questions ("Wait, so is that like...?"). Admit confusion openly, celebrate "aha" moments. Keep jokes tasteful and brief. Use labelled turns: "ALEX: <content>" and end with a bounce-back.`
    },
    {
      speaker: "Dr Rowan", 
      prompt: `Explain the results and why they matter from "${paperTitle}". Use tangible examples, mention at least one limitation or open question. Connect to daily life. Under 120 words, natural hand-off.`,
      systemPrompt: `You are Dr Rowan, senior researcher, witty but humble. Your super-power: explaining complex ideas with crisp analogies and mini-stories. Translate every technical claim into everyday scenarios. Use "we", "us", "our" - inclusive language. Keep sentences short, active voice. When you reference numbers, give friendly comparisons. Use labelled turns: "DR ROWAN: <content>" and end with a mic-pass question.`
    },
    {
      speaker: "Alex Hughes",
      prompt: `Rapid-fire Q&A about "${paperTitle}". Ask about real-world impact, bust a myth, or connect to pop culture. Keep energy high, under 80 words.`,
      systemPrompt: `You are Alex Hughes, intellectually curious, representing everyday listeners. Ask real questions beginners would ask. Quote words Dr Rowan used and probe them. Use clarifying questions ("Wait, so is that like...?"). Admit confusion openly, celebrate "aha" moments. Keep jokes tasteful and brief. Use labelled turns: "ALEX: <content>" and end with a bounce-back.`
    },
    {
      speaker: "Dr Rowan",
      prompt: `Provide take-home summary in 3 bullet points for "${paperTitle}". End with one actionable suggestion for listeners. Warm wrap-up under 100 words.`,
      systemPrompt: `You are Dr Rowan, senior researcher, witty but humble. Your super-power: explaining complex ideas with crisp analogies and mini-stories. Translate every technical claim into everyday scenarios. Use "we", "us", "our" - inclusive language. Keep sentences short, active voice. When you reference numbers, give friendly comparisons. Use labelled turns: "DR ROWAN: <content>" and end with a mic-pass question.`
    }
  ]

  for (let i = 0; i < conversationFlow.length; i++) {
    const segment = conversationFlow[i]
    console.log(`Generating segment ${i + 1}: ${segment.speaker}`)
    
    try {
      const text = await callOpenAI(openAIApiKey, [
        {
          role: 'system',
          content: segment.systemPrompt
        },
        { role: 'user', content: segment.prompt }
      ])
      
      segments.push({
        speaker: segment.speaker,
        text: text.trim(),
        duration: Math.floor(text.length / 10) // Rough estimate: 10 chars per second
      })
      
      console.log(`✅ Generated segment ${i + 1}: ${text.substring(0, 50)}...`)
      
    } catch (error) {
      console.error(`Failed to generate segment ${i + 1}:`, error)
      
      // Fallback content
      const fallback = segment.speaker === "Dr Ada" 
        ? `Thank you for joining us on The Notebook Pod. Today we're discussing "${paperTitle}", which presents fascinating insights into cutting-edge research. This work demonstrates innovative approaches that could significantly impact the field.`
        : `That's really interesting, Dr. Ada! Can you tell our listeners more about the practical applications of this research and what makes it particularly groundbreaking?`
      
      segments.push({
        speaker: segment.speaker,
        text: fallback,
        duration: Math.floor(fallback.length / 10)
      })
    }
  }

  return segments
}

serve(async (req: Request): Promise<Response> => {
  console.log(`🎙️ Script Generation Function: ${req.method} ${req.url}`)
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }
  
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }

  try {
    const body = await req.json()
    const { paper_id } = RequestSchema.parse(body)
    
    console.log('📝 Generating script for paper:', paper_id)

    // Environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    if (!openAIApiKey) {
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to Supabase Edge Functions environment variables.' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // Get paper from database
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: paper, error: fetchError } = await supabase
      .from('papers')
      .select('id, title, source')
      .eq('id', paper_id)
      .eq('status', 'SELECTED')
      .maybeSingle()

    if (fetchError) {
      console.error('Database error:', fetchError)
      throw new Error('Database error')
    }

    if (!paper) {
      return new Response(JSON.stringify({ 
        error: 'Paper not found or not in SELECTED status. Please select a paper first.' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    console.log(`✅ Generating script for: "${paper.title}"`)

    // Generate conversation segments
    const segments = await generateConversationSegments(paper.title, openAIApiKey)
    
    // Calculate total duration
    const totalSeconds = segments.reduce((sum, segment) => sum + (segment.duration || 0), 0)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const totalDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`

    const script = {
      id: paper_id,
      title: `The Notebook Pod: ${paper.title}`,
      segments,
      totalDuration,
      createdAt: new Date().toISOString(),
      paperSource: paper.source
    }

    console.log(`✅ Script generated successfully: ${segments.length} segments, ${totalDuration} estimated duration`)

    return new Response(JSON.stringify(script), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    })

  } catch (error) {
    console.error('Script generation error:', error)
    
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ 
        error: 'Invalid input', 
        details: error.errors 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
})