# Architecture & Design

## System Overview

Vid2Tweet is a Kestra-orchestrated application that turns a YouTube URL into a human-reviewed tweet. The frontend is intentionally thin on business logic, but it does include a small set of Next.js server routes for OAuth handling and server-side trigger orchestration.

## Core Components

### Next.js Frontend

- Collects the YouTube URL, YouTube cookies, and dry-run preference
- Starts the pipeline through `frontend/src/app/api/pipeline/trigger/route.ts`
- Polls Kestra for execution state
- Fetches generated artifacts from Kestra's file API
- Provides the approval UI for editing, approving, or rejecting the tweet
- Starts and manages the Connect X OAuth 2.0 flow through Next.js API routes

### Kestra Orchestrator

The main flow is `vid2tweet.content-pipeline`.

It:

- Runs `extract-image` and `download-audio` in parallel
- Transcribes audio through `transcribe-audio`
- Generates a tweet through `generate-tweet`
- Pauses for human approval for up to 24 hours
- Either posts the final tweet or records the rejection
- Persists the result into PostgreSQL

### PostgreSQL

The local stack uses one PostgreSQL server for two concerns:

- Kestra keeps its own orchestration metadata in the `kestra` database configured in `docker-compose.yml`
- Application-level pipeline outcomes are stored in the separate `vid2tweet` database created by `database/init/01-init-app-db.sql`

The application table is `pipeline_results`:

```sql
CREATE TABLE IF NOT EXISTS pipeline_results (
  id SERIAL PRIMARY KEY,
  youtube_url TEXT NOT NULL,
  tweet_text TEXT,
  tweet_id TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### External Integrations

- **YouTube**: source content, cookies-gated access, thumbnail host
- **Groq Whisper**: audio transcription
- **Groq Llama 3.3**: tweet generation
- **X / Twitter API**: tweet posting with either OAuth 2.0 or OAuth 1.0a credentials

## End-to-End Data Flow

1. User submits `youtube_url`, `youtube_cookies`, and optional `dry_run`
2. Frontend trigger route reads the optional `tw_access_token` cookie and forwards it as `twitter_oauth2_token`
3. Kestra starts `content-pipeline`
4. `extract-image` downloads the YouTube thumbnail and returns `thumbnail_uri` + `video_id`
5. `download-audio` fetches and compresses audio, enforcing the 20-minute and 25 MB limits
6. `transcribe-audio` calls Groq Whisper and creates `transcript.txt`
7. `generate-tweet` calls Groq chat completions and creates `tweet.txt`
8. `human_approval` pauses execution and waits for:
   - `approved: BOOLEAN`
   - `edited_tweet: STRING` (optional)
9. If approved, Kestra resolves the final tweet, validates the length, and calls `post-tweet`
10. If rejected, Kestra stores the rejection without posting
11. Frontend continues polling until the execution reaches a terminal state

## Flow Boundaries

### Main flow

- `kestra/workflows/content-pipeline.yml`

### Subflows

- `kestra/workflows/tasks/download-audio.yml`
- `kestra/workflows/tasks/extract-image.yml`
- `kestra/workflows/tasks/transcribe-audio.yml`
- `kestra/workflows/tasks/generate-tweet.yml`
- `kestra/workflows/tasks/post-tweet.yml`

See [Flow Reference](FLOWS.md) for the exact inputs, outputs, and retry behavior.

## Authentication Model

### Kestra authentication

The frontend talks to Kestra using Basic auth headers derived from:

- `NEXT_PUBLIC_KESTRA_URL`
- `NEXT_PUBLIC_KESTRA_USERNAME`
- `NEXT_PUBLIC_KESTRA_PASSWORD`

This matches the local development setup in `docker-compose.yml`.

For the current local demo, these values are exposed through `NEXT_PUBLIC_*` variables so the browser can call Kestra directly. That is convenient for development, but production deployments should move these credentials to server-only configuration and proxy Kestra access through trusted server routes.

### X authentication

Vid2Tweet currently has two real posting modes:

1. **OAuth 2.0 user token**
   - Started from `/api/auth/twitter`
   - Completed through `/api/auth/twitter/callback`
   - Token stored in `tw_access_token` httpOnly cookie
   - Used for text tweet posting when available

2. **OAuth 1.0a app/user secrets**
   - Stored as Kestra secrets
   - Used as the fallback posting path
   - Also handles thumbnail upload via the v1 media endpoint

There is also a **dry run** mode that skips network posting entirely.

## Artifact Handling

Kestra subflows expose files and URIs that the frontend consumes later:

- `audio_compressed.mp3`
- `transcript.txt`
- `tweet.txt`
- `final_tweet.txt`
- `thumbnail_uri`
- `tweet_result.json`

The frontend reads these artifacts through Kestra's file endpoint:

`/api/v1/main/executions/{id}/file?path={uri}`

## Failure and Limit Rules

- Videos longer than **20 minutes** fail in `download-audio`
- Compressed audio larger than **25 MB** fails in `download-audio`
- Empty or failed Groq responses fail the transcription/generation subflows
- Human approval expires after **24 hours** because `Pause.behavior` is `FAIL`
- Tweet text is revalidated after human edits before posting

## Deployment Shape

Local development runs through `docker-compose.yml`:

- `postgres`
- `dind`
- `kestra`
- `frontend` runs separately with `npm run dev`

The frontend is not a custom application backend, but it does expose minimal server routes for:

- OAuth 2.0 PKCE start and callback handling
- reading secure cookies such as `tw_access_token`
- forwarding `twitter_oauth2_token` into the Kestra trigger request

The deployment helper `scripts/deploy-flows.sh` uploads subflows first, then `content-pipeline` last, because the orchestrator depends on those subflows already existing in Kestra.

## Related Diagrams

- [System Context](diagrams/architecture/system-context.puml)
- [Container Diagram](diagrams/architecture/container-diagram.puml)
- [Pipeline Flow](diagrams/flows/pipeline-flow.puml)
- [Trigger Sequence](diagrams/sequences/trigger-pipeline.puml)
