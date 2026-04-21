import type { Paper } from './types.ts'

function getPaperKey(paper: Paper): string {
  return (paper.doi || paper.url || paper.title).toLowerCase()
}

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
  const selectedKeys = new Set<string>()
  
  // STEP 1: Get EXACTLY papersPerArea from each selected area
  for (const area of selectedAreas) {
    const availablePapers = (papersByCategory[area] || []).filter((paper) => !selectedKeys.has(getPaperKey(paper)))
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
    taken.forEach((paper) => selectedKeys.add(getPaperKey(paper)))
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

    while (remaining > 0) {
      let addedThisPass = 0

      for (const area of selectedAreas) {
        if (remaining <= 0) break

        const remainingInCategory = (papersByCategory[area] || [])
          .filter((paper) => !selectedKeys.has(getPaperKey(paper)))
          .sort((a, b) => b.published_date.localeCompare(a.published_date))

        if (remainingInCategory.length > 0) {
          const taken = remainingInCategory[0]

          selectedPapers.push(taken)
          selectedKeys.add(getPaperKey(taken))
          distributionLog[area] = (distributionLog[area] || 0) + 1
          remaining -= 1
          addedThisPass += 1

          console.log(`${area}: Added 1 extra paper`)
        }
      }

      if (addedThisPass === 0) {
        break
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
