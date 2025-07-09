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
    const { paper_id } = RequestSchema.parse(body)
    
    console.log(`=== SELECT PAPER REQUEST ===`)
    console.log(`Paper ID: ${paper_id}`)

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if paper exists and get current status
    const { data: paper, error: fetchError } = await supabase
      .from('papers')
      .select('id, status, title')
      .eq('id', paper_id)
      .single()

    if (fetchError || !paper) {
      console.error('Paper not found:', fetchError)
      return new Response(JSON.stringify({ 
        error: 'Paper not found',
        paper_id 
      }), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      })
    }

    // Check if paper is already processed or selected
    if (paper.status === 'PROCESSED') {
      console.log(`Paper ${paper_id} already processed`)
      return new Response(JSON.stringify({ 
        error: 'Paper already processed',
        message: 'This paper has already been processed',
        paper_id,
        current_status: paper.status
      }), {
        status: 409,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      })
    }

    if (paper.status === 'SELECTED') {
      console.log(`Paper ${paper_id} already selected`)
      return new Response(JSON.stringify({ 
        error: 'Paper already selected',
        message: 'This paper has already been selected for processing',
        paper_id,
        current_status: paper.status
      }), {
        status: 409,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      })
    }

    // Update paper status to SELECTED
    const { error: updateError } = await supabase
      .from('papers')
      .update({ status: 'SELECTED' })
      .eq('id', paper_id)

    if (updateError) {
      console.error('Failed to update paper status:', updateError)
      return new Response(JSON.stringify({ 
        error: 'Failed to update paper status',
        details: updateError.message
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      })
    }

    console.log(`✅ Paper ${paper_id} status updated to SELECTED`)

    return new Response(JSON.stringify({ 
      ok: true,
      message: 'Paper queued for processing',
      paper_id,
      title: paper.title,
      previous_status: paper.status,
      new_status: 'SELECTED'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    })
    
  } catch (error) {
    console.error('SelectPaper error:', error)
    
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