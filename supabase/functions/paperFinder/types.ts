import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"

// Input validation schema
export const RequestSchema = z.object({
  since: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  keywords: z.array(z.string()).optional().default([]),
  limit: z.number().int().min(1).max(50).optional().default(15)
})

export type RequestData = z.infer<typeof RequestSchema>

// Internal paper type (before DB save, id is optional)
export interface Paper {
  id?: string
  title: string
  url: string
  doi?: string
  source: string
  published_date: string
  authors?: string[]
  summary?: string
  importance?: string
}

// Paper with required id (after DB save)
export interface PaperWithId extends Paper {
  id: string
}

export interface PaperResponse {
  papers: PaperWithId[]
}

export interface ResearchArea {
  name: string
  keywords: string[]
}