# Live Podcast Preview Function

This Supabase Edge Function generates real-time AI conversations between two podcast hosts (Dr. Ada and Sam) discussing research papers.

## Features

- **Real-time SSE streaming**: Live conversation updates with typing indicators
- **Two AI personalities**: Dr. Ada (research expert) and Sam (curious interviewer)
- **Enhanced error handling**: Comprehensive error recovery and user feedback
- **OpenAI integration**: Uses GPT-4.1-2025-04-14 for natural conversations

## Required Environment Variables

Configure these in Supabase Dashboard → Settings → Edge Functions → Environment Variables:

- `OPENAI_API_KEY`: Your OpenAI API key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `SUPABASE_URL`: Supabase project URL (auto-configured)

## API Usage

```bash
POST /functions/v1/generatePodcastPreview
Content-Type: application/json

{
  "paper_id": "uuid-of-selected-paper",
  "episode": 1,
  "duration": 10
}
```

## Response Format

Server-Sent Events (SSE) stream with events:
- `conversation_start`: Conversation begins
- `typing_start`: Speaker starts typing
- `typing_stop`: Speaker stops typing
- `message`: New conversation message
- `conversation_end`: Conversation completes
- `error`: Error occurred

## Files

- `index.ts`: Basic implementation with core functionality
- `index-enhanced.ts`: Advanced implementation with retry logic and enhanced error handling

## Error Handling

The function handles various error scenarios:
- Missing OpenAI API key
- Paper not found or not in SELECTED status
- Network timeouts and connection issues
- OpenAI API rate limits and errors

## Monitoring

All operations are logged with timestamps for debugging in Supabase Edge Function logs.