# PaperFinder Cloud Function

A TypeScript cloud function that returns the newest open-access AI and robotics papers from multiple academic sources.

## Features

- **Multi-source aggregation**: Fetches from arXiv, Semantic Scholar, and IEEE Xplore
- **Smart deduplication**: Removes duplicates by DOI or normalized title
- **Open-access filtering**: Only returns papers with freely available PDFs
- **Size validation**: Rejects PDFs larger than 25MB
- **Robust error handling**: Returns valid responses even when sources are unavailable
- **Input validation**: Uses Zod for runtime schema validation

## API Specification

### Endpoint
```
POST /functions/v1/paperFinder
```

### Request Body
```json
{
  "since": "YYYY-MM-DD",          // mandatory UTC date
  "keywords": ["string"],         // optional array of keywords
  "limit": 15                     // optional, 1-50, defaults to 15
}
```

### Response
```json
{
  "papers": [
    {
      "title": "Paper Title",
      "url": "https://...",
      "doi": "10.1000/...",        // optional
      "source": "arXiv",
      "published_date": "2025-01-01"
    }
  ]
}
```

## Environment Variables

Set these in your Supabase Edge Function Secrets:

- `SEM_SCHOLAR_API_KEY`: Your Semantic Scholar API key
- `IEEE_API_KEY`: Your IEEE Xplore API key  
- `ARXIV_BASE_URL`: ArXiv API endpoint (optional, defaults to http://export.arxiv.org/api/query)

## Local Development

1. **Start the function locally:**
   ```bash
   npm run dev
   ```

2. **Run tests:**
   ```bash
   npm test
   ```

3. **Lint and format:**
   ```bash
   npm run lint
   npm run format
   ```

## Deployment

Deploy to Supabase:
```bash
npm run deploy
```

## Usage Examples

### Basic request
```bash
curl -X POST 'http://localhost:54321/functions/v1/paperFinder' \
  -H 'Content-Type: application/json' \
  -d '{
    "since": "2025-01-01",
    "limit": 5
  }'
```

### With keywords
```bash
curl -X POST 'http://localhost:54321/functions/v1/paperFinder' \
  -H 'Content-Type: application/json' \
  -d '{
    "since": "2024-12-01",
    "keywords": ["humanoid", "robotics"],
    "limit": 10
  }'
```

## Data Sources

### arXiv
- **Categories**: cs.AI, cs.RO, cs.CV, cs.LG
- **Rate limits**: No authentication required
- **Open access**: All papers are freely available

### Semantic Scholar
- **Filters**: isOpenAccess=true, openAccessPdf available
- **Rate limits**: 100 requests/5 minutes with API key
- **Authentication**: Required (API key)

### IEEE Xplore
- **Filters**: access_type=OPEN_ACCESS
- **Rate limits**: 200 calls/day without subscription
- **Authentication**: Required (API key)

## Error Handling

- **Invalid input**: Returns 400 with validation details
- **API timeouts**: 5-second timeout per source, continues with available data
- **Missing API keys**: Logs warning and skips that source
- **Network errors**: Graceful degradation, returns available papers
- **Server errors**: Returns 200 with empty papers array (as specified)

## Testing

The test suite includes:

- **Unit tests**: Input validation, response structure
- **Integration tests**: End-to-end API calls with real data
- **Performance tests**: Response time under 8 seconds
- **Edge cases**: Invalid dates, missing parameters, CORS handling

## Implementation Notes

- Uses Deno runtime for edge functions
- ES Modules for modern JavaScript features
- Zod for runtime type safety
- AbortController for request timeouts
- Simple XML parsing for arXiv (no external dependencies)
- DOI-based deduplication with title fallback
- Content-Length header checking for PDF size validation