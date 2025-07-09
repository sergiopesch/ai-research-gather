# The Notebook Pod - AI Research Paper Discovery & Podcast Generator

## About This Application

**The Notebook Pod** is an intelligent research paper discovery platform that transforms academic papers into engaging live podcast conversations. Using advanced AI, the application creates real-time dialogues between two AI hosts - Dr. Ada (research expert) and Sam (curious interviewer) - who discuss and explain research papers in an accessible, conversational format.

### Key Features

🔬 **Smart Paper Discovery**: Find relevant research papers using AI-powered search across academic databases
🎙️ **Live AI Conversations**: Watch two independent AI agents have real-time discussions about research papers
📚 **Research Areas**: Browse papers by specific domains (AI, Biology, Physics, etc.)
⚡ **Real-time Processing**: Stream conversations as they happen with typing indicators and live updates
🎯 **Accessible Explanations**: Complex research made understandable through natural dialogue

### How It Works

1. **Discover**: Search for research papers by topic or browse curated areas
2. **Select**: Choose papers that interest you for podcast generation
3. **Experience**: Watch Dr. Ada and Sam have live conversations about the research
4. **Learn**: Gain insights through engaging, accessible AI discussions

### Technology Stack

- **Frontend**: React + TypeScript with Vite
- **UI Components**: shadcn/ui with Tailwind CSS
- **Backend**: Supabase with Edge Functions
- **AI Integration**: OpenAI GPT models for conversation generation
- **Real-time Features**: Server-Sent Events for live streaming

---

## Project Info

**URL**: https://lovable.dev/projects/fbdc2b11-f7c6-49bb-8b98-cdbec6edcec5

## Development

### Local Setup

Requirements: Node.js & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm i

# Start development server
npm run dev
```

### Architecture

- **Frontend**: React SPA with routing and state management
- **Database**: Supabase PostgreSQL with real-time subscriptions
- **Edge Functions**: Paper discovery, processing, and podcast generation
- **AI Integration**: OpenAI API for natural language processing

## Deployment

Deploy instantly via [Lovable](https://lovable.dev/projects/fbdc2b11-f7c6-49bb-8b98-cdbec6edcec5) → Share → Publish

### Custom Domain

Connect your domain via Project > Settings > Domains. [Learn more](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

---

*Making academic research accessible through AI-powered conversations.*