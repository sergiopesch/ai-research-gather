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

type Utterance = { 
  speaker: "Dr Ada" | "Sam", 
  text: string 
}

// Function to call OpenAI for dialogue generation
async function generateDialogue(
  title: string, 
  authors: string[], 
  episode: number, 
  duration: number, 
  apiKey: string
): Promise<Utterance[]> {
  const authorsText = authors.length > 0 ? authors.join(", ") : "the authors"
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are co-hosts of "The Notebook Pod". Produce an alternating dialogue lasting about ${duration} seconds total.

Hosts must open with a warm welcome: include podcast name, "Episode ${episode}", paper title, and authors' surnames. Tone is friendly, informed, jargon-free.

Each utterance ≤ 25 tokens. End with a "Stay tuned!" cue.

Hosts:
- Dr Ada: Deep technical insight, explains complex concepts clearly
- Sam: Deep curiosity, asks clarifying questions, represents the audience

Return ONLY a JSON array of utterances in this exact format:
[
  {"speaker": "Dr Ada", "text": "Welcome to The Notebook Pod, Episode ${episode}..."},
  {"speaker": "Sam", "text": "..."}
]`
        },
        {
          role: 'user',
          content: `Generate a ${duration}-second dialogue about the paper "${title}" by ${authorsText}. Start with Dr Ada welcoming listeners, then alternate speakers naturally. Keep each line under 25 tokens.`
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content

  try {
    const dialogue = JSON.parse(content.trim())
    
    // Validate the response format
    if (!Array.isArray(dialogue)) {
      throw new Error('Invalid dialogue format')
    }

    // Limit utterances based on duration (assume ~2 seconds per utterance)
    const maxUtterances = Math.min(Math.ceil(duration / 2), 20)
    const limitedDialogue = dialogue.slice(0, maxUtterances)

    // Validate each utterance
    return limitedDialogue.map((item: any, index: number) => {
      if (!item.speaker || !item.text) {
        throw new Error(`Invalid utterance at index ${index}`)
      }
      if (!["Dr Ada", "Sam"].includes(item.speaker)) {
        throw new Error(`Invalid speaker at index ${index}: ${item.speaker}`)
      }
      return {
        speaker: item.speaker as "Dr Ada" | "Sam",
        text: item.text
      }
    })
  } catch (parseError) {
    console.error('Failed to parse OpenAI response:', content)
    throw new Error('Failed to parse dialogue from AI response')
  }
}

// Function to send SSE event
function sendSSEEvent(controller: ReadableStreamDefaultController, eventType: string, data: any) {
  const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`
  controller.enqueue(new TextEncoder().encode(message))
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
    
    console.log(`=== GENERATE PODCAST PREVIEW REQUEST ===`)
    console.log(`Paper ID: ${paper_id}, Episode: ${episode}, Duration: ${duration}s`)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch paper with PROCESSED status
    const { data: paper, error: fetchError } = await supabase
      .from('papers')
      .select('title, source')
      .eq('id', paper_id)
      .eq('status', 'PROCESSED')
      .single()

    if (fetchError || !paper) {
      console.error('Paper not found or not processed:', fetchError)
      return new Response(JSON.stringify({ 
        error: 'Paper not found or not in PROCESSED status',
        paper_id 
      }), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      })
    }

    console.log(`Generating podcast preview for: "${paper.title}"`)

    // Extract authors from title or use source as fallback
    // This is a simple implementation - in real scenario you'd have an authors field
    const authors = paper.source ? [paper.source] : ['the researchers']

    // Generate dialogue
    const dialogue = await generateDialogue(
      paper.title,
      authors,
      episode,
      duration,
      openAIApiKey
    )

    console.log(`Generated ${dialogue.length} utterances`)

    // Check if client wants SSE streaming
    const acceptHeader = req.headers.get('accept') || ''
    const wantsSSE = acceptHeader.includes('text/event-stream')

    if (wantsSSE) {
      // Return SSE stream
      const stream = new ReadableStream({
        start(controller) {
          // Send each utterance as SSE event
          dialogue.forEach((utterance, index) => {
            setTimeout(() => {
              sendSSEEvent(controller, 'line', utterance)
              
              // Close stream after last utterance
              if (index === dialogue.length - 1) {
                setTimeout(() => {
                  sendSSEEvent(controller, 'end', { message: 'Preview complete' })
                  controller.close()
                }, 100)
              }
            }, index * 500) // 500ms delay between utterances
          })
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
    } else {
      // Return JSON response
      return new Response(JSON.stringify({ 
        episode,
        paper_id,
        dialogue,
        metadata: {
          title: paper.title,
          duration_seconds: duration,
          utterance_count: dialogue.length
        }
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      })
    }
    
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