import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept, cache-control',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ScriptSegmentSchema = z.object({
  speaker: z.string().min(1),
  text: z.string().min(1),
  duration: z.number().int().nonnegative().optional(),
  voiceId: z.string().optional(),
})

const EpisodeScriptSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  segments: z.array(ScriptSegmentSchema).min(1),
  totalDuration: z.string().min(1),
  createdAt: z.string().min(1),
})

const RequestSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('create'),
    paper_id: z.string().uuid("Invalid paper ID format"),
    paper_title: z.string().min(1),
    script: EpisodeScriptSchema,
  }),
  z.object({
    action: z.literal('delete'),
    episode_id: z.string().uuid("Invalid episode ID format"),
  }),
])

serve(async (req: Request): Promise<Response> => {
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
    const payload = RequestSchema.parse(body)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (payload.action === 'create') {
      const { data: nextNumber, error: nextNumberError } = await supabase.rpc('get_next_episode_number')

      if (nextNumberError) {
        throw nextNumberError
      }

      const { data, error } = await supabase
        .from('episodes')
        .insert({
          episode_number: nextNumber || 1,
          title: `Episode ${nextNumber || 1}: ${payload.paper_title}`,
          paper_id: payload.paper_id,
          paper_title: payload.paper_title,
          script: payload.script,
          status: 'GENERATED'
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    const { error } = await supabase
      .from('episodes')
      .delete()
      .eq('id', payload.episode_id)

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({ ok: true, episode_id: payload.episode_id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  } catch (error) {
    console.error('manageEpisodes error:', error)

    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({
        error: 'Invalid input',
        details: error.errors
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
})
