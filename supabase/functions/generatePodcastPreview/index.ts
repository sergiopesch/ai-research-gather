import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Simplified conversation generation with real AI
async function generateConversation(paperTitle: string, openAIApiKey: string) {
  const prompt = `Generate a natural, engaging podcast conversation between Dr Ada (technical expert) and Sam (curious interviewer) about the research paper titled "${paperTitle}".

Make it sound like a real conversation with natural flow, questions, and insights. Generate exactly 5 exchanges (10 total utterances).

Return ONLY a JSON array in this exact format:
[
  {"speaker": "Dr Ada", "text": "..."},
  {"speaker": "Sam", "text": "..."},
  {"speaker": "Dr Ada", "text": "..."},
  {"speaker": "Sam", "text": "..."},
  {"speaker": "Dr Ada", "text": "..."}
]`

  try {
    console.log('🤖 Calling OpenAI API...')
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini-2025-04-14',
        messages: [
          { role: 'system', content: 'You are a podcast conversation generator. Return only valid JSON arrays.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1500,
        temperature: 0.8,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content.trim()
    
    // Parse the JSON response
    const dialogue = JSON.parse(content)
    console.log('✅ Generated dialogue with', dialogue.length, 'utterances')
    return dialogue
    
  } catch (error) {
    console.error('❌ OpenAI error:', error)
    // Fallback dialogue if API fails
    return [
      { speaker: "Dr Ada", text: `Welcome to The Notebook Pod! Today we're exploring "${paperTitle}".` },
      { speaker: "Sam", text: "Thanks! What makes this research particularly interesting?" },
      { speaker: "Dr Ada", text: "This work addresses key challenges in the field and introduces innovative approaches." },
      { speaker: "Sam", text: "That's fascinating! Can you elaborate on the practical applications?" },
      { speaker: "Dr Ada", text: "The applications are wide-ranging and could significantly impact the field." }
    ]
  }
}

serve(async (req: Request): Promise<Response> => {
  console.log(`🚀 Function called: ${req.method} ${req.url}`)
  
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
    const { paper_id, episode = 1, duration = 10 } = body

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
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Supabase credentials not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    if (!openAIApiKey) {
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
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
    
    // Generate conversation
    const dialogue = await generateConversation(paper.title, openAIApiKey)
    
    // Return the dialogue for frontend to handle streaming
    return new Response(JSON.stringify({ 
      success: true,
      dialogue,
      paper_title: paper.title,
      episode,
      duration
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
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