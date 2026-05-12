# Draft: Vid2Tweet — YouTube to Tweet AI Pipeline (Hackathon)

## Requirements (confirmed)
- **Platform**: Kestra workflow orchestration as the core engine
- **Goal**: Hackathon project — working demo, not production-complete
- **Infrastructure**: Podman (not Docker), all services containerized
- **Tunnel**: Use pinggy.io to expose to web
- **Repository**: GitHub personal repo
- **Kestra**: Running locally at http://localhost:8080/ (docker-compose.yml exists)

## Original Vision (Post-Hackathon)
- Upload YouTube video → Kestra orchestrates 9 AI agents → outputs 20+ content assets across 5 platforms
- Advanced features: multi-agent collab, human approval, AI memory, voice cloning, A/B testing, growth prediction, brand-safe scoring

## ============================================
## HACKATHON SCOPE (v2 — Dramatically Reduced)
## ============================================

### Core Concept (Hackathon)
**YouTube URL → Kestra orchestrates AI agents → Single tweet (text + image) posted to X/Twitter**

### Architecture Change: NO CUSTOM BACKEND
- **REMOVED**: NestJS backend entirely
- **Kestra IS the backend** — all orchestration, API calls, DB operations via Kestra plugins
- **Frontend**: Minimal Next.js page (URL input + status display) + Kestra UI for workflow visualization
- **Database operations**: Via Kestra PostgreSQL plugin (no ORM, no Prisma)

### Pipeline (Hackathon)
1. User pastes YouTube URL into minimal dashboard
2. Dashboard triggers Kestra workflow via REST API
3. Kestra orchestrates:
   a. **Download agent** — download video/audio from YouTube URL
   b. **Transcription agent** — Groq Whisper → transcript text
   c. **Tweet generation agent** — Groq Llama 3.3 → tweet text (≤280 chars)
   d. **Image extraction agent** — FFmpeg → extract best frame from video
   e. **Human approval checkpoint** — Kestra Pause → Dashboard shows preview
   f. **Twitter/X posting agent** — Post tweet (text + image) via Twitter API v2
4. Dashboard shows real-time progress + final result
5. Kestra UI shows beautiful workflow execution graph

### Real Integration
- **YouTube**: Input ONLY (download video via URL)
- **Twitter/X**: Output — real posting (text + image) via free tier API (500 tweets/month)

### Coming Soon (labeled in UI, NOT implemented)
- LinkedIn post
- Blog post generation
- YouTube upload (output)
- Short video clips
- Tweet threads (multi-tweet)
- Instagram, TikTok
- Growth prediction
- Multi-agent collaboration
- AI memory / voice cloning
- A/B testing
- Brand-safe scoring
- File upload (as input alternative)
- SEO optimization

### Tech Stack (Hackathon — Simplified)
- **Frontend**: Minimal Next.js + TypeScript (1-2 pages: upload + results)
- **Backend**: NONE — Kestra is the backend
- **Orchestration**: Kestra (core) — all logic in Kestra workflow YAML
- **AI**: Groq (Whisper transcription + Llama 3.3 text gen) — configurable
- **Video**: FFmpeg (frame extraction, run inside Kestra container task)
- **YouTube Download**: Kestra script task (yt-dlp or @distube/ytdl-core)
- **Twitter/X**: `twitter-api-v2` npm package — free tier supports image tweets
- **Database**: PostgreSQL via Kestra plugin (for storing results/state)
- **Containers**: Podman
- **Tunnel**: pinggy.io

### Human Approval (IN SCOPE)
- Kestra `io.kestra.plugin.core.flow.Pause` task
- After tweet + image are generated, workflow pauses
- Dashboard shows preview (tweet text + image)
- User approves/rejects via dashboard → resumes Kestra via API
- If approved → post to Twitter/X
- If rejected → workflow ends (or loops back for regeneration)

### API Keys Needed
- **Groq**: Free, signup at console.groq.com, instant approval
- **Twitter/X**: Free tier, signup at developer.x.com, OAuth 1.0a keys needed (4 keys: API key, API secret, access token, access token secret)

### Project Structure Principles (UNCHANGED)
- **Separation**: Frontend and Kestra workflows in separate folders
- **Code Principles**: DRY, SOLID, KISS, YAGNI
- **Modularity**: Component-based frontend, modular Kestra workflows
- **No global installs**: All packages in package.json
- **Documentation**: PlantUML diagrams in docs/diagrams/
- **Docs folder**: Dedicated `docs/` for documentation

## Research Findings

### Kestra Capabilities (Confirmed)
- **Workflow format**: YAML declarative — id, namespace, tasks, inputs, outputs, triggers
- **HTTP tasks**: `io.kestra.plugin.core.http.Request` — call any REST API
- **Pause/Resume**: `io.kestra.plugin.core.flow.Pause` — structured onResume inputs. Resume via API.
- **Parallel execution**: `io.kestra.plugin.core.flow.Parallel`
- **Webhook triggers**: `io.kestra.plugin.core.trigger.Webhook`
- **Script tasks**: Python & Node.js — run inside containers with dependencies
- **REST API**: Trigger flows, check status, get logs, resume paused, kill running
- **Data passing**: `{{ outputs.taskId.body }}` / `{{ outputs.taskId.stdout }}`
- **Error handling**: Retry policies, conditional branching, error handlers

### Kestra PostgreSQL Plugin (Confirmed)
- **Plugin**: `plugin-jdbc-postgres` v1.14.0
- **Task types**: Query, Queries (multi-statement + transactions), Batch (bulk insert), CopyIn, CopyOut, Trigger
- **Connection**: JDBC URL `jdbc:postgresql://host:port/database` + username/password
- **Fetch modes**: FETCH (in-memory rows), FETCH_ONE (single row), STORE (to file), NONE (no results)
- **Access results**: `{{ outputs.taskId.rows }}` (array), `{{ outputs.taskId.row }}` (single), `{{ outputs.taskId.size }}` (count)
- **Parameterized queries**: Named params with `:param` syntax + `parameters:` map, supports Kestra variables
- **Transactions**: `Queries` task has `transaction: true` (default) — wraps all statements atomically

### Kestra Secrets (Confirmed)
- **Syntax in YAML**: `{{ secret('KEY_NAME') }}`
- **Storage for local/Docker**: Base64-encoded environment variables
- **Setup flow**: `.env` file → base64 encode values → `SECRET_KEY_NAME=base64value` → docker-compose `env_file:`
- **Naming convention**: Env var `SECRET_GROQ_API_KEY` → referenced as `{{ secret('GROQ_API_KEY') }}`
- **Security**: Base64 is encoding only (not encryption). Fine for hackathon, use external manager for production.

### Twitter/X API (Confirmed)
- **Free tier**: 500 tweets/month, supports image upload (5MB max), 4 images per tweet
- **Auth**: OAuth 1.0a or OAuth 2.0 with PKCE (user context required for posting)
- **npm package**: `twitter-api-v2` — TypeScript, zero deps, handles media upload
- **Media upload**: Simple POST for images, chunked for videos
- **Approval**: Instant for most accounts at developer.x.com

### AI Free Tiers
- **Groq**: Llama 3.3 70B = 1,000 RPD, Whisper = 2,000 RPD, 25MB max. Handles demo easily.
- **For hackathon**: Groq ONLY is sufficient (transcription + text generation).

## ============================================
## ARCHITECTURE & SYSTEM DESIGN (Step 3)
## ============================================

### System Context (C4 Level 1)
- **Actors**: Creator (user), Twitter/X (external), YouTube (external), Groq AI (external)
- **System**: CreatorOS — Kestra orchestration + Next.js dashboard + PostgreSQL
- **Interactions**: Creator → Dashboard → Kestra → (YouTube download, Groq AI, FFmpeg, Twitter post)

### Container Diagram (C4 Level 2)
- **Next.js Frontend** (container) — Minimal UI, calls Kestra REST API directly
- **Kestra Server** (container) — Orchestration engine, runs workflows, manages state
- **PostgreSQL** (container) — Shared by Kestra (internal) + App data (separate DB `creatoros`)
- **Kestra Worker Containers** (ephemeral) — Spun up by Kestra for script tasks (FFmpeg, yt-dlp, Node.js)

### Database Design
**Database**: `creatoros` (separate from `kestra` DB, same PostgreSQL instance)

**Tables**:
- `pipelines` — Tracks each pipeline execution (YouTube URL → tweet)
  - id, youtube_url, kestra_execution_id, status, created_at, updated_at
- `generated_assets` — Stores generated content per pipeline
  - id, pipeline_id, asset_type (transcript/tweet_text/thumbnail), content, file_path, created_at
- `published_posts` — Records published tweets
  - id, pipeline_id, platform (twitter), post_id, post_url, posted_at

### Kestra Workflow Design
**Namespace**: `creatoros`
**Main flow**: `content-pipeline`

**Tasks (sequential + parallel)**:
1. `init_pipeline` — Insert pipeline record into `creatoros.pipelines` (PostgreSQL Query)
2. `download_video` — Shell script task: yt-dlp download in container
3. PARALLEL:
   a. `transcribe_audio` — HTTP Request to Groq Whisper API
   b. `extract_thumbnail` — Shell script: FFmpeg extract best frame
4. `generate_tweet` — HTTP Request to Groq Llama 3.3 (input: transcript)
5. `save_assets` — PostgreSQL Queries: insert transcript, tweet text, thumbnail path
6. `human_approval` — Pause task with onResume: approved (BOOLEAN), feedback (STRING)
7. IF approved:
   a. `post_to_twitter` — Node.js Script: twitter-api-v2 (upload image + post tweet)
   b. `save_published` — PostgreSQL Query: insert into published_posts
8. `update_pipeline_status` — PostgreSQL Query: update pipelines.status

### Frontend Pages
1. **Home/Upload** (`/`) — YouTube URL input, trigger button, "Coming Soon" feature cards
2. **Pipeline Status** (`/pipeline/[id]`) — Real-time status (polling Kestra API), generated assets preview, approve/reject buttons (when paused), final tweet link

### Docker Compose Services
1. `postgres` — PostgreSQL 18 (existing, add `creatoros` DB init)
2. `kestra` — Kestra server (existing, add secrets env_file)
3. `frontend` — Next.js container (new)

### Secrets Management
`.env` file (gitignored):
- GROQ_API_KEY
- TWITTER_API_KEY
- TWITTER_API_SECRET
- TWITTER_ACCESS_TOKEN
- TWITTER_ACCESS_SECRET

`.env.encoded` (base64 encoded, loaded by Kestra via `env_file`):
- SECRET_GROQ_API_KEY=base64(...)
- SECRET_TWITTER_API_KEY=base64(...)
- etc.

### README Structure
```
README.md
├── Project Name + Tagline + Badge
├── Demo GIF/Screenshot
├── What It Does (elevator pitch)
├── Architecture Overview (inline diagram or link)
├── Tech Stack table
├── Quick Start (3-step local setup)
├── Links:
│   ├── → docs/ARCHITECTURE.md (symlink to diagrams)
│   ├── → docs/DESIGN.md (symlink to system design)
│   ├── → docs/setup/LOCAL_SETUP.md
│   ├── → docs/CONTRIBUTING.md
│   └── → docs/ROADMAP.md (future scope + next steps)
├── Coming Soon features list
├── Hackathon Context
└── License
```

## Folder Structure (Revised — No Backend)
```
ai_content_creator_automation/
├── frontend/                    # Minimal Next.js + TypeScript
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── kestra/                      # Kestra workflow definitions
│   └── workflows/
│       ├── main-pipeline.yml    # Core: download → transcribe → generate → approve → post
│       └── _scripts/            # Helper scripts used by Kestra tasks
├── database/                    # Schema, migrations
│   ├── migrations/
│   └── schema.sql
├── docs/                        # Project documentation
│   ├── diagrams/                # PlantUML (.puml files)
│   │   ├── architecture/
│   │   ├── sequences/
│   │   ├── flows/
│   │   └── styles/
│   ├── setup/                   # Setup guides
│   └── README.md
├── .github/
│   ├── copilot-instructions.md
│   ├── agents/                  # TBD
│   ├── skills/                  # TBD
│   ├── hooks/                   # TBD
│   └── prompts/
├── DESIGN.md                    # Airtable design system
├── AGENTS.md                    # AI agent build instructions
├── docker-compose.yml           # All services (Kestra, PostgreSQL, frontend)
└── README.md
```
