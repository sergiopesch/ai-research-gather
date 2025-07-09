import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Send SSE event with proper formatting
function sendSSEEvent(controller: ReadableStreamDefaultController, eventType: string, data: any) {
  try {
    const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`
    controller.enqueue(new TextEncoder().encode(message))
    console.log(`📡 SSE Event: ${eventType}`)
  } catch (error) {
    console.error('❌ SSE Error:', error)
  }
}

// Generate realistic conversation with typing simulation
async function generateRealtimeConversation(paperTitle: string, openAIApiKey: string, controller: ReadableStreamDefaultController) {
  const speakers = ["Dr Ada", "Sam"]
  let currentSpeakerIndex = 0
  const totalExchanges = 8

  // Send conversation start
  sendSSEEvent(controller, 'conversation_start', {
    paper_title: paperTitle,
    speakers: speakers,
    timestamp: Date.now()
  })

  for (let i = 0; i < totalExchanges; i++) {
    const currentSpeaker = speakers[currentSpeakerIndex]
    console.log(`🎙️ Generating response for ${currentSpeaker} (${i + 1}/${totalExchanges})`)

    try {
      // Show typing indicator
      sendSSEEvent(controller, 'typing_start', {
        speaker: currentSpeaker,
        timestamp: Date.now()
      })

      // Realistic typing delay
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000))

      // Generate contextual response
      const prompt = getContextualPrompt(currentSpeaker, i, paperTitle)
      
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
              content: currentSpeaker === "Dr Ada" 
                ? "You are Dr Ada, a brilliant research scientist. Speak naturally about research with enthusiasm and technical insight. Keep responses under 150 words and conversational."
                : "You are Sam, a curious podcast interviewer. Ask engaging follow-up questions and help make technical concepts accessible. Keep responses under 100 words and show genuine interest."
            },
            { role: 'user', content: prompt }
          ],
          max_tokens: 200,
          temperature: 0.8,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ OpenAI API error: ${response.status} - ${errorText}`)
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      const message = data.choices[0].message.content.trim()

      // Stop typing indicator
      sendSSEEvent(controller, 'typing_stop', {
        speaker: currentSpeaker,
        timestamp: Date.now()
      })

      // Send the actual message with realistic delay
      await new Promise(resolve => setTimeout(resolve, 300))
      
      sendSSEEvent(controller, 'message', {
        speaker: currentSpeaker,
        text: message,
        timestamp: Date.now(),
        exchange: i + 1
      })

      console.log(`✅ ${currentSpeaker}: ${message.substring(0, 50)}...`)

      // Switch speakers
      currentSpeakerIndex = (currentSpeakerIndex + 1) % speakers.length

      // Natural pause between speakers
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700))

    } catch (error) {
      console.error(`❌ Error generating for ${currentSpeaker}:`, error)
      
      // Send fallback message
      const fallback = currentSpeaker === "Dr Ada" 
        ? "This research opens up fascinating new possibilities in the field."
        : "That's really interesting! What are the practical implications?"

      sendSSEEvent(controller, 'typing_stop', { speaker: currentSpeaker, timestamp: Date.now() })
      sendSSEEvent(controller, 'message', {
        speaker: currentSpeaker,
        text: fallback,
        timestamp: Date.now(),
        exchange: i + 1
      })

      currentSpeakerIndex = (currentSpeakerIndex + 1) % speakers.length
    }
  }

  // End conversation
  sendSSEEvent(controller, 'conversation_end', {
    message: "Thanks for tuning in to The Notebook Pod!",
    total_exchanges: totalExchanges,
    timestamp: Date.now()
  })
}

function getContextualPrompt(speaker: string, exchangeIndex: number, paperTitle: string): string {
  if (speaker === "Dr Ada") {
    if (exchangeIndex === 0) {
      return `Welcome listeners to The Notebook Pod! Introduce the paper "${paperTitle}" with enthusiasm and explain why this research caught your attention.`
    } else {
      return `Continue discussing "${paperTitle}". Share technical insights, methodologies, or implications that would interest our audience.`
    }
  } else {
    if (exchangeIndex === 1) {
      return `Ask Dr Ada a thoughtful follow-up question about the paper "${paperTitle}" that will help listeners understand the research better.`
    } else {
      return `Ask an engaging question about the practical applications, limitations, or future directions of this research.`
    }
  }
}

serve(async (req: Request): Promise<Response> => {
    console.log(`🚀 Real-time Podcast Function: ${req.method} ${req.url}`)
  
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
    console.log('📝 Parsing request body...')
    const body = await req.json()
    console.log('📝 Request body:', body)
    const { paper_id } = body

    if (!paper_id) {
      console.error('❌ No paper_id provided')
      return new Response(JSON.stringify({ error: 'paper_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    console.log('📝 Looking up paper:', paper_id)

    // Environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables')
      return new Response(JSON.stringify({ error: 'Missing Supabase configuration' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    if (!openAIApiKey) {
      console.error('❌ Missing OpenAI API key')
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to Supabase secrets.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // Get paper from database
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: paper, error: fetchError } = await supabase
      .from('papers')
      .select('title, source')
      .eq('id', paper_id)
      .eq('status', 'SELECTED')
      .maybeSingle()

    if (fetchError) {
      console.error('❌ Database error:', fetchError)
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    if (!paper) {
      return new Response(JSON.stringify({ error: 'Paper not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    console.log(`✅ Starting conversation about: "${paper.title}"`)

    // Create SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await generateRealtimeConversation(paper.title, openAIApiKey, controller)
          controller.close()
        } catch (error) {
          console.error('❌ Stream error:', error)
          sendSSEEvent(controller, 'error', { message: error.message })
          controller.close()
        }
      }
    })

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
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
})