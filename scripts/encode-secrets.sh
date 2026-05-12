#!/bin/bash
# Reads .env and outputs .env.encoded with base64-encoded values prefixed with SECRET_
set -e
if [ ! -f .env ]; then
  echo "ERROR: .env file not found. Copy .env.example to .env and fill in your API keys."
  exit 1
fi
> .env.encoded
while IFS= read -r line; do
  [[ "$line" =~ ^#.*$ ]] && continue
  [[ -z "$line" ]] && continue
  key="${line%%=*}"
  value="${line#*=}"
  encoded=$(printf '%s' "$value" | base64 | tr -d '\n')
  echo "SECRET_${key}=${encoded}" >> .env.encoded
done < .env
echo ".env.encoded generated successfully."
