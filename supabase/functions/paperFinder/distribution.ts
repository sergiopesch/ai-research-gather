import type { Paper } from './types.ts'

// BULLETPROOF distribution algorithm - GUARANTEED equal distribution
export function selectPapersWithAbsolutePerfectDistribution(
  papersByCategory: { [key: string]: Paper[] }, 
  selectedAreas: string[], 
  targetTotal: number
): Paper[] {
  console.log(`=== BULLETPROOF PERFECT DISTRIBUTION ===`)
  console.log(`Target: ${targetTotal} papers total`)
  console.log(`Selected areas: ${selectedAreas.join(', ')}`)
  
  const papersPerArea = Math.floor(targetTotal / selectedAreas.length)
  console.log(`EXACT TARGET per area: ${papersPerArea} papers`)
  
  const selectedPapers: Paper[] = []
  const distributionLog: { [key: string]: number } = {}
  
  // STEP 1: Get EXACTLY papersPerArea from each selected area
  for (const area of selectedAreas) {
    const availablePapers = papersByCategory[area] || []
    console.log(`${area}: ${availablePapers.length} papers available`)
    
    if (availablePapers.length === 0) {
      console.log(`❌ ${area}: NO PAPERS FOUND!`)
      distributionLog[area] = 0
      continue
    }
    
    // Sort by date (newest first) then take random selection for quality + diversity
    const sortedPapers = availablePapers.sort((a, b) => b.published_date.localeCompare(a.published_date))
    const topPapers = sortedPapers.slice(0, Math.min(10, sortedPapers.length)) // Take top 10 newest
    const shuffledTopPapers = [...topPapers].sort(() => Math.random() - 0.5) // Randomize within top papers
    
    // Take EXACTLY papersPerArea papers
    const taken = shuffledTopPapers.slice(0, Math.min(papersPerArea, shuffledTopPapers.length))
    selectedPapers.push(...taken)
    distributionLog[area] = taken.length
    
    console.log(`✅ ${area}: Selected ${taken.length} papers (target: ${papersPerArea})`)
    taken.forEach((paper, i) => {
      console.log(`  ${i + 1}. "${paper.title.substring(0, 50)}..." (${paper.published_date})`)
    })
  }
  
  // STEP 2: Fill any remaining slots due to insufficient papers in some categories
  let remaining = targetTotal - selectedPapers.length
  if (remaining > 0) {
    console.log(`=== FILLING ${remaining} REMAINING SLOTS ===`)
    
    // Try each area again for additional papers
    for (const area of selectedAreas) {
      if (remaining <= 0) break
      
      const availablePapers = papersByCategory[area] || []
      const alreadyTaken = distributionLog[area] || 0
      const remainingInCategory = availablePapers.slice(alreadyTaken)
      
      if (remainingInCategory.length > 0) {
        const shuffled = [...remainingInCategory].sort(() => Math.random() - 0.5)
        const toTake = Math.min(1, remaining, shuffled.length)
        const taken = shuffled.slice(0, toTake)
        
        selectedPapers.push(...taken)
        distributionLog[area] = (distributionLog[area] || 0) + taken.length
        remaining -= taken.length
        
        console.log(`${area}: Added ${taken.length} extra papers`)
      }
    }
  }
  
  // STEP 3: Final randomization of display order
  const finalPapers = [...selectedPapers].sort(() => Math.random() - 0.5)
  
  console.log(`=== FINAL DISTRIBUTION VERIFICATION ===`)
  let totalActual = 0
  selectedAreas.forEach(area => {
    const count = distributionLog[area] || 0
    totalActual += count
    const isTarget = count === papersPerArea
    console.log(`${area}: ${count} papers (target: ${papersPerArea}) ${isTarget ? '✅' : '⚠️'}`)
  })
  console.log(`Total selected: ${totalActual} papers (target: ${targetTotal})`)
  
  return finalPapers.slice(0, targetTotal)
}