# Flow Reference

## Overview

Vid2Tweet is built around one orchestration flow and five task subflows.

## AI Models Used

- **Groq Whisper (whisper-large-v3):** Used for audio transcription in the `transcribe-audio` subflow.
- **Groq Llama 3.3 (llama-3.3-70b-versatile):** Used for tweet generation in the `generate-tweet` subflow.

## Flow Inventory

| Flow | Purpose |
|------|---------|
| `content-pipeline` | Main orchestrator for the full tweet pipeline |
| `download-audio` | Download and compress audio from YouTube |
| `extract-image` | Resolve video ID and fetch the thumbnail |
| `transcribe-audio` | Transcribe audio with Groq Whisper |
| `generate-tweet` | Generate and validate a tweet draft |
| `post-tweet` | Post to X or return a dry-run result |
| `_smoke-test` | Simple runtime verification flow |

## Orchestrator: `content-pipeline`

**Path:** `kestra/workflows/content-pipeline.yml`

### Inputs

- `youtube_url: STRING`
- `youtube_cookies: STRING`
- `dry_run: BOOLEAN = false`
- `twitter_oauth2_token: STRING` (optional)

### Outputs

- `generated_tweet_text`
- `generated_tweet_uri`
- `transcript_uri`
- `thumbnail_uri`
- `video_id`

### Execution Order

1. `prepare_assets` runs in parallel
   - `fetch_thumbnail` → `extract-image`
   - `download_audio` → `download-audio`
2. `transcribe_audio` → `transcribe-audio`
3. `generate_tweet` → `generate-tweet`
4. `human_approval` pause
5. Branch:
   - approve → resolve final tweet → `post-tweet` → save result
   - reject → save rejection

### Human Approval Contract

Pause resumes with:

- `approved: BOOLEAN`
- `edited_tweet: STRING` (optional)

Behavior notes:

- pause duration is `PT24H`
- timeout behavior is `FAIL`
- edited tweets override the generated tweet
- final tweet length is checked again before posting

### Persistence

Both approval branches write to PostgreSQL table `pipeline_results` with a final status of `POSTED` or `REJECTED`.

## Subflow: `download-audio`

**Path:** `kestra/workflows/tasks/download-audio.yml`

### Inputs

- `youtube_url`
- `youtube_cookies`

### Outputs

- `audio_file_uri`
- `metadata_file_uri`

### Behavior

- Uses `yt-dlp` and `ffmpeg`
- Rejects videos longer than 20 minutes
- Compresses audio to mono MP3 at 16 kHz / 32 kbps
- Rejects compressed output larger than 25 MB
- Produces `audio_compressed.mp3` and `metadata.txt`
- Retries twice with a constant 10-second interval

## Subflow: `extract-image`

**Path:** `kestra/workflows/tasks/extract-image.yml`

### Inputs

- `youtube_url`

### Outputs

- `video_id`
- `thumbnail_uri`

### Behavior

- Supports standard watch URLs, `youtu.be`, and `shorts` URLs
- Fetches `hqdefault.jpg` from YouTube's static thumbnail host
- Retries download three times with a constant 5-second interval

## Subflow: `transcribe-audio`

**Path:** `kestra/workflows/tasks/transcribe-audio.yml`

### Inputs

- `audio_file_uri`

### Outputs

- `transcript_uri`
- `transcript_text`

### Behavior

- Uses `python:3.11-slim`
- Calls `https://api.groq.com/openai/v1/audio/transcriptions`
- Uses model `whisper-large-v3`
- Writes `transcript.txt`
- Retries three times with a constant 10-second interval

### Required Secret

- `GROQ_API_KEY`

## Subflow: `generate-tweet`

**Path:** `kestra/workflows/tasks/generate-tweet.yml`

### Inputs

- `transcript`

### Outputs

- `tweet_file_uri`
- `tweet_text`

### Behavior

- Calls Groq chat completions
- Uses model `llama-3.3-70b-versatile`
- Prompts for a single tweet with hashtags and no extra wrapper text
- Writes `tweet.txt`
- Fails if the tweet exceeds 280 characters
- Retries the HTTP call with exponential backoff up to three attempts

### Required Secret

- `GROQ_API_KEY`

## Subflow: `post-tweet`

**Path:** `kestra/workflows/tasks/post-tweet.yml`

### Inputs

- `tweet_text`
- `video_id` (optional)
- `twitter_oauth2_token` (optional)
- `dry_run: BOOLEAN = true`

### Outputs

- `tweet_id`
- `tweet_text`
- `tweet_result_uri`

### Posting Modes

#### Dry run

- returns a synthetic `tweet_id`
- writes `tweet_result.json`
- does not call X APIs

#### OAuth 2.0 token path

- used when `twitter_oauth2_token` is provided
- posts through `client.v2.tweet({ text })`
- best fit for connected user posting from the frontend flow

#### OAuth 1.0a secret path

- used when no OAuth 2.0 token is provided
- loads credentials from Kestra secrets
- downloads the YouTube thumbnail if `video_id` is present
- uploads media through the v1 media API and then posts the tweet

### Required Secrets for OAuth 1.0a mode

- `TWITTER_API_KEY`
- `TWITTER_API_SECRET`
- `TWITTER_ACCESS_TOKEN`
- `TWITTER_ACCESS_SECRET`

## Smoke Test Flow

**Path:** `kestra/workflows/_smoke-test.yml`

Use this as a quick runtime check when verifying the Kestra task runner or local container environment.

## Deployment Order

Deploy in this order:

1. `download-audio`
2. `extract-image`
3. `transcribe-audio`
4. `generate-tweet`
5. `post-tweet`
6. `content-pipeline`

This matches `scripts/deploy-flows.sh`.
