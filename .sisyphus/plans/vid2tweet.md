# Vid2Tweet — YouTube to Tweet AI Pipeline

## TL;DR

> **Quick Summary**: Build a hackathon demo that takes a YouTube URL, orchestrates AI agents via Kestra workflows to transcribe the video, generate a tweet + extract a thumbnail, get human approval, and post to Twitter/X — all automated through a visual Kestra pipeline with a minimal Next.js dashboard.
>
> **Deliverables**:
> - Kestra workflow YAML (the star of the demo)
> - 5 AI agent tasks (download, transcribe, extract image, generate tweet, post to Twitter)
> - Human approval checkpoint (Kestra Pause + dashboard approve/reject)
> - Minimal Next.js dashboard (2 pages: URL input + pipeline status/approval)
> - Docker Compose for all services (PostgreSQL + Kestra + dev setup)
> - Documentation (README, architecture docs, PlantUML diagrams, setup guide)
> - DESIGN.md (Airtable design system), AGENTS.md, .github/ scaffolding
>
> **Estimated Effort**: Medium (~18-24 hours of focused work within 48h window)
> **Parallel Execution**: YES — 6 waves
> **Critical Path**: docker-compose fix → smoke test → individual agent tasks → assemble workflow → frontend pages → end-to-end test

---

## Context

### Original Request
Hackathon project showcasing Kestra workflow orchestration. Originally "AI Creator Operating System" with 9 agents across 5 platforms. Scope reduced to "Vid2Tweet" — YouTube URL → single tweet (text + image) posted to Twitter/X.

### Interview Summary
**Key Discussions**:
- 48-hour hackathon, free AI tiers only, Podman containers
- Scope reduced from 9 agents → 5 tasks, from 5 platforms → Twitter/X only
- No custom backend — Kestra IS the backend (plugins for DB, HTTP, scripts)
- Groq only (Whisper + Llama 3.3), no Gemini needed for this scope
- Human approval checkpoint = core demo differentiator
- Real Twitter/X posting via free tier (500 tweets/month)
- User explicitly requested: PlantUML diagrams, DESIGN.md (getdesign), AGENTS.md, .github/ scaffolding, docs/ folder with symlinks from README

**Research Findings**:
- Kestra: Full REST API, Pause/Resume, Parallel tasks, PostgreSQL plugin, Script tasks in containers
- Kestra secrets: base64-encoded env vars with `SECRET_` prefix, referenced as `{{ secret('KEY') }}`
- Kestra file passing: Script tasks use `outputFiles`/`inputFiles` for inter-task file transfer
- Groq: 1,000 RPD Llama 3.3, 2,000 RPD Whisper, 25MB file limit
- Twitter/X: Free tier supports image tweets, `twitter-api-v2` npm package, OAuth 1.0a
- Kestra CORS: DISABLED by default — must enable `MICRONAUT_SERVER_CORS_ENABLED: "true"`
- Groq Whisper needs multipart file upload — must use Python Script task, NOT HTTP Request

### Metis Review
**Identified Gaps** (addressed):
- **CORS disabled** → Added to docker-compose fix (Task 1)
- **`depends_on: service_started`** → Changed to `service_healthy` (Task 1)
- **File passing between tasks not designed** → Designed using `outputFiles`/`inputFiles` mechanism (Task 9)
- **Groq Whisper multipart upload** → Changed from HTTP Request to Python Script task (Task 5)
- **Audio size >25MB for long videos** → Added FFmpeg compression step + 20-min hard limit (Task 4)
- **`--no-playlist` flag missing** → Added to yt-dlp command (Task 4)
- **Tweet length >280 chars** → Added validation before posting (Task 9)
- **Rejection flow undefined** → Defined: reject = terminate with REJECTED status (Task 9)
- **DB schema redundant** → Minimized to 1 table for plugin showcase; Kestra execution API is primary state store
- **Flow deployment mechanism** → Deploy via Kestra REST API using curl script (Task 9)

---

## Work Objectives

### Core Objective
Demonstrate Kestra's workflow orchestration capabilities through a working end-to-end pipeline that transforms a YouTube video into a tweet posted to Twitter/X, with human approval in the loop.

### Concrete Deliverables
- `docker-compose.yml` — All services running (PostgreSQL, Kestra, frontend dev)
- `kestra/workflows/content-pipeline.yml` — Main Kestra workflow
- `frontend/` — Next.js app with 2 pages (home + pipeline status)
- `docs/` — Architecture docs, setup guide, PlantUML diagrams
- `README.md` — Project overview with symlinks to docs
- `DESIGN.md` — Airtable design system (via getdesign)
- `AGENTS.md` — AI agent build instructions
- `.github/` — Copilot instructions + placeholder structure
- `scripts/` — Secrets encoder, flow deployer
- `.env.example` — Template for API keys

### Definition of Done
- [ ] `podman compose up` starts all services without errors
- [ ] Paste YouTube URL → Kestra workflow executes → tweet posted to Twitter/X
- [ ] Human approval checkpoint pauses workflow, dashboard shows preview
- [ ] Approve → tweet posts. Reject → pipeline terminates.
- [ ] Kestra UI shows visual workflow graph during execution
- [ ] README clearly explains the product with symlinks to docs

### Must Have
- Working end-to-end pipeline (URL → tweet posted)
- Kestra visual workflow (THE demo for judges)
- Human approval with dashboard approve/reject
- Real Twitter/X posting
- README with architecture, setup, future scope links

### Must NOT Have (Guardrails)
- No custom backend server (NestJS, Express, etc.)
- No global npm installs — all packages repo-scoped
- No audio chunking logic — hard 20-min video limit instead
- No retry/recovery logic beyond basic try/catch
- No real implementation of "Coming Soon" features
- No over-engineered design system — use Tailwind defaults with DESIGN.md guidance
- No production-grade OAuth flow — hardcoded tokens for hackathon
- No concurrent pipeline support — one at a time is fine

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO (greenfield)
- **Automated tests**: None — hackathon scope, QA scenarios only
- **Framework**: None

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Kestra workflows**: Use Bash (curl) — trigger flow, poll status, check outputs
- **Frontend**: Use Playwright — navigate, interact, assert DOM, screenshot
- **Infrastructure**: Use Bash — `podman compose up`, verify services respond

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — start immediately):
├── Task 1: Fix docker-compose.yml + infrastructure setup [quick]
└── Task 2: Project scaffolding (folders, configs, scripts) [quick]

Wave 2 (Validation — depends on Wave 1):
└── Task 3: Smoke test — Kestra + Podman script task [quick]

Wave 3 (Core Build — MAX PARALLEL, depends on Task 3):
├── Task 4: Download agent (yt-dlp + FFmpeg audio + validation) [deep]
├── Task 5: Transcription agent (Python script → Groq Whisper) [deep]
├── Task 6: Image extraction agent (FFmpeg best frame) [unspecified-high]
├── Task 7: Tweet generation agent (HTTP Request → Groq Llama) [unspecified-high]
├── Task 8: Twitter posting agent (Node.js script → twitter-api-v2) [deep]
└── Task 10: Next.js project setup + Kestra API client [quick]

Wave 4 (Assembly + UI — depends on Wave 3):
├── Task 9: Assemble full Kestra workflow (wire all tasks) [deep]
├── Task 11: Home page (URL input + pipeline list) [visual-engineering]
└── Task 12: Pipeline status + approval page [visual-engineering]

Wave 5 (Integration + Docs — depends on Wave 4):
├── Task 13: End-to-end testing + debugging [deep]
├── Task 14: Documentation (README, docs/, setup guide) [writing]
├── Task 15: PlantUML diagrams [unspecified-high]
└── Task 16: AGENTS.md + DESIGN.md + .github/ setup [quick]

Wave FINAL (Review — after ALL tasks):
├── F1: Plan compliance audit (oracle)
├── F2: Code quality review (unspecified-high)
├── F3: Real manual QA (unspecified-high)
└── F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | - | 3, 10 | 1 |
| 2 | - | 3 | 1 |
| 3 | 1, 2 | 4, 5, 6, 7, 8 | 2 |
| 4 | 3 | 9 | 3 |
| 5 | 3 | 9 | 3 |
| 6 | 3 | 9 | 3 |
| 7 | 3 | 9 | 3 |
| 8 | 3 | 9 | 3 |
| 9 | 4, 5, 6, 7, 8 | 12, 13 | 4 |
| 10 | 1 | 11, 12 | 3 |
| 11 | 10 | 13 | 4 |
| 12 | 10, 9 | 13 | 4 |
| 13 | 9, 11, 12 | 14 | 5 |
| 14 | 13 | - | 5 |
| 15 | - | - | 5 |
| 16 | - | - | 5 |

### Agent Dispatch Summary

- **Wave 1**: 2 tasks — T1 → `quick`, T2 → `quick`
- **Wave 2**: 1 task — T3 → `quick`
- **Wave 3**: 6 tasks — T4 → `deep`, T5 → `deep`, T6 → `unspecified-high`, T7 → `unspecified-high`, T8 → `deep`, T10 → `quick`
- **Wave 4**: 3 tasks — T9 → `deep`, T11 → `visual-engineering`, T12 → `visual-engineering`
- **Wave 5**: 4 tasks — T13 → `deep`, T14 → `writing`, T15 → `unspecified-high`, T16 → `quick`
- **FINAL**: 4 tasks — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [x] 1. Fix docker-compose.yml + Infrastructure Setup

  **What to do**:
  - Fix existing `docker-compose.yml`:
    - Add `MICRONAUT_SERVER_CORS_ENABLED: "true"` to kestra environment (frontend CORS)
    - Change `depends_on` postgres condition from `service_started` to `service_healthy`
    - Add `env_file: .env.encoded` to kestra service (secrets loading)
    - Mount kestra workflows directory for development: `./kestra/workflows:/app/workflows`
  - Add `creatoros` database creation to postgres init:
    - Create `database/init/01-init-app-db.sql` that creates `vid2tweet` database and a minimal `pipeline_results` table (1 table to showcase Kestra PostgreSQL plugin)
    - Mount init script: `./database/init:/docker-entrypoint-initdb.d`
  - Create `.env.example` with all required API keys (GROQ_API_KEY, TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET)
  - Create `.gitignore` (node_modules, .env, .env.encoded, .next, dist, .sisyphus/evidence/)
  - Create `scripts/encode-secrets.sh` that reads `.env` and outputs `.env.encoded` with base64-encoded values prefixed with `SECRET_`

  **Must NOT do**:
  - Do not create more than 1 app table (YAGNI — Kestra execution API is primary state store)
  - Do not add authentication to any service
  - Do not modify the existing Kestra configuration structure beyond the additions listed

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - **Reason**: Small config file edits, no complex logic

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Task 3 (smoke test)
  - **Blocked By**: None

  **References**:
  - `docker-compose.yml` (root) — Current Kestra + PostgreSQL config. Study existing structure before modifying.
  - Kestra docs: CORS requires `MICRONAUT_SERVER_CORS_ENABLED: "true"` as environment variable
  - Kestra secrets: env vars with `SECRET_` prefix, base64-encoded values, loaded via `env_file`
  - PostgreSQL: `/docker-entrypoint-initdb.d/*.sql` scripts run on first startup only

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: All services start without errors
    Tool: Bash
    Preconditions: .env file exists with valid (or placeholder) API keys, .env.encoded generated
    Steps:
      1. Run `podman compose down -v` to clean state
      2. Run `scripts/encode-secrets.sh` to generate .env.encoded
      3. Run `podman compose up -d`
      4. Wait 30 seconds for services to initialize
      5. Run `podman compose ps` — assert all services show "Up" or "running"
      6. Run `curl -s http://localhost:8080/api/v1/main/flows` — assert HTTP 200
      7. Run `podman compose exec postgres psql -U kestra -d vid2tweet -c "SELECT 1"` — assert success
    Expected Result: PostgreSQL responds on vid2tweet DB, Kestra API responds on :8080
    Failure Indicators: Service shows "Exited", curl returns connection refused, psql fails
    Evidence: .sisyphus/evidence/task-1-services-up.txt

  Scenario: CORS headers present on Kestra API
    Tool: Bash (curl)
    Preconditions: Services running
    Steps:
      1. Run `curl -s -I -X OPTIONS http://localhost:8080/api/v1/main/flows -H "Origin: http://localhost:3000"` 
      2. Assert response contains `Access-Control-Allow-Origin` header
    Expected Result: CORS headers present in response
    Failure Indicators: No CORS headers, 403 response
    Evidence: .sisyphus/evidence/task-1-cors-headers.txt
  ```

  **Commit**: YES (groups with Task 2)
  - Message: `chore: infrastructure setup — docker-compose, scaffolding, configs`
  - Files: `docker-compose.yml`, `database/init/`, `.env.example`, `.gitignore`, `scripts/`
  - Pre-commit: `podman compose config` (validate compose file syntax)

- [x] 2. Project Scaffolding (folders, configs, placeholder files)

  **What to do**:
  - Create directory structure:
    ```
    frontend/                    (empty — populated in Task 10)
    kestra/workflows/            (empty — populated in Task 9)
    database/init/               (created in Task 1)
    database/migrations/         (empty placeholder)
    docs/diagrams/architecture/  
    docs/diagrams/sequences/     
    docs/diagrams/flows/         
    docs/diagrams/styles/        
    docs/setup/                  
    docs/                        (with README.md placeholder)
    .github/copilot-instructions.md  (minimal: project name, tech stack, folder structure)
    .github/agents/              (empty — user will specify later)
    .github/skills/              (empty — user will specify later)
    .github/hooks/               (empty — user will specify later)
    .github/prompts/             (empty — user will specify later)
    scripts/                     (encode-secrets.sh created in Task 1)
    ```
  - Create `.github/copilot-instructions.md` with minimal content: project name (Vid2Tweet), tech stack, folder structure, coding conventions (DRY, SOLID, KISS, YAGNI), no global installs rule
  - Create placeholder `docs/README.md` with folder index

  **Must NOT do**:
  - Do not create source code files (those come in later tasks)
  - Do not install any npm packages yet
  - Do not create AGENTS.md or DESIGN.md yet (Task 16)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - **Reason**: Directory creation and placeholder files only

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Task 3 (smoke test)
  - **Blocked By**: None

  **References**:
  - Folder structure from approved architecture design (see Context section)
  - GitHub Copilot instructions format: `.github/copilot-instructions.md` — plain markdown, no frontmatter

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: All directories and placeholder files exist
    Tool: Bash
    Steps:
      1. Verify directories exist: `ls -d frontend kestra/workflows database/init database/migrations docs/diagrams/architecture docs/diagrams/sequences docs/diagrams/flows docs/diagrams/styles docs/setup .github/agents .github/skills .github/hooks .github/prompts scripts`
      2. Verify files exist: `ls .github/copilot-instructions.md docs/README.md`
      3. Assert all commands return 0 exit code
    Expected Result: All directories and files present
    Failure Indicators: "No such file or directory" error
    Evidence: .sisyphus/evidence/task-2-scaffolding.txt
  ```

  **Commit**: YES (groups with Task 1)
  - Message: `chore: infrastructure setup — docker-compose, scaffolding, configs`
  - Files: all new directories and placeholder files

- [x] 3. Smoke Test — Kestra + Podman Script Task

  **What to do**:
  - Create a minimal Kestra test flow (`kestra/workflows/_smoke-test.yml`):
    ```yaml
    id: smoke-test
    namespace: vid2tweet
    tasks:
      - id: hello_script
        type: io.kestra.plugin.scripts.shell.Commands
        containerImage: "alpine:latest"
        commands:
          - echo "Hello from Kestra + Podman!"
          - date
    ```
  - Deploy the flow to Kestra via REST API:
    `curl -X POST http://localhost:8080/api/v1/main/flows -H "Content-Type: application/x-yaml" -d @kestra/workflows/_smoke-test.yml`
  - Trigger the flow and verify it completes successfully
  - This validates: Kestra can spin up containers via Podman socket, script tasks execute, outputs are captured
  - **This MUST pass before any pipeline work begins** — if it fails, the entire architecture is broken

  **Must NOT do**:
  - Do not proceed to Wave 3 tasks if this fails
  - Do not try to fix Podman socket issues by switching to Docker

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - **Reason**: Simple validation — create YAML, deploy, trigger, verify

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (sequential)
  - **Blocks**: Tasks 4, 5, 6, 7, 8 (all agent tasks)
  - **Blocked By**: Tasks 1, 2

  **References**:
  - Kestra Script task: `io.kestra.plugin.scripts.shell.Commands` with `containerImage`
  - Kestra flow deploy API: `POST /api/v1/main/flows` with `Content-Type: application/x-yaml`
  - Kestra trigger API: `POST /api/v1/main/executions/{namespace}/{flowId}`
  - Kestra execution status API: `GET /api/v1/main/executions/{executionId}`

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Kestra executes a shell script in a container via Podman
    Tool: Bash (curl)
    Preconditions: Services running (Task 1 complete)
    Steps:
      1. Deploy flow: `curl -X POST http://localhost:8080/api/v1/main/flows -H "Content-Type: application/x-yaml" -d @kestra/workflows/_smoke-test.yml`
      2. Assert HTTP 200 or 201
      3. Trigger execution: `curl -X POST http://localhost:8080/api/v1/main/executions/vid2tweet/smoke-test`
      4. Capture execution ID from response
      5. Poll status every 5s for max 60s: `curl -s http://localhost:8080/api/v1/main/executions/{EXEC_ID} | jq '.state.current'`
      6. Assert final state is "SUCCESS"
      7. Check logs contain "Hello from Kestra + Podman!": `curl -s http://localhost:8080/api/v1/main/logs/{EXEC_ID}`
    Expected Result: Execution state = "SUCCESS", logs contain hello message
    Failure Indicators: State = "FAILED", timeout after 60s, container image pull failure
    Evidence: .sisyphus/evidence/task-3-smoke-test.txt

  Scenario: Smoke test fails — Podman socket not accessible
    Tool: Bash
    Preconditions: Services running but Podman socket misconfigured
    Steps:
      1. Run same trigger as happy path
      2. Check execution state
    Expected Result: Execution state = "FAILED" with clear error about Docker/container socket
    Failure Indicators: Silent failure with no logs
    Evidence: .sisyphus/evidence/task-3-smoke-test-error.txt
  ```

  **Commit**: YES
  - Message: `test: smoke test Kestra + Podman script task execution`
  - Files: `kestra/workflows/_smoke-test.yml`
  - Pre-commit: smoke test must pass

- [x] 4. Download Agent — yt-dlp Audio Extraction + FFmpeg Compression

  **What to do**:
  - Create standalone Kestra flow file `kestra/workflows/tasks/download-audio.yml` for isolated testing
  - Kestra task type: `io.kestra.plugin.scripts.shell.Commands` with `containerImage: "python:3.11-slim"`
  - Install yt-dlp and ffmpeg inside container via `beforeCommands`:
    ```
    pip install yt-dlp
    apt-get update && apt-get install -y ffmpeg
    ```
  - Download audio-only from YouTube URL (input: `{{ inputs.youtube_url }}`):
    ```bash
    yt-dlp --no-playlist -x --audio-format wav -o "/tmp/audio.wav" "{{ inputs.youtube_url }}"
    ```
  - Validate video duration ≤ 20 minutes:
    ```bash
    DURATION=$(ffprobe -v error -show_entries format=duration -of csv=p=0 /tmp/audio.wav)
    if (( $(echo "$DURATION > 1200" | bc -l) )); then
      echo "ERROR: Video exceeds 20-minute limit ($DURATION seconds)" >&2
      exit 1
    fi
    ```
  - Compress audio for Groq Whisper (must be <25MB):
    ```bash
    ffmpeg -i /tmp/audio.wav -ar 16000 -ac 1 -b:a 32k /tmp/audio_compressed.mp3
    ```
  - Extract video title and thumbnail URL via yt-dlp metadata:
    ```bash
    yt-dlp --no-playlist --print title --print thumbnail -o - "{{ inputs.youtube_url }}" > /tmp/metadata.txt
    ```
  - Output files via Kestra `outputFiles`:
    ```yaml
    outputFiles:
      - audio_compressed.mp3
      - metadata.txt
    ```
  - Also create a test wrapper flow that supplies a sample YouTube URL input and triggers this task

  **Must NOT do**:
  - Do not implement audio chunking for long videos — hard 20-min limit with error exit
  - Do not download video (audio only)
  - Do not use `@distube/ytdl-core` — use yt-dlp in shell for simplicity
  - Do not hardcode YouTube URLs — accept as flow input

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []
  - **Reason**: Shell scripting with multiple tools (yt-dlp, FFmpeg, ffprobe), file size validation, Kestra outputFiles wiring — needs careful integration

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 5, 6, 7, 8, 10)
  - **Blocks**: Task 9 (full pipeline assembly)
  - **Blocked By**: Task 3 (smoke test must pass)

  **References**:

  **Pattern References**:
  - `kestra/workflows/_smoke-test.yml` (created in Task 3) — Base pattern for shell Commands task with containerImage

  **API/Type References**:
  - Kestra `io.kestra.plugin.scripts.shell.Commands` — `containerImage`, `beforeCommands`, `commands`, `outputFiles` properties
  - Kestra inputs: `{{ inputs.youtube_url }}` — passed from parent flow or direct trigger
  - Kestra outputFiles: files written to working directory are captured if listed in `outputFiles` array

  **External References**:
  - yt-dlp: `--no-playlist -x --audio-format wav` for audio extraction; `--print title --print thumbnail` for metadata
  - FFmpeg: `-ar 16000 -ac 1 -b:a 32k` compresses to ~240KB/min (20 min = ~4.8MB, well under 25MB)
  - ffprobe: `-show_entries format=duration` returns duration in seconds

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Download and compress audio from a short Creative Commons YouTube video
    Tool: Bash (curl)
    Preconditions: Kestra running, flow deployed
    Steps:
      1. Deploy flow: `curl -X POST http://localhost:8080/api/v1/main/flows -H "Content-Type: application/x-yaml" -d @kestra/workflows/tasks/download-audio.yml`
      2. Trigger with a short CC video (< 3 min): `curl -X POST "http://localhost:8080/api/v1/main/executions/vid2tweet/download-audio" -F "youtube_url=https://www.youtube.com/watch?v=jNQXAC9IVRw"`
      3. Poll execution status every 10s for max 120s
      4. Assert final state is "SUCCESS"
      5. Check outputs contain `audio_compressed.mp3` and `metadata.txt`: `curl -s http://localhost:8080/api/v1/main/executions/{EXEC_ID} | jq '.outputs'`
      6. Verify audio file size < 25MB from task logs
    Expected Result: Execution SUCCESS, two output files present, audio < 25MB
    Failure Indicators: yt-dlp download fails, FFmpeg conversion error, file > 25MB
    Evidence: .sisyphus/evidence/task-4-download-audio.txt

  Scenario: Reject video longer than 20 minutes
    Tool: Bash (curl)
    Preconditions: Kestra running, flow deployed
    Steps:
      1. Trigger with a long video (> 20 min): use a known long CC video URL
      2. Poll execution status
      3. Assert final state is "FAILED"
      4. Check logs contain "exceeds 20-minute limit"
    Expected Result: Execution FAILED with clear duration error message
    Failure Indicators: Execution succeeds (should have failed), no error message in logs
    Evidence: .sisyphus/evidence/task-4-download-too-long.txt
  ```

  **Commit**: YES (groups with Wave 3)
  - Message: `feat: individual Kestra agent tasks + Next.js scaffold`
  - Files: `kestra/workflows/tasks/download-audio.yml`

- [x] 5. Transcription Agent — Python Script → Groq Whisper API

  **What to do**:
  - Create standalone Kestra flow file `kestra/workflows/tasks/transcribe-audio.yml`
  - Kestra task type: `io.kestra.plugin.scripts.python.Script` with `containerImage: "python:3.11-slim"`
  - **Must use Python Script** (not HTTP Request) because Groq Whisper requires multipart file upload which Kestra HTTP Request plugin doesn't support
  - Install dependencies via `beforeCommands`: `pip install requests`
  - Python script:
    ```python
    import requests
    import json
    import os

    api_key = "{{ secret('GROQ_API_KEY') }}"
    audio_path = "/tmp/audio_compressed.mp3"  # from inputFiles

    with open(audio_path, "rb") as f:
        response = requests.post(
            "https://api.groq.com/openai/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {api_key}"},
            files={"file": ("audio.mp3", f, "audio/mpeg")},
            data={"model": "whisper-large-v3", "response_format": "json"}
        )

    if response.status_code != 200:
        print(f"ERROR: Groq API returned {response.status_code}: {response.text}")
        exit(1)

    result = response.json()
    transcript = result.get("text", "")

    with open("/tmp/transcript.txt", "w") as f:
        f.write(transcript)

    print(f"Transcription complete: {len(transcript)} characters")
    ```
  - Use `inputFiles` to receive audio from Task 4:
    ```yaml
    inputFiles:
      audio_compressed.mp3: "{{ outputs.download_audio.outputFiles['audio_compressed.mp3'] }}"
    ```
  - Output via `outputFiles: [transcript.txt]`
  - Create test wrapper flow that mounts a sample audio file and triggers this task independently

  **Must NOT do**:
  - Do not use Kestra HTTP Request plugin (can't do multipart)
  - Do not implement chunking/splitting for large audio
  - Do not use `groq-sdk` npm package — pure Python `requests` for simplicity in container
  - Do not process transcript further (summarization is in Task 7)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []
  - **Reason**: Python script task with API integration, multipart upload, error handling, Kestra inputFiles/outputFiles wiring

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 4, 6, 7, 8, 10)
  - **Blocks**: Task 9 (full pipeline assembly)
  - **Blocked By**: Task 3 (smoke test must pass)

  **References**:

  **Pattern References**:
  - `kestra/workflows/_smoke-test.yml` (Task 3) — Base Kestra task pattern
  - `kestra/workflows/tasks/download-audio.yml` (Task 4) — outputFiles pattern to match with inputFiles here

  **API/Type References**:
  - Kestra `io.kestra.plugin.scripts.python.Script` — `containerImage`, `beforeCommands`, `script`, `inputFiles`, `outputFiles`
  - Kestra secrets: `{{ secret('GROQ_API_KEY') }}` — resolved at runtime from SECRET_GROQ_API_KEY env var
  - Kestra inputFiles: maps logical filename → Kestra internal URI from previous task outputs
  - Groq Whisper API: `POST https://api.groq.com/openai/v1/audio/transcriptions` — multipart form: `file` (binary), `model` (string), `response_format` (string)

  **External References**:
  - Groq Whisper: model `whisper-large-v3`, 25MB max file, 2000 requests/day free tier
  - Response format: `{"text": "transcribed content..."}` when `response_format=json`

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Transcribe audio file via Groq Whisper
    Tool: Bash (curl)
    Preconditions: Kestra running, flow deployed, valid GROQ_API_KEY in secrets
    Steps:
      1. Deploy flow: `curl -X POST http://localhost:8080/api/v1/main/flows -H "Content-Type: application/x-yaml" -d @kestra/workflows/tasks/transcribe-audio.yml`
      2. First run Task 4 (download) to get a real audio file, OR mount a sample audio file via test wrapper
      3. Trigger transcription task
      4. Poll execution status every 10s for max 120s
      5. Assert final state is "SUCCESS"
      6. Check outputs contain `transcript.txt`
      7. Verify transcript is non-empty (check logs for "characters" count > 0)
    Expected Result: Execution SUCCESS, transcript.txt output present, non-empty transcript
    Failure Indicators: Groq API 401 (bad key), 413 (file too large), empty transcript
    Evidence: .sisyphus/evidence/task-5-transcribe.txt

  Scenario: Transcription fails with invalid API key
    Tool: Bash (curl)
    Preconditions: Kestra running, flow deployed, GROQ_API_KEY set to "invalid_key"
    Steps:
      1. Trigger transcription task with invalid key
      2. Poll execution status
      3. Assert final state is "FAILED"
      4. Check logs contain "ERROR: Groq API returned 401"
    Expected Result: Execution FAILED with clear 401 error
    Failure Indicators: Silent failure, no error message
    Evidence: .sisyphus/evidence/task-5-transcribe-bad-key.txt
  ```

  **Commit**: YES (groups with Wave 3)
  - Message: `feat: individual Kestra agent tasks + Next.js scaffold`
  - Files: `kestra/workflows/tasks/transcribe-audio.yml`

- [x] 6. Image Extraction Agent — FFmpeg Best Frame

  **What to do**:
  - Create standalone Kestra flow file `kestra/workflows/tasks/extract-image.yml`
  - Kestra task type: `io.kestra.plugin.scripts.shell.Commands` with `containerImage: "python:3.11-slim"`
  - Install FFmpeg via `beforeCommands`: `apt-get update && apt-get install -y ffmpeg`
  - Download original video (low quality, just for frame extraction) using yt-dlp:
    ```bash
    pip install yt-dlp
    yt-dlp --no-playlist -f "worst[ext=mp4]" -o "/tmp/video.mp4" "{{ inputs.youtube_url }}"
    ```
  - Extract best frame from the first third of the video (more likely to have a representative frame):
    ```bash
    DURATION=$(ffprobe -v error -show_entries format=duration -of csv=p=0 /tmp/video.mp4)
    THIRD=$(echo "$DURATION / 3" | bc -l)
    ffmpeg -ss "$THIRD" -i /tmp/video.mp4 -frames:v 1 -q:v 2 /tmp/thumbnail.jpg
    ```
  - Validate image exists and is < 5MB (Twitter image upload limit):
    ```bash
    FILE_SIZE=$(stat -f%z /tmp/thumbnail.jpg 2>/dev/null || stat -c%s /tmp/thumbnail.jpg)
    if [ "$FILE_SIZE" -gt 5242880 ]; then
      ffmpeg -i /tmp/thumbnail.jpg -q:v 5 -resize 1280x720 /tmp/thumbnail.jpg
    fi
    ```
  - Output via `outputFiles: [thumbnail.jpg]`

  **Must NOT do**:
  - Do not use AI to generate thumbnails — FFmpeg frame extraction only
  - Do not download full quality video — use `worst[ext=mp4]` format
  - Do not extract multiple frames — single best frame is sufficient

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - **Reason**: FFmpeg commands with validation, straightforward but needs careful shell scripting

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 4, 5, 7, 8, 10)
  - **Blocks**: Task 9 (full pipeline assembly)
  - **Blocked By**: Task 3 (smoke test must pass)

  **References**:

  **Pattern References**:
  - `kestra/workflows/_smoke-test.yml` (Task 3) — Base shell Commands task pattern
  - `kestra/workflows/tasks/download-audio.yml` (Task 4) — yt-dlp usage pattern, outputFiles pattern

  **API/Type References**:
  - Kestra `io.kestra.plugin.scripts.shell.Commands` — same as Task 4
  - Kestra inputs: `{{ inputs.youtube_url }}` — same URL as download task

  **External References**:
  - FFmpeg: `-ss` for seeking, `-frames:v 1` for single frame, `-q:v 2` for high quality JPEG
  - ffprobe: `-show_entries format=duration` for video length
  - Twitter image limits: 5MB max, JPEG/PNG/GIF supported

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Extract thumbnail from a short YouTube video
    Tool: Bash (curl)
    Preconditions: Kestra running, flow deployed
    Steps:
      1. Deploy flow
      2. Trigger with short CC video URL
      3. Poll execution status every 10s for max 120s
      4. Assert final state is "SUCCESS"
      5. Check outputs contain `thumbnail.jpg`
      6. Verify file size < 5MB from task logs
    Expected Result: Execution SUCCESS, thumbnail.jpg present, < 5MB
    Failure Indicators: FFmpeg error, no output file, file > 5MB
    Evidence: .sisyphus/evidence/task-6-extract-image.txt

  Scenario: Image extraction handles video with no video stream
    Tool: Bash (curl)
    Preconditions: Kestra running, flow deployed
    Steps:
      1. Trigger with an audio-only URL (if available) or mock scenario
      2. Assert execution FAILED with meaningful error
    Expected Result: Clear error about no video stream
    Failure Indicators: Silent failure, cryptic FFmpeg error
    Evidence: .sisyphus/evidence/task-6-extract-image-novideo.txt
  ```

  **Commit**: YES (groups with Wave 3)
  - Message: `feat: individual Kestra agent tasks + Next.js scaffold`
  - Files: `kestra/workflows/tasks/extract-image.yml`

- [x] 7. Tweet Generation Agent — HTTP Request → Groq Llama 3.3

  **What to do**:
  - Create standalone Kestra flow file `kestra/workflows/tasks/generate-tweet.yml`
  - Kestra task type: `io.kestra.plugin.core.http.Request` (Groq chat completions API accepts standard JSON, no multipart needed)
  - HTTP Request configuration:
    ```yaml
    - id: generate_tweet
      type: io.kestra.plugin.core.http.Request
      uri: "https://api.groq.com/openai/v1/chat/completions"
      method: POST
      headers:
        Authorization: "Bearer {{ secret('GROQ_API_KEY') }}"
        Content-Type: "application/json"
      body: |
        {
          "model": "llama-3.3-70b-versatile",
          "messages": [
            {
              "role": "system",
              "content": "You are a social media expert. Generate a single tweet (max 270 characters to leave room for link) based on the following video transcript. The tweet should be engaging, include 1-2 relevant hashtags, and capture the key insight. Output ONLY the tweet text, nothing else."
            },
            {
              "role": "user",
              "content": "{{ read(outputs.transcribe_audio.outputFiles['transcript.txt']) }}"
            }
          ],
          "temperature": 0.7,
          "max_tokens": 100
        }
    ```
  - Parse response to extract tweet text: the response body contains `choices[0].message.content`
  - Use a follow-up Shell task to extract and validate tweet text:
    ```yaml
    - id: validate_tweet
      type: io.kestra.plugin.scripts.shell.Commands
      commands:
        - echo '{{ outputs.generate_tweet.body }}' | jq -r '.choices[0].message.content' > /tmp/tweet.txt
        - TWEET_LEN=$(wc -c < /tmp/tweet.txt)
        - if [ "$TWEET_LEN" -gt 280 ]; then echo "ERROR: Tweet exceeds 280 characters ($TWEET_LEN)" >&2; exit 1; fi
        - echo "Tweet generated: $TWEET_LEN characters"
      outputFiles:
        - tweet.txt
    ```
  - Create a test wrapper flow with a hardcoded sample transcript for independent testing

  **Must NOT do**:
  - Do not use Python Script for this — HTTP Request plugin works fine for JSON APIs
  - Do not generate multiple tweet variants — single tweet is sufficient
  - Do not add thread/multi-tweet logic
  - Do not exceed 280 character limit — validate and fail if exceeded

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - **Reason**: Kestra HTTP Request plugin + response parsing + validation — moderate complexity

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 4, 5, 6, 8, 10)
  - **Blocks**: Task 9 (full pipeline assembly)
  - **Blocked By**: Task 3 (smoke test must pass)

  **References**:

  **Pattern References**:
  - `kestra/workflows/_smoke-test.yml` (Task 3) — Base Kestra task pattern
  - `kestra/workflows/tasks/transcribe-audio.yml` (Task 5) — inputFiles pattern for receiving transcript

  **API/Type References**:
  - Kestra `io.kestra.plugin.core.http.Request` — `uri`, `method`, `headers`, `body` properties; response available as `{{ outputs.{taskId}.body }}`
  - Kestra `read()` function: reads file content from internal storage URI into string
  - Groq Chat Completions: `POST https://api.groq.com/openai/v1/chat/completions` — standard OpenAI-compatible format

  **External References**:
  - Groq Llama 3.3 70B: model `llama-3.3-70b-versatile`, 1000 RPD free tier, 32K context
  - Twitter character limit: 280 characters max (aim for 270 to leave room for URL if needed)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Generate tweet from a sample transcript
    Tool: Bash (curl)
    Preconditions: Kestra running, flow deployed, valid GROQ_API_KEY
    Steps:
      1. Deploy flow with test wrapper containing hardcoded transcript
      2. Trigger execution
      3. Poll status every 10s for max 60s
      4. Assert final state is "SUCCESS"
      5. Check outputs contain `tweet.txt`
      6. Verify tweet text is non-empty and ≤ 280 characters
      7. Verify tweet contains at least one hashtag (grep for '#')
    Expected Result: Execution SUCCESS, tweet.txt present, valid tweet ≤ 280 chars with hashtag
    Failure Indicators: Groq API error, empty tweet, tweet > 280 chars, no hashtag
    Evidence: .sisyphus/evidence/task-7-generate-tweet.txt

  Scenario: Tweet generation with empty transcript
    Tool: Bash (curl)
    Preconditions: Kestra running, flow deployed
    Steps:
      1. Trigger with empty transcript input
      2. Check if Groq still generates something or returns error
      3. Assert task handles gracefully (either generates generic tweet or fails with clear error)
    Expected Result: Clear handling — either meaningful error or graceful fallback
    Failure Indicators: Cryptic error, undefined behavior
    Evidence: .sisyphus/evidence/task-7-generate-tweet-empty.txt
  ```

  **Commit**: YES (groups with Wave 3)
  - Message: `feat: individual Kestra agent tasks + Next.js scaffold`
  - Files: `kestra/workflows/tasks/generate-tweet.yml`

- [x] 8. Twitter Posting Agent — Node.js Script → twitter-api-v2

  **What to do**:
  - Create standalone Kestra flow file `kestra/workflows/tasks/post-tweet.yml`
  - Kestra task type: `io.kestra.plugin.scripts.node.Script` with `containerImage: "node:20-slim"`
  - Install dependency via `beforeCommands`: `npm install twitter-api-v2`
  - Node.js script for posting tweet with image:
    ```javascript
    const { TwitterApi } = require('twitter-api-v2');
    const fs = require('fs');

    const client = new TwitterApi({
      appKey: '{{ secret("TWITTER_API_KEY") }}',
      appSecret: '{{ secret("TWITTER_API_SECRET") }}',
      accessToken: '{{ secret("TWITTER_ACCESS_TOKEN") }}',
      accessSecret: '{{ secret("TWITTER_ACCESS_SECRET") }}'
    });

    async function postTweet() {
      const tweetText = fs.readFileSync('/tmp/tweet.txt', 'utf-8').trim();
      const imagePath = '/tmp/thumbnail.jpg';

      // Upload image
      const mediaId = await client.v1.uploadMedia(imagePath);

      // Post tweet with image
      const tweet = await client.v2.tweet({
        text: tweetText,
        media: { media_ids: [mediaId] }
      });

      console.log(`Tweet posted! ID: ${tweet.data.id}`);

      // Write result for downstream tasks
      fs.writeFileSync('/tmp/tweet_result.json', JSON.stringify({
        tweet_id: tweet.data.id,
        tweet_text: tweetText,
        posted_at: new Date().toISOString()
      }));
    }

    postTweet().catch(err => {
      console.error(`ERROR: Failed to post tweet: ${err.message}`);
      process.exit(1);
    });
    ```
  - Use `inputFiles` to receive tweet text and image:
    ```yaml
    inputFiles:
      tweet.txt: "{{ outputs.validate_tweet.outputFiles['tweet.txt'] }}"
      thumbnail.jpg: "{{ outputs.extract_image.outputFiles['thumbnail.jpg'] }}"
    ```
  - Output via `outputFiles: [tweet_result.json]`
  - Create test wrapper flow for independent testing (use a test Twitter account or dry-run flag)
  - **Add a DRY_RUN mode**: if `{{ inputs.dry_run }}` is true, skip actual posting and write mock result

  **Must NOT do**:
  - Do not implement OAuth flow — use pre-generated tokens from Twitter Developer Portal
  - Do not implement thread posting or multi-tweet
  - Do not implement retry logic beyond basic try/catch
  - Do not store Twitter credentials anywhere except Kestra secrets

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []
  - **Reason**: Twitter API integration with image upload, OAuth 1.0a, error handling, dry-run mode — needs careful implementation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 4, 5, 6, 7, 10)
  - **Blocks**: Task 9 (full pipeline assembly)
  - **Blocked By**: Task 3 (smoke test must pass)

  **References**:

  **Pattern References**:
  - `kestra/workflows/_smoke-test.yml` (Task 3) — Base Kestra task pattern
  - `kestra/workflows/tasks/transcribe-audio.yml` (Task 5) — inputFiles pattern

  **API/Type References**:
  - Kestra `io.kestra.plugin.scripts.node.Script` — `containerImage`, `beforeCommands`, `script`, `inputFiles`, `outputFiles`
  - Kestra secrets: `{{ secret('TWITTER_API_KEY') }}`, `{{ secret('TWITTER_API_SECRET') }}`, `{{ secret('TWITTER_ACCESS_TOKEN') }}`, `{{ secret('TWITTER_ACCESS_SECRET') }}`
  - `twitter-api-v2` npm package: `client.v1.uploadMedia(path)` → mediaId, `client.v2.tweet({text, media})` → tweet response

  **External References**:
  - twitter-api-v2 docs: https://github.com/PLhery/node-twitter-api-v2 — OAuth 1.0a user context required for posting
  - Twitter API v2 tweet endpoint: POST with text + media_ids
  - Twitter media upload: v1 endpoint (v2 media upload not yet available), 5MB image limit
  - Free tier: 500 tweets/month, 1 app per project

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Post tweet with image in dry-run mode
    Tool: Bash (curl)
    Preconditions: Kestra running, flow deployed
    Steps:
      1. Deploy flow with test wrapper
      2. Create sample tweet.txt ("Test tweet from Vid2Tweet #hackathon") and thumbnail.jpg
      3. Trigger with dry_run=true
      4. Poll execution status every 10s for max 60s
      5. Assert final state is "SUCCESS"
      6. Check outputs contain `tweet_result.json`
      7. Verify tweet_result.json contains mock tweet_id and posted_at
    Expected Result: Execution SUCCESS in dry-run mode, mock result file present
    Failure Indicators: Actual tweet posted during dry-run, execution failure
    Evidence: .sisyphus/evidence/task-8-post-tweet-dryrun.txt

  Scenario: Post real tweet (manual test with real credentials)
    Tool: Bash (curl)
    Preconditions: Real Twitter API credentials in Kestra secrets, test account
    Steps:
      1. Trigger with dry_run=false and real credentials
      2. Assert execution SUCCESS
      3. Verify tweet_result.json has real tweet_id
      4. Manually verify tweet exists on Twitter (capture URL)
    Expected Result: Real tweet posted with image, tweet_id returned
    Failure Indicators: 401 (bad credentials), 403 (permission denied), image upload failure
    Evidence: .sisyphus/evidence/task-8-post-tweet-real.txt

  Scenario: Posting fails with invalid credentials
    Tool: Bash (curl)
    Preconditions: Invalid Twitter credentials in secrets
    Steps:
      1. Trigger with dry_run=false
      2. Assert execution FAILED
      3. Check logs contain "ERROR: Failed to post tweet" with auth error
    Expected Result: Execution FAILED with clear auth error message
    Failure Indicators: Silent failure, no error details
    Evidence: .sisyphus/evidence/task-8-post-tweet-badcreds.txt
  ```

  **Commit**: YES (groups with Wave 3)
  - Message: `feat: individual Kestra agent tasks + Next.js scaffold`
  - Files: `kestra/workflows/tasks/post-tweet.yml`

- [x] 9. Assemble Full Kestra Workflow — Wire All Tasks + Pause + DB Save

  **What to do**:
  - Create the main pipeline flow: `kestra/workflows/content-pipeline.yml`
  - Flow ID: `content-pipeline`, namespace: `vid2tweet`
  - Define flow inputs:
    ```yaml
    inputs:
      - id: youtube_url
        type: STRING
        description: "YouTube video URL to process"
    ```
  - Wire all agent tasks in sequence with proper inputFiles/outputFiles chaining:
    1. `download_audio` (Task 4 logic) — outputs: `audio_compressed.mp3`, `metadata.txt`
    2. `extract_image` (Task 6 logic) — runs in PARALLEL with transcription (same YouTube URL input)
    3. `transcribe_audio` (Task 5 logic) — inputs: `audio_compressed.mp3`, outputs: `transcript.txt`
    4. `generate_tweet` (Task 7 logic) — inputs: `transcript.txt`, outputs: `tweet.txt`
  - Use `io.kestra.plugin.core.flow.Parallel` for download+image extraction (both need YouTube URL, independent):
    ```yaml
    - id: parallel_download
      type: io.kestra.plugin.core.flow.Parallel
      tasks:
        - id: download_audio
          ...
        - id: extract_image
          ...
    ```
  - Add Human Approval Checkpoint using `io.kestra.plugin.core.flow.Pause`:
    ```yaml
    - id: human_approval
      type: io.kestra.plugin.core.flow.Pause
      onResume:
        - id: approved
          type: BOOLEAN
          description: "Approve tweet for posting?"
        - id: edited_tweet
          type: STRING
          required: false
          description: "Optionally edit the tweet text"
    ```
  - Add conditional posting based on approval:
    ```yaml
    - id: check_approval
      type: io.kestra.plugin.core.flow.If
      condition: "{{ outputs.human_approval.onResume.approved }}"
      then:
        - id: post_tweet
          ... (Task 8 logic, using edited_tweet if provided, else original)
      else:
        - id: rejected
          type: io.kestra.plugin.scripts.shell.Commands
          commands:
            - echo "Tweet rejected by user. Pipeline terminated."
    ```
  - After successful posting, save result to PostgreSQL via Kestra plugin:
    ```yaml
    - id: save_result
      type: io.kestra.plugin.jdbc.postgresql.Query
      url: "jdbc:postgresql://postgres:5432/vid2tweet"
      username: "kestra"
      password: "k3str4"
      sql: |
        INSERT INTO pipeline_results (youtube_url, tweet_text, tweet_id, status, created_at)
        VALUES ('{{ inputs.youtube_url }}', '{{ read(outputs.validate_tweet.outputFiles["tweet.txt"]) }}', '{{ outputs.post_tweet.outputFiles["tweet_result.json"] }}', 'POSTED', NOW())
    ```
  - Create deployment script `scripts/deploy-flows.sh`:
    ```bash
    #!/bin/bash
    for flow in kestra/workflows/*.yml; do
      echo "Deploying $flow..."
      curl -X POST http://localhost:8080/api/v1/main/flows \
        -H "Content-Type: application/x-yaml" \
        -d @"$flow"
    done
    ```
  - Deploy all flows including individual task flows for testing

  **Must NOT do**:
  - Do not add retry/recovery logic — basic try/catch only
  - Do not support concurrent pipeline runs — one at a time
  - Do not hardcode API keys — use `{{ secret('...') }}` everywhere
  - Do not create a custom backend to orchestrate — Kestra IS the orchestrator
  - Do not use DB credentials from secrets for hackathon — inline in SQL task is acceptable (same Docker network)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []
  - **Reason**: Complex Kestra workflow assembly — wiring 5 tasks, Parallel, Pause, If/Else, PostgreSQL plugin, file passing chains — highest complexity task

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 11, 12)
  - **Blocks**: Tasks 12, 13 (status page needs flow structure, E2E needs full pipeline)
  - **Blocked By**: Tasks 4, 5, 6, 7, 8 (all individual tasks must be tested first)

  **References**:

  **Pattern References**:
  - `kestra/workflows/tasks/download-audio.yml` (Task 4) — download task to inline
  - `kestra/workflows/tasks/transcribe-audio.yml` (Task 5) — transcription task to inline
  - `kestra/workflows/tasks/extract-image.yml` (Task 6) — image extraction task to inline
  - `kestra/workflows/tasks/generate-tweet.yml` (Task 7) — tweet generation task to inline
  - `kestra/workflows/tasks/post-tweet.yml` (Task 8) — Twitter posting task to inline

  **API/Type References**:
  - Kestra `io.kestra.plugin.core.flow.Parallel` — `tasks` array for concurrent execution
  - Kestra `io.kestra.plugin.core.flow.Pause` — `onResume` inputs, resume via `POST /api/v1/main/executions/{id}/resume`
  - Kestra `io.kestra.plugin.core.flow.If` — `condition` (Pebble expression), `then`/`else` task arrays
  - Kestra `io.kestra.plugin.jdbc.postgresql.Query` — `url`, `username`, `password`, `sql`
  - Kestra outputs chaining: `{{ outputs.{taskId}.outputFiles['{filename}'] }}` for file references
  - Kestra `read()` function: reads file URI content as string for SQL interpolation

  **External References**:
  - Kestra flow YAML format: `id`, `namespace`, `inputs`, `tasks` (ordered list)
  - Kestra Pause resume API: `POST /api/v1/main/executions/{executionId}/resume` with form data matching `onResume` input IDs

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Full pipeline executes and pauses at approval
    Tool: Bash (curl)
    Preconditions: All services running, all flows deployed, valid GROQ_API_KEY
    Steps:
      1. Deploy content-pipeline: `curl -X POST http://localhost:8080/api/v1/main/flows -H "Content-Type: application/x-yaml" -d @kestra/workflows/content-pipeline.yml`
      2. Trigger: `curl -X POST "http://localhost:8080/api/v1/main/executions/vid2tweet/content-pipeline" -F "youtube_url=https://www.youtube.com/watch?v=jNQXAC9IVRw"`
      3. Poll status every 15s for max 300s (5 min — download + transcription take time)
      4. Assert state becomes "PAUSED" (not FAILED, not SUCCESS yet)
      5. Verify task outputs exist: audio, transcript, thumbnail, tweet text
    Expected Result: Pipeline pauses at human_approval, all upstream tasks completed successfully
    Failure Indicators: State = FAILED before pause, missing outputs, timeout
    Evidence: .sisyphus/evidence/task-9-pipeline-pause.txt

  Scenario: Approve and post tweet
    Tool: Bash (curl)
    Preconditions: Pipeline in PAUSED state from previous scenario
    Steps:
      1. Resume with approval: `curl -X POST "http://localhost:8080/api/v1/main/executions/{EXEC_ID}/resume" -d '{"approved": true}'`
      2. Poll status every 10s for max 60s
      3. Assert final state is "SUCCESS"
      4. Verify tweet_result.json output contains tweet_id
      5. Check PostgreSQL: `podman compose exec postgres psql -U kestra -d vid2tweet -c "SELECT * FROM pipeline_results ORDER BY created_at DESC LIMIT 1"`
    Expected Result: Tweet posted, DB record created, execution SUCCESS
    Failure Indicators: State = FAILED after resume, no DB record, Twitter API error
    Evidence: .sisyphus/evidence/task-9-pipeline-approve.txt

  Scenario: Reject tweet terminates pipeline
    Tool: Bash (curl)
    Preconditions: Pipeline in PAUSED state
    Steps:
      1. Resume with rejection: `curl -X POST "http://localhost:8080/api/v1/main/executions/{EXEC_ID}/resume" -d '{"approved": false}'`
      2. Poll status every 5s for max 30s
      3. Assert final state is "SUCCESS" (rejection is a valid completion, not failure)
      4. Verify no tweet was posted (no tweet_result.json output)
    Expected Result: Pipeline completes without posting, rejection logged
    Failure Indicators: Tweet actually posted despite rejection, state = FAILED
    Evidence: .sisyphus/evidence/task-9-pipeline-reject.txt
  ```

  **Commit**: YES (groups with Wave 4)
  - Message: `feat: assembled Kestra pipeline + frontend pages`
  - Files: `kestra/workflows/content-pipeline.yml`, `scripts/deploy-flows.sh`

- [x] 10. Next.js Project Setup + Kestra API Client

  **What to do**:
  - Initialize Next.js project in `frontend/`:
    ```bash
    cd frontend && npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias
    ```
  - Install additional dependencies (repo-scoped, all in frontend/package.json):
    ```bash
    npm install axios
    ```
  - Create Kestra API client module `frontend/src/lib/kestra-client.ts`:
    ```typescript
    const KESTRA_BASE_URL = process.env.NEXT_PUBLIC_KESTRA_URL || 'http://localhost:8080';
    const NAMESPACE = 'vid2tweet';
    const FLOW_ID = 'content-pipeline';

    export async function triggerPipeline(youtubeUrl: string) {
      const formData = new FormData();
      formData.append('youtube_url', youtubeUrl);
      const res = await fetch(`${KESTRA_BASE_URL}/api/v1/main/executions/${NAMESPACE}/${FLOW_ID}`, {
        method: 'POST', body: formData
      });
      return res.json();
    }

    export async function getExecution(executionId: string) {
      const res = await fetch(`${KESTRA_BASE_URL}/api/v1/main/executions/${executionId}`);
      return res.json();
    }

    export async function resumeExecution(executionId: string, approved: boolean, editedTweet?: string) {
      const body: any = { approved };
      if (editedTweet) body.edited_tweet = editedTweet;
      const res = await fetch(`${KESTRA_BASE_URL}/api/v1/main/executions/${executionId}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return res.json();
    }

    export async function listExecutions() {
      const res = await fetch(`${KESTRA_BASE_URL}/api/v1/main/executions?namespace=${NAMESPACE}&flowId=${FLOW_ID}`);
      return res.json();
    }
    ```
  - Create types file `frontend/src/types/kestra.ts` with interfaces for Execution, TaskRun, etc.
  - Set up `.env.local` with `NEXT_PUBLIC_KESTRA_URL=http://localhost:8080`
  - Verify dev server starts: `npm run dev`

  **Must NOT do**:
  - Do not install packages globally — everything in frontend/package.json
  - Do not create pages yet (Tasks 11, 12)
  - Do not create a custom backend API route — frontend calls Kestra directly
  - Do not over-engineer types — minimal interfaces matching Kestra API responses

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - **Reason**: Standard Next.js scaffolding with a thin API client — well-established patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 4, 5, 6, 7, 8)
  - **Blocks**: Tasks 11, 12 (both pages need the client)
  - **Blocked By**: Task 1 (CORS must be enabled for frontend→Kestra)

  **References**:

  **API/Type References**:
  - Kestra REST API endpoints (from Context section):
    - `POST /api/v1/main/executions/{namespace}/{flowId}` — trigger flow
    - `GET /api/v1/main/executions/{executionId}` — get execution status + outputs
    - `POST /api/v1/main/executions/{executionId}/resume` — resume paused execution
    - `GET /api/v1/main/executions?namespace=...&flowId=...` — list executions
  - Kestra Execution response shape: `{ id, namespace, flowId, state: { current: "RUNNING"|"PAUSED"|"SUCCESS"|"FAILED" }, taskRunList: [...], outputs: {...} }`

  **External References**:
  - Next.js App Router: `src/app/` directory, page.tsx files, layout.tsx
  - Tailwind CSS: included via create-next-app flag

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Next.js dev server starts and renders
    Tool: Bash
    Preconditions: Node.js installed, frontend/ initialized
    Steps:
      1. Run `npm run dev` in frontend/ directory (background)
      2. Wait 10s for compilation
      3. Run `curl -s http://localhost:3000` — assert HTTP 200
      4. Assert response contains "Next" or expected content
      5. Kill dev server
    Expected Result: Dev server starts on :3000, responds with HTML
    Failure Indicators: Port conflict, compilation error, missing dependencies
    Evidence: .sisyphus/evidence/task-10-nextjs-setup.txt

  Scenario: Kestra client module compiles without errors
    Tool: Bash
    Preconditions: frontend/ initialized with TypeScript
    Steps:
      1. Run `npx tsc --noEmit` in frontend/
      2. Assert exit code 0 (no type errors)
    Expected Result: Clean TypeScript compilation
    Failure Indicators: Type errors in kestra-client.ts or kestra.ts types
    Evidence: .sisyphus/evidence/task-10-typescript-check.txt
  ```

  **Commit**: YES (groups with Wave 3)
  - Message: `feat: individual Kestra agent tasks + Next.js scaffold`
  - Files: `frontend/` (entire scaffolded project)

- [x] 11. Home Page — URL Input + Pipeline List

  **What to do**:
  - Create `frontend/src/app/page.tsx` — the main home page with:
    1. **Header**: "Vid2Tweet" logo/title + tagline "YouTube → Tweet, powered by AI + Kestra"
    2. **URL Input Form**:
       - Text input with placeholder "Paste YouTube URL here..."
       - YouTube URL validation (regex: `^https?://(www\.)?(youtube\.com/watch\?v=|youtu\.be/)[\w-]+`)
       - Submit button "Generate Tweet" with loading state
       - On submit: call `triggerPipeline(url)` from kestra-client, redirect to `/pipeline/{executionId}`
    3. **Recent Pipelines List** (below input):
       - Fetch from `listExecutions()` on page load
       - Show table/cards: YouTube URL (truncated), status badge (RUNNING/PAUSED/SUCCESS/FAILED), timestamp
       - Click row → navigate to `/pipeline/{executionId}`
    4. **"Coming Soon" Section**:
       - Grid of cards for future features: LinkedIn Posts, Blog Articles, YouTube Shorts, Instagram Reels, TikTok, Growth Prediction, AI Memory, A/B Testing, Brand-Safe Scoring
       - Each card: icon + name + "Coming Soon" badge, visually muted/disabled
  - Use Tailwind CSS for styling — clean, minimal, hackathon-appropriate
  - Add auto-refresh for pipeline list (poll every 10s)
  - Reference DESIGN.md for color palette and typography guidance (installed in Task 16, but use Tailwind defaults if not yet available)

  **Must NOT do**:
  - Do not implement any "Coming Soon" features — display only, no click handlers
  - Do not create complex state management (Redux, Zustand) — React state + fetch is sufficient
  - Do not add authentication or user accounts
  - Do not over-design — this is a hackathon demo, clean > fancy

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`playwright`]
  - **Reason**: Frontend page with UI components, form handling, data fetching — visual-engineering for UI quality, playwright for QA screenshots

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 9, 12)
  - **Blocks**: Task 13 (E2E testing)
  - **Blocked By**: Task 10 (needs Next.js project + Kestra client)

  **References**:

  **Pattern References**:
  - `frontend/src/lib/kestra-client.ts` (Task 10) — API client functions to use: `triggerPipeline()`, `listExecutions()`
  - `frontend/src/types/kestra.ts` (Task 10) — TypeScript interfaces for execution data

  **API/Type References**:
  - `triggerPipeline(url)` returns `{ id: string }` — use `id` for redirect
  - `listExecutions()` returns array of executions with `{ id, state: { current }, inputs: { youtube_url }, startDate }`

  **External References**:
  - Next.js App Router: `page.tsx` is the route component, `'use client'` directive for client components
  - Tailwind CSS: utility classes for styling
  - Next.js `useRouter`: for programmatic navigation to `/pipeline/{id}`

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Home page renders with URL input and Coming Soon section
    Tool: Playwright
    Preconditions: Next.js dev server running on :3000
    Steps:
      1. Navigate to http://localhost:3000
      2. Assert page title contains "Vid2Tweet"
      3. Assert URL input exists: `input[placeholder*="YouTube"]`
      4. Assert submit button exists: `button` containing "Generate Tweet"
      5. Assert "Coming Soon" section visible with at least 5 cards
      6. Take screenshot
    Expected Result: Page renders with all sections, professional appearance
    Failure Indicators: 404, missing components, broken layout
    Evidence: .sisyphus/evidence/task-11-home-page.png

  Scenario: Invalid YouTube URL shows validation error
    Tool: Playwright
    Preconditions: Next.js dev server running
    Steps:
      1. Navigate to http://localhost:3000
      2. Type "not-a-url" into the YouTube URL input
      3. Click "Generate Tweet" button
      4. Assert validation error message appears (e.g., "Please enter a valid YouTube URL")
      5. Assert no API call was made (no redirect)
    Expected Result: Validation error displayed, form not submitted
    Failure Indicators: No error shown, API called with invalid URL
    Evidence: .sisyphus/evidence/task-11-home-validation.png

  Scenario: Valid URL triggers pipeline and redirects
    Tool: Playwright
    Preconditions: Next.js + Kestra running, content-pipeline deployed
    Steps:
      1. Navigate to http://localhost:3000
      2. Type "https://www.youtube.com/watch?v=jNQXAC9IVRw" into input
      3. Click "Generate Tweet"
      4. Assert loading state appears on button
      5. Assert redirect to /pipeline/{id} URL pattern within 5s
    Expected Result: Redirect to pipeline status page with execution ID
    Failure Indicators: No redirect, API error, stuck loading
    Evidence: .sisyphus/evidence/task-11-home-submit.png
  ```

  **Commit**: YES (groups with Wave 4)
  - Message: `feat: assembled Kestra pipeline + frontend pages`
  - Files: `frontend/src/app/page.tsx`, related components

- [x] 12. Pipeline Status + Approval Page

  **What to do**:
  - Create `frontend/src/app/pipeline/[id]/page.tsx` — dynamic route for pipeline status:
    1. **Pipeline Header**: YouTube URL (linked), execution ID, overall status badge
    2. **Task Progress Timeline**: Visual timeline showing each Kestra task:
       - download_audio → transcribe_audio → generate_tweet → [PAUSE] → post_tweet
       - Each step: name, status icon (⏳ pending, 🔄 running, ✅ success, ❌ failed), duration
       - Currently running task highlighted
    3. **Generated Content Preview** (visible when pipeline reaches PAUSED state):
       - Tweet text display (editable textarea if user wants to modify)
       - Thumbnail image preview (from extracted frame)
       - Character count indicator (current / 280 max)
    4. **Approval Actions** (visible only when state = PAUSED):
       - "Approve & Post" button (green) — calls `resumeExecution(id, true, editedTweet)`
       - "Reject" button (red) — calls `resumeExecution(id, false)`
       - Both buttons have loading states and confirmation
    5. **Result Section** (visible after posting):
       - "Tweet posted successfully!" message
       - Link to tweet on Twitter (constructed from tweet_id)
       - Tweet text + image displayed
    6. **Auto-refresh**: Poll execution status every 5s while RUNNING, stop when SUCCESS/FAILED
  - Fetch execution data from Kestra API: `getExecution(id)` — parse `state.current`, `taskRunList`, `outputs`
  - Extract outputs from Kestra execution response for preview:
    - Tweet text: read from task outputs
    - Thumbnail: serve from Kestra internal storage or download via API

  **Must NOT do**:
  - Do not implement real-time WebSocket — polling every 5s is sufficient
  - Do not create complex approval workflows — simple approve/reject binary
  - Do not implement tweet editing after posting
  - Do not add "re-run" or "retry" functionality

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`playwright`]
  - **Reason**: Complex UI page with dynamic state, polling, conditional sections — needs good UX for the demo; playwright for QA

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 9, 11)
  - **Blocks**: Task 13 (E2E testing)
  - **Blocked By**: Tasks 10 (Kestra client), 9 (needs to know flow structure for task timeline)

  **References**:

  **Pattern References**:
  - `frontend/src/lib/kestra-client.ts` (Task 10) — `getExecution()`, `resumeExecution()` functions
  - `frontend/src/app/page.tsx` (Task 11) — Same styling conventions, Tailwind patterns

  **API/Type References**:
  - `getExecution(id)` returns full Kestra execution object:
    ```json
    {
      "id": "exec_123",
      "state": { "current": "PAUSED" },
      "inputs": { "youtube_url": "..." },
      "taskRunList": [
        { "taskId": "download_audio", "state": { "current": "SUCCESS" }, "outputs": {...} },
        { "taskId": "human_approval", "state": { "current": "PAUSED" } }
      ],
      "outputs": {
        "validate_tweet": { "outputFiles": { "tweet.txt": "kestra:///..." } },
        "extract_image": { "outputFiles": { "thumbnail.jpg": "kestra:///..." } }
      }
    }
    ```
  - Kestra file download: `GET /api/v1/main/executions/{id}/file?filePath={internalUri}` — serves raw file content
  - `resumeExecution(id, approved, editedTweet?)` — sends approval/rejection to Kestra

  **External References**:
  - Next.js dynamic routes: `[id]` folder convention in App Router
  - Next.js `useParams()` hook for accessing route params
  - React `useEffect` + `setInterval` for polling pattern

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Pipeline status page shows task progress while running
    Tool: Playwright
    Preconditions: Kestra running, pipeline triggered and in RUNNING state
    Steps:
      1. Navigate to http://localhost:3000/pipeline/{EXEC_ID}
      2. Assert page shows YouTube URL and execution ID
      3. Assert task timeline visible with at least 5 task steps
      4. Assert at least one task shows running status indicator
      5. Assert "Approve" button is NOT visible (not yet paused)
      6. Take screenshot
    Expected Result: Status page with active task timeline, no approval buttons
    Failure Indicators: 404, missing timeline, approval buttons shown prematurely
    Evidence: .sisyphus/evidence/task-12-status-running.png

  Scenario: Approval UI appears when pipeline is paused
    Tool: Playwright
    Preconditions: Pipeline in PAUSED state at human_approval step
    Steps:
      1. Navigate to http://localhost:3000/pipeline/{EXEC_ID}
      2. Assert tweet text preview is visible and non-empty
      3. Assert thumbnail image preview is visible: `img[alt*="thumbnail"]` or similar
      4. Assert character count shows number ≤ 280
      5. Assert "Approve & Post" button visible (green)
      6. Assert "Reject" button visible (red)
      7. Take screenshot
    Expected Result: Preview with tweet + image, approve/reject buttons active
    Failure Indicators: No preview content, buttons missing, empty tweet text
    Evidence: .sisyphus/evidence/task-12-status-paused.png

  Scenario: Approve button resumes pipeline
    Tool: Playwright
    Preconditions: Pipeline in PAUSED state, approval UI visible
    Steps:
      1. Click "Approve & Post" button
      2. Assert button shows loading state
      3. Wait up to 30s for status to change from PAUSED
      4. Assert final status shows SUCCESS
      5. Assert result section appears with "Tweet posted" message
      6. Take screenshot
    Expected Result: Pipeline resumes, completes, shows success with tweet link
    Failure Indicators: Button click fails, pipeline stays paused, error state
    Evidence: .sisyphus/evidence/task-12-status-approved.png
  ```

  **Commit**: YES (groups with Wave 4)
  - Message: `feat: assembled Kestra pipeline + frontend pages`
  - Files: `frontend/src/app/pipeline/[id]/page.tsx`, related components

- [x] 13. End-to-End Testing + Debugging

  **What to do**:
  - Run the full pipeline end-to-end from a clean state:
    1. `podman compose down -v && podman compose up -d` — fresh start
    2. Deploy all Kestra flows via `scripts/deploy-flows.sh`
    3. Open frontend at `http://localhost:3000`
    4. Paste a short Creative Commons YouTube URL
    5. Monitor Kestra UI at `http://localhost:8080` — verify visual workflow graph
    6. Wait for pipeline to reach PAUSED state
    7. Approve via dashboard — verify tweet posts to Twitter
    8. Verify DB record in `pipeline_results` table
  - Debug and fix any issues discovered:
    - File passing between Kestra tasks (most likely failure point)
    - Kestra secret resolution
    - Frontend CORS issues
    - Output parsing/display issues
    - Image serving from Kestra to frontend
  - Run rejection flow: trigger pipeline → reject → verify clean termination
  - Test error scenarios:
    - Invalid YouTube URL → should fail at download task
    - Network issues → should fail with clear error
  - Document any workarounds or fixes applied

  **Must NOT do**:
  - Do not add features — only fix bugs discovered during E2E
  - Do not refactor working code during debugging
  - Do not add retry/recovery logic — fix root causes

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`playwright`]
  - **Reason**: Complex debugging across multiple systems (Kestra, PostgreSQL, Next.js, external APIs) — needs deep investigation skills + playwright for frontend verification

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 5 (sequential — must complete before docs)
  - **Blocks**: Task 14 (docs should describe working system)
  - **Blocked By**: Tasks 9, 11, 12 (full pipeline + both frontend pages)

  **References**:

  **Pattern References**:
  - All Kestra workflow files in `kestra/workflows/` — the full pipeline to test
  - `frontend/src/app/page.tsx` (Task 11) — home page to interact with
  - `frontend/src/app/pipeline/[id]/page.tsx` (Task 12) — status page to verify

  **API/Type References**:
  - Kestra REST API: all endpoints from Context section
  - Kestra UI: `http://localhost:8080` — visual workflow graph
  - PostgreSQL: `podman compose exec postgres psql -U kestra -d vid2tweet`

  **External References**:
  - Kestra task logs: `GET /api/v1/main/logs/{executionId}` — for debugging failed tasks
  - Kestra file download: `GET /api/v1/main/executions/{id}/file?filePath=...` — for verifying file passing

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Full end-to-end happy path
    Tool: Playwright + Bash (curl)
    Preconditions: Clean start, all services up, flows deployed, valid API keys
    Steps:
      1. Navigate to http://localhost:3000
      2. Paste "https://www.youtube.com/watch?v=jNQXAC9IVRw" (or similar short CC video)
      3. Click "Generate Tweet"
      4. Assert redirect to /pipeline/{id}
      5. Wait up to 300s for PAUSED state (poll every 15s)
      6. Assert tweet preview text visible and ≤ 280 chars
      7. Assert thumbnail image visible
      8. Click "Approve & Post"
      9. Wait up to 60s for SUCCESS state
      10. Assert "Tweet posted" message visible
      11. Verify DB: `podman compose exec postgres psql -U kestra -d vid2tweet -c "SELECT COUNT(*) FROM pipeline_results WHERE status='POSTED'"`
      12. Assert count > 0
      13. Take final screenshot
    Expected Result: Complete pipeline execution, tweet posted, DB updated, all visible in dashboard
    Failure Indicators: Any step fails, timeout, missing data
    Evidence: .sisyphus/evidence/task-13-e2e-happy-path.png

  Scenario: Rejection flow
    Tool: Playwright
    Preconditions: Pipeline in PAUSED state
    Steps:
      1. Click "Reject" button
      2. Assert pipeline status changes to SUCCESS (completed, but no tweet posted)
      3. Assert no "Tweet posted" message
      4. Verify no new tweet on Twitter
    Expected Result: Pipeline terminates gracefully without posting
    Failure Indicators: Tweet posted despite rejection
    Evidence: .sisyphus/evidence/task-13-e2e-rejection.png

  Scenario: Kestra UI shows visual workflow graph
    Tool: Playwright
    Preconditions: Pipeline running or completed
    Steps:
      1. Navigate to http://localhost:8080
      2. Navigate to Flows → vid2tweet → content-pipeline
      3. Assert workflow graph is visible with connected task nodes
      4. Assert task nodes show status colors (green/yellow/red)
      5. Take screenshot of the graph
    Expected Result: Visual DAG with all tasks visible and colored by status
    Failure Indicators: Graph not rendering, tasks not connected
    Evidence: .sisyphus/evidence/task-13-kestra-ui-graph.png
  ```

  **Commit**: YES (groups with Wave 5)
  - Message: `fix: end-to-end testing fixes and polish`
  - Files: any files modified during debugging

- [x] 14. Documentation — README, docs/, Setup Guide

  **What to do**:
  - Create `README.md` (root) with:
    1. **Project title**: "Vid2Tweet — YouTube to Tweet AI Pipeline"
    2. **One-line description**: Brief tagline
    3. **Demo GIF/screenshot placeholder**: `![Demo](docs/assets/demo.gif)`
    4. **How It Works**: 3-4 step visual flow (URL → AI Processing → Human Review → Tweet)
    5. **Tech Stack**: Kestra, Next.js, Groq (Whisper + Llama), Twitter API, PostgreSQL, Podman
    6. **Quick Start**: 5-step guide (clone, env, encode secrets, podman compose up, open browser)
    7. **Architecture Overview**: Brief description + symlink to detailed doc
    8. **Symlinks section**:
       - [Architecture & Design](docs/ARCHITECTURE.md)
       - [Local Setup Guide](docs/setup/LOCAL_SETUP.md)
       - [Contributing](docs/CONTRIBUTING.md)
       - [Future Scope & Roadmap](docs/ROADMAP.md)
       - [Design System](DESIGN.md)
    9. **Coming Soon**: List of future features
    10. **License**: MIT
  - Create `docs/ARCHITECTURE.md`:
    - System context diagram reference (PlantUML)
    - Component descriptions (Kestra, Frontend, PostgreSQL, External APIs)
    - Data flow: YouTube URL → download → transcribe → generate → approve → post
    - File passing mechanism (Kestra outputFiles/inputFiles)
    - Secrets management explanation
  - Create `docs/setup/LOCAL_SETUP.md`:
    - Prerequisites: Podman, Node.js 20+, API keys
    - Step-by-step setup with code blocks
    - Troubleshooting section (common Podman issues, CORS, Kestra startup)
    - API key acquisition guide (Groq, Twitter)
  - Create `docs/CONTRIBUTING.md`:
    - How to add new agent tasks to Kestra
    - Code style guidelines
    - PR process
  - Create `docs/ROADMAP.md`:
    - Current scope (v0.1 — hackathon)
    - Next phase features with descriptions
    - Long-term vision
  - Note: README symlinks should be relative paths (e.g., `[link](docs/ARCHITECTURE.md)`)

  **Must NOT do**:
  - Do not write documentation for features that don't exist
  - Do not create API documentation (no custom API)
  - Do not over-document — concise, hackathon-appropriate
  - Do not use absolute paths in symlinks

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: []
  - **Reason**: Technical documentation writing — needs clear structure, accurate content, proper markdown

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 15, 16)
  - **Blocks**: None
  - **Blocked By**: Task 13 (docs should describe the working system)

  **References**:

  **Pattern References**:
  - All source files from Tasks 1-12 — documentation must accurately describe what was built
  - `docker-compose.yml` (Task 1) — for setup guide
  - `.env.example` (Task 1) — for API key documentation
  - `kestra/workflows/content-pipeline.yml` (Task 9) — for architecture docs

  **External References**:
  - README best practices: title, badges, demo, quick start, architecture, contributing, license
  - Markdown relative links: `[text](relative/path.md)`

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: README has all required sections and valid symlinks
    Tool: Bash
    Steps:
      1. Assert README.md exists and is non-empty
      2. Grep for required sections: "How It Works", "Tech Stack", "Quick Start", "Architecture"
      3. Extract all markdown links: grep for `](docs/` patterns
      4. For each linked file, assert it exists: `test -f docs/ARCHITECTURE.md`, etc.
      5. Assert all docs files are non-empty (> 100 bytes)
    Expected Result: README has all sections, all linked files exist and have content
    Failure Indicators: Missing sections, broken links, empty docs
    Evidence: .sisyphus/evidence/task-14-readme-check.txt

  Scenario: Setup guide is accurate and complete
    Tool: Bash
    Steps:
      1. Read docs/setup/LOCAL_SETUP.md
      2. Verify all referenced commands exist (podman, node, npm)
      3. Verify all referenced files exist (.env.example, scripts/encode-secrets.sh)
      4. Verify port numbers match docker-compose.yml (8080 for Kestra, 3000 for frontend)
    Expected Result: Setup guide references correct files, commands, and ports
    Failure Indicators: Wrong port numbers, references to non-existent files
    Evidence: .sisyphus/evidence/task-14-setup-check.txt
  ```

  **Commit**: YES (groups with Wave 5)
  - Message: `docs: README, architecture docs, PlantUML diagrams, AGENTS.md`
  - Files: `README.md`, `docs/`

- [x] 15. PlantUML Diagrams

  **What to do**:
  - Create PlantUML diagrams in `docs/diagrams/`:
    1. **System Context** (`docs/diagrams/architecture/system-context.puml`):
       - C4 Context diagram showing: User, Vid2Tweet System, YouTube API, Groq API, Twitter API
       - Use C4-PlantUML library includes
    2. **Container Diagram** (`docs/diagrams/architecture/container-diagram.puml`):
       - C4 Container showing: Next.js Frontend, Kestra Orchestrator, PostgreSQL, External APIs
       - Show relationships: Frontend → Kestra API, Kestra → External APIs, Kestra → PostgreSQL
    3. **Pipeline Flow** (`docs/diagrams/flows/pipeline-flow.puml`):
       - Activity diagram showing the full pipeline:
       - Start → Download Audio → [Parallel] Transcribe / Extract Image → Generate Tweet → Human Approval → [If approved] Post Tweet → Save to DB → End
       - [If rejected] → Log Rejection → End
    4. **Sequence Diagram** (`docs/diagrams/sequences/trigger-pipeline.puml`):
       - User → Frontend → Kestra API → [Tasks execute] → Pause → Frontend polls → User approves → Kestra resumes → Twitter API → DB
    5. **Styles** (`docs/diagrams/styles/theme.puml`):
       - Shared color scheme and styling for consistent look across diagrams
  - Reference the diagrams from `docs/ARCHITECTURE.md`
  - Add render instructions in docs (how to generate PNG/SVG from .puml files)

  **Must NOT do**:
  - Do not use Mermaid — user explicitly requested PlantUML
  - Do not create diagrams for Coming Soon features
  - Do not include Gemini/Instagram/TikTok in diagrams — current scope only
  - Do not generate PNG/SVG files — .puml source files only (render instructions provided)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - **Reason**: PlantUML diagram authoring with C4 conventions — needs understanding of system architecture

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 14, 16)
  - **Blocks**: None
  - **Blocked By**: None (can work from architecture knowledge, doesn't need running system)

  **References**:

  **Pattern References**:
  - Architecture from Context section — system components, data flow, relationships
  - `kestra/workflows/content-pipeline.yml` (Task 9) — pipeline structure for flow diagram
  - `docker-compose.yml` (Task 1) — container relationships

  **External References**:
  - C4-PlantUML: `!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Context.puml` (and C4_Container.puml)
  - PlantUML activity diagram syntax: `:action;`, `fork`/`end fork` for parallel, `if/then/else/endif`
  - PlantUML sequence diagram syntax: `actor`, `participant`, `->`, `-->`, `alt/else/end`

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: All PlantUML files exist and have valid syntax
    Tool: Bash
    Steps:
      1. Assert files exist: `ls docs/diagrams/architecture/system-context.puml docs/diagrams/architecture/container-diagram.puml docs/diagrams/flows/pipeline-flow.puml docs/diagrams/sequences/trigger-pipeline.puml docs/diagrams/styles/theme.puml`
      2. For each file, assert it starts with `@startuml` and ends with `@enduml`
      3. Assert each file is > 200 bytes (not just stubs)
    Expected Result: All 5 .puml files present with valid PlantUML structure
    Failure Indicators: Missing files, missing @startuml/@enduml, empty files
    Evidence: .sisyphus/evidence/task-15-plantuml-check.txt

  Scenario: Architecture docs reference diagrams
    Tool: Bash
    Steps:
      1. Grep docs/ARCHITECTURE.md for `.puml` references
      2. Assert at least 3 diagram references found
    Expected Result: Architecture doc links to relevant diagrams
    Failure Indicators: No diagram references in architecture doc
    Evidence: .sisyphus/evidence/task-15-plantuml-refs.txt
  ```

  **Commit**: YES (groups with Wave 5)
  - Message: `docs: README, architecture docs, PlantUML diagrams, AGENTS.md`
  - Files: `docs/diagrams/`

- [x] 16. AGENTS.md + DESIGN.md + .github/ Setup

  **What to do**:
  - Install Airtable design system:
    ```bash
    cd frontend && npx getdesign@latest add airtable
    ```
    This generates `DESIGN.md` in `frontend/` — move or symlink to project root
  - Create `AGENTS.md` in project root — AI agent coding instructions:
    - Project overview for AI agents
    - Tech stack summary
    - Coding conventions (DRY, SOLID, KISS, YAGNI)
    - File structure guide
    - Kestra workflow conventions
    - Frontend component patterns
    - Common commands (podman compose, deploy flows, run frontend)
  - Set up `.github/` structure (GitHub Copilot ecosystem):
    - `.github/copilot-instructions.md` — update from placeholder (Task 2) with real content
    - `.github/agents/vid2tweet.agent.md` — agent definition for the project
    - `.github/prompts/generate-tweet.prompt.md` — reusable prompt for tweet generation
    - `.github/skills/kestra-workflow.skill.md` — skill for Kestra workflow authoring
  - Keep `.github/hooks/` empty (placeholder for future pre-commit hooks)

  **Must NOT do**:
  - Do not install getdesign globally — use `npx`
  - Do not modify the generated DESIGN.md content (use as-is from getdesign)
  - Do not create complex agent definitions — minimal, hackathon-appropriate
  - Do not create actual GitHub Actions workflows (not needed for hackathon)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - **Reason**: File creation with structured content — straightforward, well-defined outputs

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 14, 15)
  - **Blocks**: None
  - **Blocked By**: None (can work independently)

  **References**:

  **Pattern References**:
  - `.github/copilot-instructions.md` (Task 2) — existing placeholder to update
  - All source files — AGENTS.md should accurately describe the codebase

  **External References**:
  - getdesign npm package: `npx getdesign@latest add airtable` — generates DESIGN.md with Airtable design system
  - GitHub Copilot agents: `.github/agents/*.agent.md` — agent definition format
  - GitHub Copilot skills: `.github/skills/*/SKILL.md` — skill definition format
  - GitHub Copilot prompts: `.github/prompts/*.prompt.md` — reusable prompt format

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: DESIGN.md and AGENTS.md exist with content
    Tool: Bash
    Steps:
      1. Assert DESIGN.md exists (in root or frontend/): `test -f DESIGN.md || test -f frontend/DESIGN.md`
      2. Assert AGENTS.md exists: `test -f AGENTS.md`
      3. Assert DESIGN.md > 1000 bytes (getdesign generates substantial content)
      4. Assert AGENTS.md > 500 bytes
      5. Grep AGENTS.md for key sections: "Tech Stack", "Conventions", "Commands"
    Expected Result: Both files exist with substantial content
    Failure Indicators: Missing files, empty files, DESIGN.md too small (getdesign failed)
    Evidence: .sisyphus/evidence/task-16-agents-design.txt

  Scenario: .github/ structure is populated
    Tool: Bash
    Steps:
      1. Assert files exist: `ls .github/copilot-instructions.md .github/agents/vid2tweet.agent.md`
      2. Assert copilot-instructions.md > 200 bytes (updated from placeholder)
      3. Assert at least 1 file in .github/prompts/
      4. Assert at least 1 file in .github/skills/
    Expected Result: .github/ populated with agent, skill, and prompt files
    Failure Indicators: Missing files, still placeholder content in copilot-instructions.md
    Evidence: .sisyphus/evidence/task-16-github-setup.txt
  ```

  **Commit**: YES (groups with Wave 5)
  - Message: `docs: README, architecture docs, PlantUML diagrams, AGENTS.md`
  - Files: `DESIGN.md`, `AGENTS.md`, `.github/`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists. For each "Must NOT Have": search codebase for forbidden patterns. Check evidence files. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run linter. Review all files for: empty catches, console.log in prod, commented-out code, unused imports. Check for hardcoded secrets (must use .env). Verify DRY/SOLID/KISS/YAGNI principles.
  Output: `Lint [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill for frontend)
  Start from clean state (`podman compose down && podman compose up`). Run full pipeline: paste YouTube URL → verify all Kestra tasks complete → approve tweet → verify tweet posted. Capture screenshots at each step.
  Output: `Scenarios [N/N pass] | Integration [N/N] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: verify spec matches implementation. Check "Coming Soon" features are NOT implemented. Verify no scope creep. Verify no backend server exists. Verify all packages are repo-scoped (no global installs).
  Output: `Tasks [N/N compliant] | Scope [CLEAN/N issues] | VERDICT`

---

## Commit Strategy

- **Commit 1** (after Wave 1): `chore: infrastructure setup — docker-compose, scaffolding, configs`
- **Commit 2** (after Wave 2): `test: smoke test Kestra + Podman script task execution`
- **Commit 3** (after Wave 3): `feat: individual Kestra agent tasks + Next.js scaffold`
- **Commit 4** (after Wave 4): `feat: assembled Kestra pipeline + frontend pages`
- **Commit 5** (after Wave 5): `docs: README, architecture docs, PlantUML diagrams, AGENTS.md`
- **Commit 6** (after FINAL): `chore: final QA fixes`

> **IMPORTANT**: Do NOT commit automatically. Request user to commit at each wave boundary.

---

## Success Criteria

### Verification Commands
```bash
# Services running
podman compose ps                    # Expected: 3 services UP (postgres, kestra, frontend-dev optional)
curl -s http://localhost:8080/api/v1/main/flows | jq '.[] | .id'  # Expected: "content-pipeline"

# Trigger pipeline
curl -X POST http://localhost:8080/api/v1/main/executions/vid2tweet/content-pipeline \
  -F "youtube_url=https://www.youtube.com/watch?v=CC_VIDEO_ID"
# Expected: 200 OK with execution ID

# Poll status
curl -s http://localhost:8080/api/v1/main/executions/{EXEC_ID} | jq '.state.current'
# Expected: "PAUSED" (after agent tasks complete, before approval)

# Resume (approve)
curl -X POST http://localhost:8080/api/v1/main/executions/{EXEC_ID}/resume \
  -F "approved=true"
# Expected: 200 OK, execution resumes

# Final status
curl -s http://localhost:8080/api/v1/main/executions/{EXEC_ID} | jq '.state.current'
# Expected: "SUCCESS"
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] End-to-end pipeline works (URL → tweet posted)
- [ ] Human approval pauses and resumes correctly
- [ ] Kestra UI shows visual workflow graph
- [ ] README has symlinks to architecture, design, setup, contributing, roadmap
- [ ] All packages in package.json (no global installs)
- [ ] .env.example documents required API keys
- [ ] PlantUML diagrams exist in docs/diagrams/
