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
      speaker: "Dr Ada",
      prompt: `You are Dr. Ada, a brilliant research scientist hosting The Notebook Pod. Create an engaging 2-3 minute introduction to the research paper "${paperTitle}". Explain what makes this research exciting and why listeners should care. Be enthusiastic but clear, and set up the conversation for your co-host Sam to ask follow-up questions. Keep it conversational and under 200 words.`
    },
    {
      speaker: "Sam", 
      prompt: `You are Sam, a curious podcast interviewer. Dr. Ada just introduced the paper "${paperTitle}". Ask 2-3 thoughtful follow-up questions about the methodology, practical applications, or implications that would help listeners understand the research better. Be genuinely curious and represent the audience's perspective. Keep it under 150 words.`
    },
    {
      speaker: "Dr Ada",
      prompt: `You are Dr. Ada. Sam just asked some great questions about "${paperTitle}". Provide detailed but accessible answers about the research methodology, technical innovations, and what makes this work stand out in the field. Share your expert insights while keeping it engaging for a general audience. 250-300 words.`
    },
    {
      speaker: "Sam",
      prompt: `You are Sam. Continue the conversation about "${paperTitle}" by asking about real-world applications, potential limitations, and future directions. What should listeners know about how this research might impact their lives or the broader field? Keep the questions engaging and accessible. Under 100 words.`
    },
    {
      speaker: "Dr Ada", 
      prompt: `You are Dr. Ada. Discuss the practical implications and future directions of "${paperTitle}". What are the next steps for this research? How might it influence the field? Share your perspective on the broader significance while remaining accessible to general audiences. 200-250 words.`
    },
    {
      speaker: "Sam",
      prompt: `You are Sam. Wrap up the conversation about "${paperTitle}" with closing thoughts and thanks to Dr. Ada. Summarize key takeaways for listeners and tease future episodes. Keep it warm, appreciative, and under 100 words.`
    }
  ]

  for (let i = 0; i < conversationFlow.length; i++) {
    const segment = conversationFlow[i]
    console.log(`Generating segment ${i + 1}: ${segment.speaker}`)
    
    try {
      const text = await callOpenAI(openAIApiKey, [
        {
          role: 'system',
          content: segment.speaker === "Dr Ada" 
            ? "You are Dr Ada, a brilliant research scientist. Speak naturally about research with enthusiasm and technical insight. Keep responses conversational and engaging."
            : "You are Sam, a curious podcast interviewer. Ask engaging questions and help make technical concepts accessible. Show genuine interest and represent the audience."
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