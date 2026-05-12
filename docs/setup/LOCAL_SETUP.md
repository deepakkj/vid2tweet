# Local Setup Guide

Follow these steps to get Vid2Tweet running on your local machine.

## Prerequisites

- **Podman Desktop** or **Docker Desktop**: For running the containerized infrastructure.
- **Node.js 20+**: To run the Next.js frontend.
- **Git**: To clone the repository.
- **API Keys**:
    - [Groq API Key](https://console.groq.com): For transcription and tweet generation.
    - [Twitter Developer Account](https://developer.twitter.com): For posting tweets. You'll need API Key, API Secret, Access Token, and Access Secret (with write permissions).

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd ai_content_creator_automation
```

### 2. Configure Environment Variables

Create a `.env` file from the template:

```bash
cp .env.example .env
```

Edit the `.env` file and fill in your API keys:

```env
GROQ_API_KEY=gsk_...
TWITTER_API_KEY=...
TWITTER_API_SECRET=...
TWITTER_ACCESS_TOKEN=...
TWITTER_ACCESS_SECRET=...
```

### 3. Encode Secrets for Kestra

Kestra requires secrets to be in a specific format for this setup. Run the provided script:

```bash
chmod +x scripts/encode-secrets.sh
./scripts/encode-secrets.sh
```

This creates an `.env.encoded` file which is used by the Docker Compose setup.

### 4. Start Infrastructure

Launch the database and Kestra:

```bash
podman compose up -d
```

Verify that the services are running:
- **Kestra UI**: [http://localhost:8080](http://localhost:8080)
- **PostgreSQL**: `localhost:5432`

### 5. Deploy Workflows

Upload the YAML flow definitions to Kestra:

```bash
chmod +x scripts/deploy-flows.sh
./scripts/deploy-flows.sh
```

### 6. Start the Frontend

Install dependencies and start the development server:

```bash
cd frontend
npm install
npm run dev
```

The app should now be accessible at [http://localhost:3000](http://localhost:3000).

## Port Reference

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | Next.js Web Interface |
| Kestra | 8080 | Workflow UI & API |
| PostgreSQL | 5432 | Database |

## Troubleshooting

### Podman / Docker Issues
- Ensure the Docker socket is accessible. The `docker-compose.yml` mounts `/var/run/docker.sock`.
- If using Podman on macOS, you may need to ensure the machine is started: `podman machine start`.

### CORS Errors
- Kestra is configured to allow CORS via `MICRONAUT_SERVER_CORS_ENABLED: "true"` in `docker-compose.yml`.
- If you change ports, update the CORS configuration accordingly.

### Kestra Startup
- Kestra might take a minute to initialize the database schema on first run. Check logs with `podman compose logs -f kestra`.

### API Key Errors
- Ensure your Twitter app has "Read and Write" permissions enabled in the Developer Portal.
- Double-check that `GROQ_API_KEY` is valid by testing a simple curl request to their API.
