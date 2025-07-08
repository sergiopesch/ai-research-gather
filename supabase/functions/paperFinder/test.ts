import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts"

const FUNCTION_URL = 'http://localhost:54321/functions/v1/paperFinder'

interface Paper {
  title: string
  url: string
  doi?: string
  source: string
  published_date: string
}

interface PaperResponse {
  papers: Paper[]
}

Deno.test("paperFinder - valid request with keywords", async () => {
  const payload = {
    since: "2025-01-01",
    keywords: ["humanoid"],
    limit: 3
  }

  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  assertEquals(response.status, 200)
  
  const data: PaperResponse = await response.json()
  assertExists(data.papers)
  
  // Should return at most 3 results
  assertEquals(data.papers.length <= 3, true)
  
  // Each paper should have required fields
  for (const paper of data.papers) {
    assertExists(paper.title)
    assertExists(paper.url)
    assertExists(paper.source)
    assertExists(paper.published_date)
    
    // Published date should be >= 2025-01-01
    assertEquals(paper.published_date >= "2025-01-01", true)
  }
})

Deno.test("paperFinder - empty keywords", async () => {
  const payload = {
    since: "2025-01-01",
    limit: 5
  }

  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  assertEquals(response.status, 200)
  
  const data: PaperResponse = await response.json()
  assertExists(data.papers)
  assertEquals(data.papers.length <= 5, true)
})

Deno.test("paperFinder - invalid date format", async () => {
  const payload = {
    since: "2025/01/01", // Wrong format
    keywords: ["AI"],
    limit: 3
  }

  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  assertEquals(response.status, 400)
})

Deno.test("paperFinder - limit out of range", async () => {
  const payload = {
    since: "2025-01-01",
    keywords: ["robotics"],
    limit: 100 // Exceeds max of 50
  }

  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  assertEquals(response.status, 400)
})

Deno.test("paperFinder - method not allowed", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: 'GET',
  })

  assertEquals(response.status, 405)
})

Deno.test("paperFinder - CORS preflight", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: 'OPTIONS',
  })

  assertEquals(response.status, 200)
  assertEquals(response.headers.get('Access-Control-Allow-Origin'), '*')
  assertEquals(response.headers.get('Access-Control-Allow-Methods'), 'POST, OPTIONS')
})

Deno.test("paperFinder - integration smoke test", async () => {
  const today = new Date().toISOString().split('T')[0]
  
  const payload = {
    since: today,
    keywords: ["machine learning"],
    limit: 1
  }

  const startTime = Date.now()
  
  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const endTime = Date.now()
  const responseTime = endTime - startTime

  // Should respond within 8 seconds
  assertEquals(responseTime < 8000, true)
  assertEquals(response.status, 200)
  
  const data: PaperResponse = await response.json()
  assertExists(data.papers)
  
  // Should either be empty array or valid results
  if (data.papers.length > 0) {
    const paper = data.papers[0]
    assertExists(paper.title)
    assertExists(paper.url)
    assertExists(paper.source)
    assertExists(paper.published_date)
  }
})

Deno.test("paperFinder - deduplication test", async () => {
  const payload = {
    since: "2024-01-01",
    keywords: ["transformer", "attention"],
    limit: 20
  }

  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  assertEquals(response.status, 200)
  
  const data: PaperResponse = await response.json()
  
  // Check for duplicate DOIs
  const dois = data.papers.map(p => p.doi).filter(Boolean)
  const uniqueDois = new Set(dois)
  assertEquals(dois.length, uniqueDois.size)
  
  // Check for duplicate titles (normalized)
  const normalizedTitles = data.papers.map(p => 
    p.title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()
  )
  const uniqueTitles = new Set(normalizedTitles)
  assertEquals(normalizedTitles.length, uniqueTitles.size)
})