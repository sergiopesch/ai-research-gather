// Generate AI summary for a paper
export async function generatePaperSummary(title: string): Promise<{ summary: string; importance: string }> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openAIApiKey) {
    return {
      summary: "AI summary unavailable - OpenAI API key not configured.",
      importance: "Summary generation requires OpenAI API configuration."
    }
  }

  try {
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
            content: 'You are an expert in AI, machine learning, robotics, and computer vision research. Provide concise, clear explanations for academic papers.'
          },
          {
            role: 'user',
            content: `Based on this research paper title: "${title}"

Please provide:
1. A one-sentence summary of what this paper is about
2. A one-sentence explanation of why this research is important

Format your response as JSON:
{
  "summary": "one sentence describing what the paper is about",
  "importance": "one sentence explaining why this is important"
}`
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    try {
      const parsed = JSON.parse(content)
      return {
        summary: parsed.summary || "Summary generation failed.",
        importance: parsed.importance || "Importance analysis failed."
      }
    } catch {
      return {
        summary: "Unable to parse AI response.",
        importance: "AI summary generation encountered an error."
      }
    }
  } catch (error) {
    console.warn('OpenAI summary generation error:', error)
    return {
      summary: "AI summary temporarily unavailable.",
      importance: "Summary generation service is currently unavailable."
    }
  }
}