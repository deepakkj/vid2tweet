# Vid2Tweet — YouTube to Tweet AI Pipeline

> Transform any YouTube video into a tweet with AI-powered transcription, generation, and human approval — all orchestrated by Kestra.

![Demo](docs/assets/demo.gif)

## How It Works

1. **Paste a YouTube URL** → Vid2Tweet downloads and transcribes the audio
2. **AI generates a tweet** → Groq Llama 3.3 crafts an engaging tweet from the transcript
3. **You review and approve** → Preview the tweet + thumbnail, edit if needed
4. **Tweet is posted** → Automatically published to Twitter/X with the extracted thumbnail

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Orchestration | [Kestra](https://kestra.io) — visual workflow engine |
| Frontend | Next.js (App Router, TypeScript, Tailwind CSS) |
| Transcription | Groq Whisper (whisper-large-v3) |
| Tweet Generation | Groq Llama 3.3 70B |
| Social Posting | Twitter/X API v2 (twitter-api-v2) |
| Database | PostgreSQL (via Kestra JDBC plugin) |
| Infrastructure | Podman + Docker Compose |

## Quick Start

### Prerequisites
- [Podman Desktop](https://podman-desktop.io/) or Docker
- Node.js 20+
- API keys: [Groq](https://console.groq.com) + [Twitter Developer](https://developer.twitter.com)
```bash
GROQ_API_KEY: This is Grok API Key
TWITTER_API_KEY: This is the "Consumer Key" under OAuth 1.0 Keys.
TWITTER_API_SECRET: This is the "Consumer Secret" under OAuth 1.0 Keys.
TWITTER_ACCESS_TOKEN: This is the "Access Token" under OAuth 1.0 Keys (not the OAuth 2.0 section).
TWITTER_ACCESS_SECRET: This is the "Access Token Secret" under OAuth 1.0 Keys (you may need to click "Generate" to reveal it if not shown).
```

### Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd ai_content_creator_automation

# 2. Configure API keys
cp .env.example .env
# Edit .env with your actual API keys

# 3. Encode secrets for Kestra
./scripts/encode-secrets.sh

# 4. Start all services
podman compose up -d

# 5. Deploy Kestra workflows automatically
./scripts/deploy-flows.sh
 # or deploy Kestra workflows manually
 
# If you're deploying manually via the UI (not the script), the order is:
# 1. download-audio.yml
# 2. extract-image.yml
# 3. transcribe-audio.yml
# 4. generate-tweet.yml
# 5. post-tweet.yml
# 6. content-pipeline.yml ← last, after all subflows exist

# 6. Start the frontend
cd frontend && npm install && npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app.
Open [http://localhost:8080](http://localhost:8080) to see the Kestra workflow UI.

## Architecture Overview

Vid2Tweet uses Kestra as the sole backend — no custom server needed. The frontend calls Kestra's REST API directly.

```
YouTube URL → Kestra Pipeline → Human Approval → Twitter/X
                    ↓
              PostgreSQL (results)
```

See [Architecture & Design](docs/ARCHITECTURE.md) for detailed diagrams.

## Documentation

- [Architecture & Design](docs/ARCHITECTURE.md)
- [Local Setup Guide](docs/setup/LOCAL_SETUP.md)
- [Contributing](docs/CONTRIBUTING.md)
- [Future Scope & Roadmap](docs/ROADMAP.md)
- [Design System](DESIGN.md)

## Coming Soon

- LinkedIn Posts
- Blog Articles
- YouTube Shorts
- Instagram Reels
- TikTok Videos
- Growth Prediction
- AI Memory
- A/B Testing
- Brand-Safe Scoring

## License

MIT
