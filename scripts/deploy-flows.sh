#!/bin/bash
# Deploy all Kestra flows to the running Kestra instance
set -e

KESTRA_URL="${KESTRA_URL:-http://localhost:8080}"
KESTRA_USERNAME="${KESTRA_USERNAME:-admin@kestra.io}"
KESTRA_PASSWORD="${KESTRA_PASSWORD:-Kestra123}"

# Ensure /tmp/kestra-wd/tmp exists on Podman VM (required for Kestra task runner)
if command -v podman &> /dev/null; then
  echo "Creating Kestra working directory on Podman VM..."
  podman machine ssh "sudo mkdir -p /tmp/kestra-wd/tmp && sudo chmod -R 777 /tmp/kestra-wd" 2>/dev/null || true
fi

echo "Deploying flows to $KESTRA_URL..."

# Subflows must be deployed before the orchestrator that references them.
# Explicit ordering: tasks/* first, then top-level orchestrators.
for flow in \
  kestra/workflows/tasks/download-audio.yml \
  kestra/workflows/tasks/extract-image.yml \
  kestra/workflows/tasks/transcribe-audio.yml \
  kestra/workflows/tasks/generate-tweet.yml \
  kestra/workflows/tasks/post-tweet.yml \
  kestra/workflows/content-pipeline.yml; do
  [ -f "$flow" ] || continue
  echo "Deploying $flow..."
  namespace=$(python3 -c 'import sys, pathlib; text=pathlib.Path(sys.argv[1]).read_text(); print(next((line.split(":",1)[1].strip() for line in text.splitlines() if line.startswith("namespace:")), ""))' "$flow")
  flow_id=$(python3 -c 'import sys, pathlib; text=pathlib.Path(sys.argv[1]).read_text(); print(next((line.split(":",1)[1].strip() for line in text.splitlines() if line.startswith("id:")), ""))' "$flow")

  # Try PUT (update) first; if 404, use POST (create)
  response=$(curl -s -w "\n%{http_code}" -u "$KESTRA_USERNAME:$KESTRA_PASSWORD" -X PUT "$KESTRA_URL/api/v1/main/flows/$namespace/$flow_id" \
    -H "Content-Type: application/x-yaml" \
    --data-binary @"$flow")
  http_code=$(python3 -c 'import sys; lines=sys.stdin.read().splitlines(); print(lines[-1] if lines else "")' <<< "$response")
  body=$(python3 -c 'import sys; lines=sys.stdin.read().splitlines(); print("\n".join(lines[:-1]))' <<< "$response")

  if [ "$http_code" -eq 404 ]; then
    # Flow doesn't exist yet, create it with POST
    response=$(curl -s -w "\n%{http_code}" -u "$KESTRA_USERNAME:$KESTRA_PASSWORD" -X POST "$KESTRA_URL/api/v1/main/flows" \
      -H "Content-Type: application/x-yaml" \
      --data-binary @"$flow")
    http_code=$(python3 -c 'import sys; lines=sys.stdin.read().splitlines(); print(lines[-1] if lines else "")' <<< "$response")
    body=$(python3 -c 'import sys; lines=sys.stdin.read().splitlines(); print("\n".join(lines[:-1]))' <<< "$response")
  fi

  if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
    echo "  ✓ Deployed successfully"
  else
    echo "  ✗ Failed (HTTP $http_code): $body"
  fi
done

echo "Done!"
