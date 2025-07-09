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

// Function to send SSE event
function sendSSEEvent(controller: ReadableStreamDefaultController, eventType: string, data: any) {
  const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`
  controller.enqueue(new TextEncoder().encode(message))
}

// Function to call OpenAI for a single response
async function callOpenAIForResponse(
  apiKey: string,
  messages: any[],
  model: string = "gpt-4o",
  maxRetries: number = 2
): Promise<string> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout for faster responses
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 150 // Shorter responses for natural dialogue
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.status === 429 && attempt < maxRetries) {
        console.log(`Rate limited, retrying attempt ${attempt + 1}`)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        continue
      }
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      return data.choices[0].message.content.trim()
      
    } catch (error) {
      if (attempt === maxRetries) {
        throw error
      }
      console.log(`Attempt ${attempt + 1} failed, retrying:`, error.message)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }
  
  throw new Error('Max retries exceeded')
}

// Function to manage live conversation between two LLMs
async function generateLiveConversation(
  title: string,
  authors: string[],
  episode: number,
  apiKey: string,
  controller: ReadableStreamDefaultController
) {
  const authorsText = authors.length > 0 ? authors.join(", ") : "the authors"
  
  // Initialize conversation history
  const conversationHistory: any[] = []
  
  // Dr Ada (GPT-4O) system prompt
  const drAdaSystemPrompt = `You are Dr Ada, co-host of "The Notebook Pod". You're a technical expert who explains complex research clearly. 

Rules:
- Keep responses under 25 words
- Be knowledgeable but accessible
- Engage naturally with Sam
- Focus on the key technical insights
- Don't repeat information already discussed
- End responses naturally without asking questions every time

Current paper: "${title}" by ${authorsText}`

  // Sam (GPT-4O mini) system prompt  
  const samSystemPrompt = `You are Sam, co-host of "The Notebook Pod". You're deeply curious and ask great clarifying questions that help the audience understand.

Rules:
- Keep responses under 25 words
- Ask insightful questions
- Show genuine curiosity
- Help bridge technical concepts for general audience
- Don't repeat questions already asked
- React naturally to Dr Ada's explanations

Current paper: "${title}" by ${authorsText}`

  try {
    // Start with Dr Ada's welcome
    const welcomeMessage = `Welcome to The Notebook Pod, Episode ${episode}! Today we're exploring "${title}" by ${authorsText}.`
    
    console.log('📺 LIVE: Dr Ada speaking...')
    sendSSEEvent(controller, 'dialogue', {
      speaker: "Dr Ada",
      text: welcomeMessage
    })
    
    conversationHistory.push({ role: "assistant", content: welcomeMessage })
    
    // Real delay before starting the conversation
    console.log('⏱️ LIVE: Waiting 3 seconds before Sam responds...')
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Continue conversation for live streaming (4-5 exchanges)
    for (let turn = 0; turn < 4; turn++) {
      console.log(`🔄 LIVE: Starting turn ${turn + 1}`)
      
      // Sam's turn (GPT-4O mini)
      console.log('🎯 LIVE: Sam is thinking...')
      const samMessages = [
        { role: "system", content: samSystemPrompt },
        ...conversationHistory.map(msg => ({
          role: msg.role === "assistant" ? "user" : "assistant",
          content: msg.content
        }))
      ]
      
      const samResponse = await callOpenAIForResponse(apiKey, samMessages, "gpt-4o-mini")
      
      console.log(`🗣️ LIVE: Sam says: "${samResponse}"`)
      sendSSEEvent(controller, 'dialogue', {
        speaker: "Sam",
        text: samResponse
      })
      
      conversationHistory.push({ role: "user", content: samResponse })
      
      // Real delay for natural pacing
      console.log('⏱️ LIVE: Waiting 4 seconds for natural pacing...')
      await new Promise(resolve => setTimeout(resolve, 4000))
      
      // Dr Ada's turn (GPT-4O) - but not on the last iteration
      if (turn < 3) {
        console.log('🎯 LIVE: Dr Ada is thinking...')
        const drAdaMessages = [
          { role: "system", content: drAdaSystemPrompt },
          ...conversationHistory
        ]
        
        const drAdaResponse = await callOpenAIForResponse(apiKey, drAdaMessages, "gpt-4o")
        
        console.log(`👩‍⚕️ LIVE: Dr Ada says: "${drAdaResponse}"`)
        sendSSEEvent(controller, 'dialogue', {
          speaker: "Dr Ada", 
          text: drAdaResponse
        })
        
        conversationHistory.push({ role: "assistant", content: drAdaResponse })
        
        // Real delay for natural pacing
        console.log('⏱️ LIVE: Waiting 4 seconds for natural pacing...')
        await new Promise(resolve => setTimeout(resolve, 4000))
      }
    }
    
    // End the conversation
    console.log('🏁 LIVE: Conversation ending...')
    sendSSEEvent(controller, 'end', {
      message: 'Thanks for tuning in to The Notebook Pod! Stay curious!'
    })
    
  } catch (error) {
    console.error('❌ LIVE: Error in conversation:', error)
    sendSSEEvent(controller, 'error', {
      message: 'Live conversation encountered an error',
      error: error.message
    })
  }
}

serve(async (req: Request): Promise<Response> => {
  console.log(`📨 Request received: ${req.method} ${req.url}`)
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight')
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }
  
  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method)
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders,
      }
    })
  }

  try {
    console.log('🔍 Parsing request body...')
    const body = await req.json()
    console.log('📦 Request body:', body)
    
    const { paper_id, episode, duration } = RequestSchema.parse(body)
    
    console.log(`=== GENERATE LIVE PODCAST CONVERSATION ===`)
    console.log(`Paper ID: ${paper_id}, Episode: ${episode}, Duration: ${duration}s`)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!
    
    console.log('🔑 Checking environment variables...')
    console.log('Supabase URL:', supabaseUrl ? 'SET' : 'MISSING')
    console.log('Supabase Service Key:', supabaseServiceKey ? 'SET' : 'MISSING')
    console.log('OpenAI API Key:', openAIApiKey ? 'SET' : 'MISSING')
    
    if (!openAIApiKey) {
      console.error('❌ OpenAI API key not configured')
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🔍 Fetching paper from database...')
    // Fetch paper with SELECTED status
    const { data: paper, error: fetchError } = await supabase
      .from('papers')
      .select('title, source')
      .eq('id', paper_id)
      .eq('status', 'SELECTED')
      .single()

    if (fetchError || !paper) {
      console.error('❌ Paper not found or not selected:', fetchError)
      return new Response(JSON.stringify({ 
        error: 'Paper not found or not in SELECTED status',
        paper_id 
      }), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      })
    }

    console.log(`✅ Paper found: "${paper.title}"`)

    // Extract authors from title or use source as fallback
    const authors = paper.source ? [paper.source] : ['the researchers']

    console.log('🚀 Starting SSE stream...')
    // Return SSE stream for live conversation with immediate response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('📡 SSE stream started')
          
          // Send conversation start event immediately
          console.log('📤 Sending start event...')
          sendSSEEvent(controller, 'start', { 
            paper_id,
            episode,
            title: paper.title
          })
          
          // Small delay to ensure client receives start event
          await new Promise(resolve => setTimeout(resolve, 200))
          
          console.log('🎙️ Starting live conversation generation...')
          // Generate live conversation with immediate streaming
          await generateLiveConversation(
            paper.title,
            authors,
            episode,
            openAIApiKey,
            controller
          )
          
          console.log('✅ Live conversation stream completed successfully')
          // Close stream
          controller.close()
        } catch (error) {
          console.error('❌ Stream error:', error)
          try {
            sendSSEEvent(controller, 'error', {
              message: error instanceof Error ? error.message : 'Unknown stream error'
            })
          } catch (sendError) {
            console.error('❌ Failed to send error event:', sendError)
          }
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
        'X-Accel-Buffering': 'no', // Disable nginx buffering for immediate streaming
        ...corsHeaders,
      }
    })
    
  } catch (error) {
    console.error('❌ GeneratePodcastPreview error:', error)
    
    if (error instanceof z.ZodError) {
      console.error('❌ Validation error:', error.errors)
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
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders,
      }
    })
  }
})