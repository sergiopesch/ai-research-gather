import { RESEARCH_AREAS } from './research-areas.ts'

// Enhanced categorization with weighted scoring for the 3 research areas
export function categorizePaper(title: string): { category: string; confidence: number } {
  const titleLower = title.toLowerCase()
  let bestMatch = { category: 'Large Language Models', confidence: 0 }

  for (const area of RESEARCH_AREAS) {
    let confidence = 0

    for (const keyword of area.keywords) {
      const keywordLower = keyword.toLowerCase()
      if (titleLower.includes(keywordLower)) {
        // High confidence for core terms
        if (['robotics', 'computer vision', 'large language model', 'llm'].includes(keywordLower)) {
          confidence += 20
        } else if (['robot', 'vision', 'gpt', 'image', 'visual'].includes(keywordLower)) {
          confidence += 10
        } else if (['slam', 'object detection', 'segmentation', 'prompt', 'fine-tuning'].includes(keywordLower)) {
          confidence += 8
        } else {
          confidence += 3
        }
      }
    }

    if (confidence > bestMatch.confidence) {
      bestMatch = { category: area.name, confidence }
    }
  }

  return bestMatch
}
