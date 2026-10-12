#!/bin/zsh
# Saves an ElevenLabs API key to the repo's .env.local without echoing it.
set -euo pipefail
ENV_FILE="$(dirname "$0")/../../../.env.local"
read -rs "K?Paste your ElevenLabs API key, then press Enter: "
echo
[[ -z "$K" ]] && { echo "No key entered; nothing saved."; exit 1; }
grep -v '^ELEVENLABS_API_KEY=' "$ENV_FILE" > "$ENV_FILE.tmp" || true
echo "ELEVENLABS_API_KEY=$K" >> "$ENV_FILE.tmp"
mv "$ENV_FILE.tmp" "$ENV_FILE"
unset K
echo "Saved to .env.local. You can close this tab."
