# Local Setup Guide

Follow these steps to run Vid2Tweet locally.

## Prerequisites

- Podman Desktop or Docker Desktop
- Node.js 20+
- Git
- Groq API key
- X developer credentials

## 1. Clone the Repository

```bash
git clone <your-repo-url>
cd ai_content_creator_automation
```

## 2. Configure Environment Variables

```bash
cp .env.example .env
```

Fill in at least these values:

```env
GROQ_API_KEY=
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_ACCESS_TOKEN=
TWITTER_ACCESS_SECRET=
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=

DB_URL=jdbc:postgresql://postgres:5432/vid2tweet
DB_USER=kestra
DB_PASSWORD=k3str4

NEXT_PUBLIC_KESTRA_URL=http://localhost:8080
NEXT_PUBLIC_KESTRA_USERNAME=admin@kestra.io
NEXT_PUBLIC_KESTRA_PASSWORD=Kestra123
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Variable Notes

- `TWITTER_CLIENT_ID` and `TWITTER_CLIENT_SECRET` power the Connect X OAuth 2.0 flow in the frontend
- `TWITTER_API_*` and `TWITTER_ACCESS_*` power the OAuth 1.0a fallback path in Kestra
- `NEXT_PUBLIC_KESTRA_*` is used by the frontend when calling Kestra in local development
- `DB_URL` points to the `vid2tweet` application database used by the pipeline result inserts; Kestra itself still uses its own `kestra` database internally

## 3. Encode Kestra Secrets

```bash
./scripts/encode-secrets.sh
```

This generates `.env.encoded`, which `docker-compose.yml` loads into Kestra.

## 4. Start Infrastructure

```bash
podman compose up -d
```

If you use Podman on macOS, make sure the VM is running:

```bash
podman machine start
```

`./scripts/deploy-flows.sh` also attempts to prepare `/tmp/kestra-wd/tmp` on the Podman VM because Kestra's task runner needs that path.

## 5. Deploy Kestra Flows

```bash
./scripts/deploy-flows.sh
```

The script:

- deploys subflows before the main orchestrator
- uses PUT first and falls back to POST when a flow does not exist yet
- reads namespace and flow ID directly from each YAML file

Manual deployment order:

1. `kestra/workflows/tasks/download-audio.yml`
2. `kestra/workflows/tasks/extract-image.yml`
3. `kestra/workflows/tasks/transcribe-audio.yml`
4. `kestra/workflows/tasks/generate-tweet.yml`
5. `kestra/workflows/tasks/post-tweet.yml`
6. `kestra/workflows/content-pipeline.yml`

## 6. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

## 7. Verify the Stack

- Frontend: [http://localhost:3000](http://localhost:3000)
- Kestra UI/API: [http://localhost:8080](http://localhost:8080)
- PostgreSQL: `localhost:5432`

## Local Usage Notes

- Paste the raw contents of your YouTube `cookies.txt` file in the UI for restricted videos
- Use **Connect X** if you want the OAuth 2.0 posting path
- Use **Dry run** to validate the full workflow without publishing to X
- The approval page fetches tweet text and thumbnails from Kestra artifacts, so Kestra must stay reachable while reviewing
- The frontend includes small server-side routes for OAuth and safe token forwarding even though Kestra remains the main workflow backend

## Local Security Caveat

`NEXT_PUBLIC_KESTRA_USERNAME` and `NEXT_PUBLIC_KESTRA_PASSWORD` are exposed to the frontend in this development setup so the browser can talk to Kestra directly. Keep that pattern local-only; for production, move Kestra access behind server-only routes or a dedicated backend proxy.

## Troubleshooting

### Kestra not reachable from frontend

- Confirm `NEXT_PUBLIC_KESTRA_URL` points to the Kestra instance
- Confirm the Basic auth values match the local Kestra config in `docker-compose.yml`

### Flow deployment issues

- Wait for Kestra to finish booting before running `./scripts/deploy-flows.sh`
- Inspect logs with `podman compose logs -f kestra`

### OAuth connection issues

- Confirm `NEXT_PUBLIC_APP_URL` matches your local frontend URL
- Confirm the X developer app redirect URI matches `/api/auth/twitter/callback`
- Requested scopes are `tweet.write users.read offline.access`

### Posting works only in dry run

- Check whether you connected an X account through OAuth 2.0
- If using the OAuth 1.0a fallback, verify `TWITTER_API_*` and `TWITTER_ACCESS_*` secrets are present and encoded into Kestra

### Download failures

- Videos longer than 20 minutes are rejected by design
- Compressed audio larger than 25 MB is rejected by design
