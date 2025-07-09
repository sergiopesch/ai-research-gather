import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"

const RequestSchema = z.object({
  paper_id: z.string().uuid("Invalid paper ID format"),
  episode: z.number().int().min(1).optional().default(1),
  duration: z.number().int().min(5).max(30).optional().default(10)
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Function to send SSE event with immediate flush
function sendSSEEvent(controller: ReadableStreamDefaultController, eventType: string, data: any) {
  try {
    const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`
    controller.enqueue(new TextEncoder().encode(message))
    console.log(`📤 Sent SSE event: ${eventType}`)
  } catch (error) {
    console.error('❌ Failed to send SSE event:', error)
  }
}

// Simplified OpenAI call with aggressive timeout
async function callOpenAI(
  apiKey: string,
  messages: any[],
  model: string = "gpt-4o-mini"
): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8000) // 8s timeout
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.8,
        max_tokens: 80 // Very short responses for speed
      }),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`OpenAI error: ${response.status}`)
    }
    
    const data = await response.json()
    return data.choices[0].message.content.trim()
    
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

// Live conversation with immediate streaming
async function startLiveConversation(
  title: string,
  episode: number,
  apiKey: string,
  controller: ReadableStreamDefaultController
) {
  console.log('🎙️ Starting live conversation...')
  
  try {
    // Dr Ada welcome - IMMEDIATE
    const welcome = `Welcome to The Notebook Pod, Episode ${episode}! Today we're exploring "${title}".`
    sendSSEEvent(controller, 'dialogue', {
      speaker: "Dr Ada",
      text: welcome
    })
    
    // Sam's first question - FAST
    await new Promise(resolve => setTimeout(resolve, 1000))
    const samQuestion = await callOpenAI(apiKey, [
      {
        role: "system",
        content: "You are Sam, a curious podcast host. Ask ONE short question about this research paper. Keep it under 15 words."
      },
      {
        role: "user", 
        content: `Ask about this paper: "${title}"`
      }
    ], "gpt-4o-mini")
    
    sendSSEEvent(controller, 'dialogue', {
      speaker: "Sam",
      text: samQuestion
    })
    
    // Dr Ada's response - FAST
    await new Promise(resolve => setTimeout(resolve, 1200))
    const adaResponse = await callOpenAI(apiKey, [
      {
        role: "system",
        content: "You are Dr Ada, a technical expert. Give ONE short answer about this research. Keep it under 20 words."
      },
      {
        role: "user",
        content: `Explain briefly: "${title}". Sam asked: "${samQuestion}"`
      }
    ], "gpt-4o")
    
    sendSSEEvent(controller, 'dialogue', {
      speaker: "Dr Ada",
      text: adaResponse
    })
    
    // Sam follow-up - FAST
    await new Promise(resolve => setTimeout(resolve, 1200))
    const samFollowup = await callOpenAI(apiKey, [
      {
        role: "system",
        content: "You are Sam. Ask ONE short follow-up question. Keep it under 15 words."
      },
      {
        role: "user",
        content: `Dr Ada said: "${adaResponse}". Ask a follow-up about "${title}"`
      }
    ], "gpt-4o-mini")
    
    sendSSEEvent(controller, 'dialogue', {
      speaker: "Sam",
      text: samFollowup
    })
    
    // Final Dr Ada response - FAST
    await new Promise(resolve => setTimeout(resolve, 1200))
    const adaFinal = await callOpenAI(apiKey, [
      {
        role: "system",
        content: "You are Dr Ada. Give ONE final short insight. Keep it under 20 words."
      },
      {
        role: "user",
        content: `Sam asked: "${samFollowup}". Give final thoughts on "${title}"`
      }
    ], "gpt-4o")
    
    sendSSEEvent(controller, 'dialogue', {
      speaker: "Dr Ada",
      text: adaFinal
    })
    
    // Outro
    await new Promise(resolve => setTimeout(resolve, 1000))
    sendSSEEvent(controller, 'end', {
      message: 'Thanks for tuning in to The Notebook Pod! Stay curious!'
    })
    
    console.log('✅ Live conversation completed successfully')
    
  } catch (error) {
    console.error('❌ Conversation error:', error)
    sendSSEEvent(controller, 'error', {
      message: 'Live conversation encountered an error'
    })
  }
}

serve(async (req: Request): Promise<Response> => {
  console.log(`📨 ${req.method} ${req.url}`)
  
  // CORS preflight
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
    // Parse and validate request
    const body = await req.json()
    const { paper_id, episode, duration } = RequestSchema.parse(body)
    
    console.log(`🎯 Live conversation request: ${paper_id}`)

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!
    
    if (!openAIApiKey) {
      console.error('❌ Missing OpenAI API key')
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }
    
    // Initialize Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch paper quickly
    const { data: paper, error: fetchError } = await supabase
      .from('papers')
      .select('title, source')
      .eq('id', paper_id)
      .eq('status', 'SELECTED')
      .maybeSingle()

    if (fetchError || !paper) {
      console.error('❌ Paper not found:', fetchError)
      return new Response(JSON.stringify({ 
        error: 'Paper not found or not selected',
        paper_id 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    console.log(`✅ Found paper: "${paper.title}"`)

    // Create SSE stream with immediate response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('🚀 SSE stream starting...')
          
          // IMMEDIATE start event
          sendSSEEvent(controller, 'start', { 
            paper_id,
            episode,
            title: paper.title
          })
          
          // Start live conversation
          await startLiveConversation(
            paper.title,
            episode,
            openAIApiKey,
            controller
          )
          
          controller.close()
          
        } catch (error) {
          console.error('❌ Stream error:', error)
          try {
            sendSSEEvent(controller, 'error', {
              message: 'Stream failed: ' + (error instanceof Error ? error.message : 'Unknown error')
            })
          } catch {}
          controller.close()
        }
      }
    })

    console.log('📡 Returning SSE response...')
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        ...corsHeaders,
      }
    })
    
  } catch (error) {
    console.error('❌ Function error:', error)
    
    const errorResponse = {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }
    
    if (error instanceof z.ZodError) {
      errorResponse.error = 'Invalid input'
      errorResponse.message = error.errors[0]?.message || 'Validation failed'
    }
    
    return new Response(JSON.stringify(errorResponse), {
      status: error instanceof z.ZodError ? 400 : 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
})