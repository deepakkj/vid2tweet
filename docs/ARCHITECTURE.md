# Architecture & Design

## System Overview

Vid2Tweet is designed as a serverless-style application where Kestra serves as the primary backend and orchestration engine. The frontend interacts directly with Kestra's REST API to trigger workflows and retrieve execution status.

## Component Descriptions

### Kestra (Orchestration Engine)
- Acts as the central nervous system of the application.
- Manages long-running workflows, including human-in-the-loop pauses.
- Handles logging and state management for each execution.
- Provides a visual interface for monitoring pipeline health.

### Frontend (Next.js)
- A modern web interface built with Next.js and Tailwind CSS.
- Communicates with Kestra via its standard REST API.
- Provides a seamless user experience for submitting URLs and reviewing generated content.

### PostgreSQL (Persistence)
- Stores workflow metadata (managed by Kestra).
- Stores final pipeline results (YouTube URL, tweet text, tweet ID) in a dedicated table.

### External APIs
- **Groq Whisper**: High-speed audio transcription.
- **Groq Llama 3.3**: Advanced LLM for crafting engaging social media content.
- **Twitter/X API v2**: Publishing the final approved content.

## Data Flow

The core workflow follows a linear progression with a parallel start:

1.  **Submission**: User enters a YouTube URL in the frontend.
2.  **Trigger**: Frontend calls Kestra's `/api/v1/main/executions/{namespace}/{flowId}`.
3.  **Parallel Processing**:
    - `download_audio`: Uses `yt-dlp` to extract and compress audio to MP3.
    - `extract_image`: Uses `yt-dlp` and `ffmpeg` to grab a high-quality frame for the tweet.
4.  **Transcription**: The MP3 is sent to Groq Whisper for fast speech-to-text.
5.  **Generation**: The transcript is passed to Groq Llama 3.3 to generate a tweet.
6.  **Validation**: The generated tweet is checked for length constraints.
7.  **Human Approval**: The pipeline pauses. The user reviews the tweet and thumbnail in the frontend.
8.  **Resumption**: User approves (with optional edits) or rejects the content.
9.  **Publication**: If approved, the tweet (with media) is posted to Twitter/X.
10. **Persistence**: The final result is saved to the PostgreSQL database.

## File Passing Mechanism

Kestra uses an internal storage system for passing files between tasks.
- Tasks produce `outputFiles` which are stored in Kestra's backend.
- Downstream tasks reference these via URI strings (e.g., `{{ outputs.task_id.outputFiles['filename'] }}`).
- Kestra automatically handles the mapping and retrieval of these files into the task's execution environment.

## Secrets Management

Secrets are managed via environment variables and Kestra's secret mechanism.
- Raw secrets are stored in a `.env` file (not committed).
- The `./scripts/encode-secrets.sh` script prepares an `.env.encoded` file.
- Kestra loads these via `env_file` in `docker-compose.yml`.
- Workflows access them securely using `{{ secret('KEY_NAME') }}`.

## Diagrams

Visual representations of the system can be found in `docs/diagrams/`.
- [System Context](docs/diagrams/architecture/system-context.puml)
- [Container Diagram](docs/diagrams/architecture/container-diagram.puml)
- [Pipeline Flow](docs/diagrams/flows/pipeline-flow.puml)
- [Trigger Sequence](docs/diagrams/sequences/trigger-pipeline.puml)
