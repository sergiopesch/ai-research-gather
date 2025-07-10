import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept, cache-control',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Enhanced logging with timestamps
function log(level: 'INFO' | 'WARN' | 'ERROR', message: string, data?: any) {
  const timestamp = new Date().toISOString()
  const emoji = level === 'INFO' ? '📡' : level === 'WARN' ? '⚠️' : '❌'
  console.log(`${emoji} [${timestamp}] ${message}`, data ? JSON.stringify(data) : '')
}

// Send SSE event with proper formatting and error handling
function sendSSEEvent(controller: ReadableStreamDefaultController, eventType: string, data: any): boolean {
  try {
    const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`
    controller.enqueue(new TextEncoder().encode(message))
    log('INFO', `SSE Event: ${eventType}`, { type: eventType, speaker: data.speaker })
    return true
  } catch (error) {
    log('ERROR', 'SSE Event Failed', { eventType, error: error.message })
    return false
  }
}

// Enhanced error handling with specific error types
function createErrorResponse(message: string, status: number = 500, details?: any) {
  log('ERROR', 'Error Response', { message, status, details })
  return new Response(JSON.stringify({ 
    error: message, 
    timestamp: new Date().toISOString(),
    details 
  }), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  })
}

// Validate environment variables with detailed feedback
function validateEnvironment() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
  
  const missing = []
  if (!supabaseUrl) missing.push('SUPABASE_URL')
  if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY')
  if (!openAIApiKey) missing.push('OPENAI_API_KEY')
  
  log('INFO', 'Environment Check', {
    supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
    supabaseServiceKey: supabaseServiceKey ? 'Set' : 'Missing',
    openAIApiKey: openAIApiKey ? 'Set' : 'Missing'
  })
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}. Please configure these in Supabase Edge Functions settings.`)
  }
  
  return { supabaseUrl, supabaseServiceKey, openAIApiKey }
}

// Enhanced paper validation with detailed feedback
async function validatePaper(supabase: any, paperId: string) {
  log('INFO', 'Validating paper', { paperId })
  
  const { data: paper, error: fetchError } = await supabase
    .from('papers')
    .select('id, title, status, source')
    .eq('id', paperId)
    .maybeSingle()

  if (fetchError) {
    log('ERROR', 'Database error during paper validation', fetchError)
    throw new Error(`Database error: ${fetchError.message}`)
  }

  if (!paper) {
    log('ERROR', 'Paper not found', { paperId })
    throw new Error(`Paper not found: ${paperId}. Please ensure the paper exists and try selecting it again.`)
  }

  if (paper.status !== 'SELECTED') {
    log('ERROR', 'Paper not in SELECTED status', { paperId, currentStatus: paper.status })
    throw new Error(`Paper status is ${paper.status}, expected SELECTED. Please select the paper first.`)
  }

  log('INFO', 'Paper validation successful', paper)
  return paper
}

// Enhanced OpenAI API call with retry logic and better error handling
async function callOpenAI(openAIApiKey: string, messages: any[], retryCount = 0): Promise<string> {
  const maxRetries = 3
  const retryDelay = 1000 * Math.pow(2, retryCount) // Exponential backoff
  
  try {
    log('INFO', 'Calling OpenAI API', { retryCount, messageCount: messages.length })
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 200,
        temperature: 0.8,
        timeout: 30000, // 30 second timeout
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      log('ERROR', 'OpenAI API error', { status: response.status, error: errorText })
      
      // Handle specific OpenAI errors
      if (response.status === 401) {
        throw new Error('OpenAI API key is invalid. Please check your OPENAI_API_KEY configuration.')
      } else if (response.status === 429) {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.')
      } else if (response.status >= 500) {
        throw new Error('OpenAI API server error. Please try again later.')
      } else {
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
      }
    }

    const data = await response.json()
    const message = data.choices[0]?.message?.content?.trim()
    
    if (!message) {
      throw new Error('No message received from OpenAI API')
    }
    
    log('INFO', 'OpenAI API call successful', { messageLength: message.length })
    return message
    
  } catch (error) {
    log('ERROR', 'OpenAI API call failed', { retryCount, error: error.message })
    
    // Retry logic for network errors
    if (retryCount < maxRetries && (
      error.message.includes('network') || 
      error.message.includes('timeout') ||
      error.message.includes('502') ||
      error.message.includes('503')
    )) {
      log('INFO', 'Retrying OpenAI API call', { retryCount: retryCount + 1, delay: retryDelay })
      await new Promise(resolve => setTimeout(resolve, retryDelay))
      return callOpenAI(openAIApiKey, messages, retryCount + 1)
    }
    
    throw error
  }
}

// Fallback conversation generator for when OpenAI fails
function generateFallbackMessage(speaker: string, exchangeIndex: number, paperTitle: string): string {
  const drAdaFallbacks = [
    `This research on "${paperTitle}" presents some fascinating insights into the field.`,
    `The methodology described in this paper opens up new possibilities for future research.`,
    `What's particularly interesting about this work is how it builds on previous findings.`,
    `The implications of this research could be quite significant for the scientific community.`,
    `This paper demonstrates innovative approaches that could influence future studies.`
  ]
  
  const samFallbacks = [
    `That sounds really interesting! Can you tell our listeners more about the practical applications?`,
    `What makes this research particularly groundbreaking in your opinion?`,
    `How do you think this will impact the broader field?`,
    `What were the key challenges the researchers had to overcome?`,
    `This is fascinating! What should our audience know about the methodology?`
  ]
  
  const fallbacks = speaker === "Dr Ada" ? drAdaFallbacks : samFallbacks
  return fallbacks[exchangeIndex % fallbacks.length] || fallbacks[0]
}

// Enhanced conversation generator with comprehensive error handling
async function generateRealtimeConversation(
  paperTitle: string, 
  openAIApiKey: string, 
  controller: ReadableStreamDefaultController
) {
  const speakers = ["Dr Ada", "Sam"]
  let currentSpeakerIndex = 0
  const totalExchanges = 8
  let successfulExchanges = 0

  log('INFO', 'Starting conversation generation', { paperTitle, totalExchanges })

  // Send conversation start
  if (!sendSSEEvent(controller, 'conversation_start', {
    paper_title: paperTitle,
    speakers: speakers,
    timestamp: Date.now()
  })) {
    throw new Error('Failed to send conversation start event')
  }

  for (let i = 0; i < totalExchanges; i++) {
    const currentSpeaker = speakers[currentSpeakerIndex]
    log('INFO', 'Generating response', { speaker: currentSpeaker, exchange: i + 1, total: totalExchanges })

    try {
      // Show typing indicator
      sendSSEEvent(controller, 'typing_start', {
        speaker: currentSpeaker,
        timestamp: Date.now()
      })

      // Realistic typing delay
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000))

      let message: string
      
      try {
        // Try OpenAI first
        const prompt = getContextualPrompt(currentSpeaker, i, paperTitle)
        const systemPrompt = currentSpeaker === "Dr Ada" 
          ? "You are Dr Ada, a brilliant research scientist. Speak naturally about research with enthusiasm and technical insight. Keep responses under 150 words and conversational."
          : "You are Sam, a curious podcast interviewer. Ask engaging follow-up questions and help make technical concepts accessible. Keep responses under 100 words and show genuine interest."
        
        message = await callOpenAI(openAIApiKey, [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ])
        
      } catch (openaiError) {
        log('WARN', 'OpenAI failed, using fallback', { speaker: currentSpeaker, error: openaiError.message })
        message = generateFallbackMessage(currentSpeaker, i, paperTitle)
      }

      // Stop typing indicator
      sendSSEEvent(controller, 'typing_stop', {
        speaker: currentSpeaker,
        timestamp: Date.now()
      })

      // Send the actual message with realistic delay
      await new Promise(resolve => setTimeout(resolve, 300))
      
      if (sendSSEEvent(controller, 'message', {
        speaker: currentSpeaker,
        text: message,
        timestamp: Date.now(),
        exchange: i + 1
      })) {
        successfulExchanges++
        log('INFO', 'Message sent successfully', { 
          speaker: currentSpeaker, 
          exchange: i + 1,
          messagePreview: message.substring(0, 50) + '...'
        })
      } else {
        log('ERROR', 'Failed to send message', { speaker: currentSpeaker, exchange: i + 1 })
      }

      // Switch speakers
      currentSpeakerIndex = (currentSpeakerIndex + 1) % speakers.length

      // Natural pause between speakers
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700))

    } catch (error) {
      log('ERROR', 'Error in conversation exchange', { 
        speaker: currentSpeaker, 
        exchange: i + 1, 
        error: error.message 
      })
      
      // Continue with fallback message
      const fallbackMessage = generateFallbackMessage(currentSpeaker, i, paperTitle)
      
      sendSSEEvent(controller, 'typing_stop', { speaker: currentSpeaker, timestamp: Date.now() })
      sendSSEEvent(controller, 'message', {
        speaker: currentSpeaker,
        text: fallbackMessage,
        timestamp: Date.now(),
        exchange: i + 1
      })

      successfulExchanges++
      currentSpeakerIndex = (currentSpeakerIndex + 1) % speakers.length
    }
  }

  // End conversation
  sendSSEEvent(controller, 'conversation_end', {
    message: "Thanks for tuning in to The Notebook Pod!",
    total_exchanges: totalExchanges,
    successful_exchanges: successfulExchanges,
    timestamp: Date.now()
  })
  
  log('INFO', 'Conversation completed', { 
    totalExchanges, 
    successfulExchanges,
    successRate: `${Math.round(successfulExchanges / totalExchanges * 100)}%`
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
  const requestId = crypto.randomUUID()
  log('INFO', 'Request received', { 
    method: req.method, 
    url: req.url, 
    requestId,
    headers: Object.fromEntries(req.headers.entries()) 
  })
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    log('INFO', 'CORS preflight handled', { requestId })
    return new Response(null, { status: 200, headers: corsHeaders })
  }
  
  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405, { allowedMethods: ['POST'] })
  }

  try {
    // Validate environment
    const { supabaseUrl, supabaseServiceKey, openAIApiKey } = validateEnvironment()
    
    // Parse request body
    log('INFO', 'Parsing request body', { requestId })
    const body = await req.json()
    const { paper_id } = body

    if (!paper_id) {
      return createErrorResponse('paper_id is required', 400, { 
        requiredFields: ['paper_id'],
        receivedFields: Object.keys(body)
      })
    }

    // Validate paper_id format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(paper_id)) {
      return createErrorResponse('Invalid paper_id format. Must be a valid UUID.', 400, { paper_id })
    }

    log('INFO', 'Request validated', { requestId, paper_id })

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Validate paper
    const paper = await validatePaper(supabase, paper_id)

    log('INFO', 'Starting conversation generation', { 
      requestId, 
      paper_id, 
      paper_title: paper.title 
    })

    // Create SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await generateRealtimeConversation(paper.title, openAIApiKey, controller)
          log('INFO', 'Stream completed successfully', { requestId })
          controller.close()
        } catch (error) {
          log('ERROR', 'Stream error', { requestId, error: error.message })
          
          // Send error event to client
          sendSSEEvent(controller, 'error', { 
            message: error.message,
            timestamp: Date.now(),
            requestId
          })
          
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
        'X-Request-ID': requestId,
        ...corsHeaders,
      }
    })

  } catch (error) {
    log('ERROR', 'Function error', { requestId, error: error.message })
    return createErrorResponse(
      error.message || 'Internal server error', 
      500, 
      { requestId, timestamp: new Date().toISOString() }
    )
  }
})