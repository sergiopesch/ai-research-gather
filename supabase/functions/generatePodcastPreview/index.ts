import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Function to send SSE event
function sendSSEEvent(controller: ReadableStreamDefaultController, eventType: string, data: any) {
  try {
    const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`
    controller.enqueue(new TextEncoder().encode(message))
    console.log(`✅ Sent SSE event: ${eventType}`)
  } catch (error) {
    console.error('❌ Failed to send SSE event:', error)
  }
}

serve(async (req: Request): Promise<Response> => {
  console.log(`🚀 Function called: ${req.method} ${req.url}`)
  console.log(`📅 Timestamp: ${new Date().toISOString()}`)
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled')
    return new Response(null, { status: 200, headers: corsHeaders })
  }
  
  if (req.method !== 'POST') {
    console.log('❌ Invalid method:', req.method)
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }

  try {
    console.log('🔍 Parsing request body...')
    let body;
    try {
      body = await req.json()
      console.log('📦 Request body received:', JSON.stringify(body))
    } catch (parseError) {
      console.error('❌ Failed to parse JSON:', parseError)
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // Validate required fields
    if (!body.paper_id) {
      console.error('❌ Missing paper_id')
      return new Response(JSON.stringify({ error: 'paper_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    const { paper_id, episode = 1, duration = 10 } = body

    console.log(`🎯 Processing: paper_id=${paper_id}, episode=${episode}, duration=${duration}`)

    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    
    console.log('🔑 Environment check:')
    console.log(`  - Supabase URL: ${supabaseUrl ? '✅ SET' : '❌ MISSING'}`)
    console.log(`  - Supabase Service Key: ${supabaseServiceKey ? '✅ SET' : '❌ MISSING'}`)
    console.log(`  - OpenAI API Key: ${openAIApiKey ? '✅ SET' : '❌ MISSING'}`)
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase credentials')
      return new Response(JSON.stringify({ error: 'Supabase credentials not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    if (!openAIApiKey) {
      console.error('❌ Missing OpenAI API key')
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // Initialize Supabase client
    console.log('🔌 Connecting to Supabase...')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch paper
    console.log('🔍 Fetching paper from database...')
    const { data: paper, error: fetchError } = await supabase
      .from('papers')
      .select('title, source')
      .eq('id', paper_id)
      .eq('status', 'SELECTED')
      .maybeSingle()

    if (fetchError) {
      console.error('❌ Database error:', fetchError)
      return new Response(JSON.stringify({ 
        error: 'Database error',
        details: fetchError.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    if (!paper) {
      console.error('❌ Paper not found or not selected')
      return new Response(JSON.stringify({ 
        error: 'Paper not found or not in SELECTED status',
        paper_id 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    console.log(`✅ Found paper: "${paper.title}"`)

    // Create SSE stream with immediate test content
    console.log('🚀 Creating SSE stream...')
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('📡 SSE stream started')
          
          // Send immediate start event
          sendSSEEvent(controller, 'start', { 
            paper_id,
            episode,
            title: paper.title,
            timestamp: new Date().toISOString()
          })
          
          // Send immediate test dialogue
          await new Promise(resolve => setTimeout(resolve, 500))
          sendSSEEvent(controller, 'dialogue', {
            speaker: "Dr Ada",
            text: `Welcome to The Notebook Pod, Episode ${episode}! Today we're exploring "${paper.title}".`
          })
          
          await new Promise(resolve => setTimeout(resolve, 2000))
          sendSSEEvent(controller, 'dialogue', {
            speaker: "Sam",
            text: "Thanks for the introduction! What makes this research particularly interesting?"
          })
          
          await new Promise(resolve => setTimeout(resolve, 2000))
          sendSSEEvent(controller, 'dialogue', {
            speaker: "Dr Ada",
            text: "This work addresses key challenges in the field and introduces innovative approaches."
          })
          
          await new Promise(resolve => setTimeout(resolve, 2000))
          sendSSEEvent(controller, 'dialogue', {
            speaker: "Sam",
            text: "That's fascinating! Can you elaborate on the practical applications?"
          })
          
          await new Promise(resolve => setTimeout(resolve, 2000))
          sendSSEEvent(controller, 'dialogue', {
            speaker: "Dr Ada",
            text: "The applications are wide-ranging and could significantly impact the field."
          })
          
          await new Promise(resolve => setTimeout(resolve, 1000))
          sendSSEEvent(controller, 'end', {
            message: 'Thanks for tuning in to The Notebook Pod! Stay curious!'
          })
          
          console.log('✅ SSE stream completed successfully')
          controller.close()
          
        } catch (streamError) {
          console.error('❌ Stream error:', streamError)
          try {
            sendSSEEvent(controller, 'error', {
              message: 'Stream failed',
              error: streamError.message
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
    console.error('❌ Error stack:', error.stack)
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
})