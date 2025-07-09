import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Real-time conversation generator using dual AI agents
async function generateRealTimeConversation(paperTitle: string, openAIApiKey: string, controller: ReadableStreamDefaultController) {
  const conversationHistory: Array<{role: string, content: string}> = []
  
  // Dr Ada's personality and context
  const drAdaContext = `You are Dr Ada, a brilliant AI research scientist. You're discussing the paper "${paperTitle}" on a podcast called "The Notebook Pod". 
  Be engaging, technical but accessible, and show genuine enthusiasm for the research. Keep responses conversational and under 150 words.
  You should respond naturally to what Sam says, building on the conversation.`
  
  // Sam's personality and context  
  const samContext = `You are Sam, a curious interviewer on "The Notebook Pod" discussing the paper "${paperTitle}".
  Ask thoughtful follow-up questions, show genuine curiosity, and help make technical concepts accessible to listeners.
  Keep responses conversational and under 100 words. Build naturally on what Dr Ada says.`

  // Initialize conversation
  let currentSpeaker = "Dr Ada"
  let turnCount = 0
  const maxTurns = 10

  // Send start event
  sendSSEEvent(controller, 'start', { 
    paper_title: paperTitle,
    timestamp: new Date().toISOString()
  })

  while (turnCount < maxTurns) {
    try {
      let prompt: string
      let systemContext: string
      
      if (currentSpeaker === "Dr Ada") {
        systemContext = drAdaContext
        if (turnCount === 0) {
          prompt = `Start the podcast by introducing the paper "${paperTitle}" and explaining why it's significant. Be welcoming and set the stage for discussion.`
        } else {
          const lastMessage = conversationHistory[conversationHistory.length - 1]
          prompt = `Respond to Sam's comment: "${lastMessage.content}". Continue the natural flow of conversation about the research.`
        }
      } else {
        systemContext = samContext
        const lastMessage = conversationHistory[conversationHistory.length - 1]
        prompt = `Respond to Dr Ada's explanation: "${lastMessage.content}". Ask a thoughtful follow-up question or comment that will advance the discussion.`
      }

      console.log(`🤖 Generating response for ${currentSpeaker}, turn ${turnCount + 1}`)

      // Call OpenAI with streaming
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini-2025-04-14',
          messages: [
            { role: 'system', content: systemContext },
            { role: 'user', content: prompt }
          ],
          max_tokens: 200,
          temperature: 0.8,
          stream: true,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      // Stream the response in real-time
      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response reader available')

      let fullResponse = ''
      let currentChunk = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.trim() === '') continue
          if (line.includes('[DONE]')) continue
          
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6)
              if (jsonStr.trim() === '[DONE]') continue
              
              const data = JSON.parse(jsonStr)
              const content = data.choices?.[0]?.delta?.content || ''
              
              if (content) {
                fullResponse += content
                currentChunk += content
                
                // Send word-by-word for real-time effect
                if (currentChunk.includes(' ') || content.includes('.') || content.includes('!') || content.includes('?')) {
                  sendSSEEvent(controller, 'dialogue_chunk', {
                    speaker: currentSpeaker,
                    chunk: currentChunk,
                    is_complete: false
                  })
                  currentChunk = ''
                  
                  // Add realistic typing delay
                  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
                }
              }
            } catch (parseError) {
              console.warn('Failed to parse chunk:', parseError)
            }
          }
        }
      }

      // Send final complete message
      if (fullResponse.trim()) {
        sendSSEEvent(controller, 'dialogue', {
          speaker: currentSpeaker,
          text: fullResponse.trim(),
          timestamp: Date.now()
        })

        // Add to conversation history
        conversationHistory.push({
          role: currentSpeaker.toLowerCase().replace(' ', '_'),
          content: fullResponse.trim()
        })

        console.log(`✅ ${currentSpeaker}: ${fullResponse.trim()}`)

        // Switch speakers
        currentSpeaker = currentSpeaker === "Dr Ada" ? "Sam" : "Dr Ada"
        turnCount++

        // Add natural pause between speakers
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000))
      }

    } catch (error) {
      console.error(`❌ Error generating response for ${currentSpeaker}:`, error)
      
      // Send fallback response
      const fallbackMessage = currentSpeaker === "Dr Ada" 
        ? "This research opens up fascinating possibilities for the field."
        : "That's really interesting! Can you tell us more about the implications?"
      
      sendSSEEvent(controller, 'dialogue', {
        speaker: currentSpeaker,
        text: fallbackMessage,
        timestamp: Date.now()
      })
      
      currentSpeaker = currentSpeaker === "Dr Ada" ? "Sam" : "Dr Ada"
      turnCount++
    }
  }

  // End conversation
  sendSSEEvent(controller, 'dialogue', {
    speaker: "Dr Ada",
    text: "Thanks for tuning in to The Notebook Pod! Keep exploring the frontiers of knowledge!",
    timestamp: Date.now()
  })

  sendSSEEvent(controller, 'end', {
    message: 'Conversation completed',
    total_turns: turnCount
  })
}

// Function to send SSE event
function sendSSEEvent(controller: ReadableStreamDefaultController, eventType: string, data: any) {
  try {
    const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`
    controller.enqueue(new TextEncoder().encode(message))
    console.log(`📡 Sent SSE event: ${eventType}`)
  } catch (error) {
    console.error('❌ Failed to send SSE event:', error)
  }
}

serve(async (req: Request): Promise<Response> => {
  console.log(`🚀 Real-time conversation function called: ${req.method} ${req.url}`)
  
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
    const { paper_id } = body

    if (!paper_id) {
      return new Response(JSON.stringify({ error: 'paper_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey || !openAIApiKey) {
      return new Response(JSON.stringify({ error: 'Missing required environment variables' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // Initialize Supabase client
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
      return new Response(JSON.stringify({ 
        error: 'Paper not found or not in SELECTED status',
        paper_id 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    console.log(`✅ Found paper: "${paper.title}"`)

    // Create real-time SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('🎙️ Starting real-time AI conversation...')
          await generateRealTimeConversation(paper.title, openAIApiKey, controller)
          console.log('✅ Real-time conversation completed')
          controller.close()
        } catch (error) {
          console.error('❌ Stream error:', error)
          sendSSEEvent(controller, 'error', {
            message: 'Stream failed',
            error: error.message
          })
          controller.close()
        }
      }
    })

    console.log('📡 Returning real-time SSE response...')
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
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
})