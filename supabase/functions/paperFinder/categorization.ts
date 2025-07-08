import { RESEARCH_AREAS } from './research-areas.ts'

// Enhanced categorization with weighted scoring for MAXIMUM accuracy
export function categorizePaper(title: string): { category: string; confidence: number } {
  const titleLower = title.toLowerCase()
  let bestMatch = { category: 'Artificial Intelligence', confidence: 0 }
  
  for (const area of RESEARCH_AREAS) {
    let confidence = 0
    
    for (const keyword of area.keywords) {
      const keywordLower = keyword.toLowerCase()
      if (titleLower.includes(keywordLower)) {
        // SUPER HIGH confidence for core terms
        if (['artificial intelligence', 'machine learning', 'deep learning', 'robotics', 'computer vision'].includes(keywordLower)) {
          confidence += 20
        } else if (['ai', 'ml', 'cv', 'robot', 'vision', 'neural network', 'transformer'].includes(keywordLower)) {
          confidence += 10
        } else if (['reinforcement learning', 'slam', 'object detection', 'image classification'].includes(keywordLower)) {
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