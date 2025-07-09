import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"

const RequestSchema = z.object({
  paper_id: z.string().uuid("Invalid paper ID format"),
  episode: z.number().int().min(1).optional().default(1),
  duration: z.number().int().min(5).max(30).optional().default(10)
})

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
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout
      
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
          max_tokens: 120 // Shorter responses for faster delivery
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

serve(async (req: Request): Promise<Response> => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  socket.onopen = () => {
    console.log("🔌 WebSocket connection established for podcast chat");
  };

  socket.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("📩 Received WebSocket message:", data);
      
      if (data.type === 'start_conversation') {
        const { paper_id, episode, duration } = RequestSchema.parse(data);
        
        console.log(`🎙️ Starting live podcast conversation for paper: ${paper_id}`);
        
        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!
        
        if (!openAIApiKey) {
          socket.send(JSON.stringify({
            type: 'error',
            message: 'OpenAI API key not configured'
          }));
          return;
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
          socket.send(JSON.stringify({
            type: 'error',
            message: 'Paper not found or not in SELECTED status'
          }));
          return;
        }

        // Send start event
        socket.send(JSON.stringify({
          type: 'start',
          paper_id,
          episode,
          title: paper.title
        }));

        // Start live conversation
        await generateRealtimeConversation(paper.title, episode, openAIApiKey, socket);
      }
    } catch (error) {
      console.error("❌ WebSocket message error:", error);
      socket.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  };

  socket.onclose = () => {
    console.log("🔌 WebSocket connection closed");
  };

  socket.onerror = (error) => {
    console.error("❌ WebSocket error:", error);
  };

  return response;
});

// Function to manage live conversation with instant delivery
async function generateRealtimeConversation(
  title: string,
  episode: number,
  apiKey: string,
  socket: WebSocket
) {
  const authorsText = "the researchers"
  
  // Initialize conversation history
  const conversationHistory: any[] = []
  
  // Dr Ada (GPT-4O) system prompt
  const drAdaSystemPrompt = `You are Dr Ada, co-host of "The Notebook Pod". You're a technical expert who explains complex research clearly. 

Rules:
- Keep responses under 20 words
- Be knowledgeable but accessible
- Engage naturally with Sam
- Focus on the key technical insights
- Don't repeat information already discussed

Current paper: "${title}" by ${authorsText}`

  // Sam (GPT-4O mini) system prompt  
  const samSystemPrompt = `You are Sam, co-host of "The Notebook Pod". You're deeply curious and ask great clarifying questions that help the audience understand.

Rules:
- Keep responses under 20 words
- Ask insightful questions
- Show genuine curiosity
- Help bridge technical concepts for general audience
- Don't repeat questions already asked

Current paper: "${title}" by ${authorsText}`

  try {
    // Start with Dr Ada's welcome - INSTANT delivery
    const welcomeMessage = `Welcome to The Notebook Pod, Episode ${episode}! Today we're exploring "${title}".`
    
    console.log('👩‍⚕️ INSTANT: Dr Ada speaking...')
    socket.send(JSON.stringify({
      type: 'dialogue',
      speaker: "Dr Ada",
      text: welcomeMessage
    }));
    
    conversationHistory.push({ role: "assistant", content: welcomeMessage })
    
    // Shorter delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Continue conversation with faster exchanges
    for (let turn = 0; turn < 4; turn++) {
      console.log(`🔄 INSTANT: Turn ${turn + 1}`)
      
      // Sam's turn (GPT-4O mini) - INSTANT delivery
      console.log('🎯 INSTANT: Sam is responding...')
      const samMessages = [
        { role: "system", content: samSystemPrompt },
        ...conversationHistory.map(msg => ({
          role: msg.role === "assistant" ? "user" : "assistant",
          content: msg.content
        }))
      ]
      
      const samResponse = await callOpenAIForResponse(apiKey, samMessages, "gpt-4o-mini")
      
      console.log(`🗣️ INSTANT: Sam says: "${samResponse}"`)
      socket.send(JSON.stringify({
        type: 'dialogue',
        speaker: "Sam",
        text: samResponse
      }));
      
      conversationHistory.push({ role: "user", content: samResponse })
      
      // Shorter delay for natural flow
      await new Promise(resolve => setTimeout(resolve, 1800))
      
      // Dr Ada's turn (GPT-4O) - but not on the last iteration
      if (turn < 3) {
        console.log('🎯 INSTANT: Dr Ada is responding...')
        const drAdaMessages = [
          { role: "system", content: drAdaSystemPrompt },
          ...conversationHistory
        ]
        
        const drAdaResponse = await callOpenAIForResponse(apiKey, drAdaMessages, "gpt-4o")
        
        console.log(`👩‍⚕️ INSTANT: Dr Ada says: "${drAdaResponse}"`)
        socket.send(JSON.stringify({
          type: 'dialogue',
          speaker: "Dr Ada", 
          text: drAdaResponse
        }));
        
        conversationHistory.push({ role: "assistant", content: drAdaResponse })
        
        // Shorter delay for natural flow
        await new Promise(resolve => setTimeout(resolve, 1800))
      }
    }
    
    // End the conversation
    console.log('🏁 INSTANT: Conversation ending...')
    socket.send(JSON.stringify({
      type: 'end',
      message: 'Thanks for tuning in to The Notebook Pod! Stay curious!'
    }));
    
  } catch (error) {
    console.error('❌ INSTANT: Error in conversation:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Live conversation encountered an error'
    }));
  }
}