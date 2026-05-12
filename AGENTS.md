# AGENTS.md — AI Agent Build Instructions for Vid2Tweet

## Project Overview
Vid2Tweet is a hackathon project that transforms YouTube videos into tweets using AI orchestration via Kestra workflows. The system downloads audio, transcribes it with Groq Whisper, generates a tweet with Groq Llama 3.3, extracts a thumbnail, gets human approval, and posts to Twitter/X.

## Tech Stack
- **Orchestration**: Kestra (workflow engine, REST API, visual DAG, Podman containers)
- **Frontend**: Next.js 14 (App Router, TypeScript, Tailwind CSS)
- **AI**: Groq (whisper-large-v3 for transcription, llama-3.3-70b-versatile for tweet generation)
- **Social**: Twitter/X API v2 (twitter-api-v2 npm package, OAuth 1.0a)
- **Database**: PostgreSQL (via Kestra JDBC plugin)
- **Infrastructure**: Podman + Docker Compose

## File Structure
```
kestra/workflows/          # Kestra YAML workflow definitions
kestra/workflows/tasks/    # Individual agent task flows (for isolated testing)
frontend/src/app/          # Next.js App Router pages
frontend/src/lib/          # Kestra API client (kestra-client.ts)
frontend/src/types/        # TypeScript interfaces (kestra.ts)
database/init/             # PostgreSQL init scripts
scripts/                   # encode-secrets.sh, deploy-flows.sh
docs/                      # Architecture docs, setup guides, PlantUML diagrams
```

## Coding Conventions
- **DRY**: Extract shared logic, avoid repetition
- **SOLID**: Single responsibility per task/component
- **KISS**: Hackathon scope — simple over clever
- **YAGNI**: No speculative features

## Rules (NEVER VIOLATE)
- No global npm installs — all packages in frontend/package.json
- No custom backend server — Kestra IS the backend
- No hardcoded API keys — use `{{ secret('KEY') }}` in Kestra YAML
- No audio chunking — hard 20-min video limit with error exit
- No retry/recovery logic beyond basic try/catch

## Kestra Workflow Conventions
- Flow ID: kebab-case (e.g., `content-pipeline`, `download-audio`)
- Namespace: `vid2tweet`
- Task IDs: snake_case (e.g., `download_audio`, `transcribe_audio`)
- Secrets: `{{ secret('GROQ_API_KEY') }}` — resolved from SECRET_GROQ_API_KEY env var
- File passing: `outputFiles` lists files in working dir; `inputFiles` maps filename → Kestra URI
- Shell tasks: copy files from /tmp to working dir before listing in outputFiles

## Frontend Conventions
- All pages are 'use client' components
- API calls go through `frontend/src/lib/kestra-client.ts`
- Types defined in `frontend/src/types/kestra.ts`
- Tailwind CSS for all styling — no custom CSS files
- useEffect + setInterval for polling (no WebSockets)

## Common Commands
```bash
# Start all services
podman compose up -d

# Encode secrets (run after filling .env)
./scripts/encode-secrets.sh

# Deploy Kestra flows
./scripts/deploy-flows.sh

# Start frontend dev server
cd frontend && npm run dev

# Build frontend
cd frontend && npm run build
```

## API Keys Required
- `GROQ_API_KEY`: From https://console.groq.com
- `TWITTER_API_KEY`, `TWITTER_API_SECRET`: From https://developer.twitter.com
- `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_SECRET`: From Twitter Developer Portal
