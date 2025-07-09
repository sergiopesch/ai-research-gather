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

  // Start with Dr Ada's welcome
  const welcomeMessage = `Welcome to The Notebook Pod, Episode ${episode}! Today we're exploring "${title}" by ${authorsText}.`
  
  sendSSEEvent(controller, 'dialogue', {
    speaker: "Dr Ada",
    text: welcomeMessage
  })
  
  conversationHistory.push({ role: "assistant", content: welcomeMessage })
  
  // Small delay before starting the conversation
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Continue conversation for about 10 seconds (4-5 exchanges)
  for (let turn = 0; turn < 4; turn++) {
    try {
      // Sam's turn (GPT-4O mini)
      const samMessages = [
        { role: "system", content: samSystemPrompt },
        ...conversationHistory.map(msg => ({
          role: msg.role === "assistant" ? "user" : "assistant",
          content: msg.content
        }))
      ]
      
      const samResponse = await callOpenAIForResponse(apiKey, samMessages, "gpt-4o-mini")
      
      sendSSEEvent(controller, 'dialogue', {
        speaker: "Sam",
        text: samResponse
      })
      
      conversationHistory.push({ role: "user", content: samResponse })
      
      // Small delay for natural pacing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Dr Ada's turn (GPT-4O) - but not on the last iteration
      if (turn < 3) {
        const drAdaMessages = [
          { role: "system", content: drAdaSystemPrompt },
          ...conversationHistory
        ]
        
        const drAdaResponse = await callOpenAIForResponse(apiKey, drAdaMessages, "gpt-4o")
        
        sendSSEEvent(controller, 'dialogue', {
          speaker: "Dr Ada", 
          text: drAdaResponse
        })
        
        conversationHistory.push({ role: "assistant", content: drAdaResponse })
        
        // Small delay for natural pacing
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
      
    } catch (error) {
      console.error(`Error in conversation turn ${turn}:`, error)
      sendSSEEvent(controller, 'error', {
        message: 'Conversation encountered an error',
        turn
      })
      break
    }
  }
  
  // End the conversation
  sendSSEEvent(controller, 'end', {
    message: 'Thanks for tuning in to The Notebook Pod! Stay curious!'
  })
}

serve(async (req: Request): Promise<Response> => {
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
    const { paper_id, episode, duration } = RequestSchema.parse(body)
    
    console.log(`=== GENERATE LIVE PODCAST CONVERSATION ===`)
    console.log(`Paper ID: ${paper_id}, Episode: ${episode}, Duration: ${duration}s`)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch paper with SELECTED status
    const { data: paper, error: fetchError } = await supabase
      .from('papers')
      .select('title, source')
      .eq('id', paper_id)
      .eq('status', 'SELECTED')
      .single()

    if (fetchError || !paper) {
      console.error('Paper not found or not selected:', fetchError)
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

    console.log(`Starting live conversation for: "${paper.title}"`)

    // Extract authors from title or use source as fallback
    const authors = paper.source ? [paper.source] : ['the researchers']

    // Always return SSE stream for live conversation
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send conversation start event
          sendSSEEvent(controller, 'start', { 
            paper_id,
            episode,
            title: paper.title
          })
          
          // Generate live conversation
          await generateLiveConversation(
            paper.title,
            authors,
            episode,
            openAIApiKey,
            controller
          )
          
          // Close stream
          controller.close()
        } catch (error) {
          console.error('Stream error:', error)
          sendSSEEvent(controller, 'error', {
            message: error instanceof Error ? error.message : 'Unknown error'
          })
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...corsHeaders,
      }
    })
    
  } catch (error) {
    console.error('GeneratePodcastPreview error:', error)
    
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