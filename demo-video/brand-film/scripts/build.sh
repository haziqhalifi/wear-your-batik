#!/bin/zsh
# Rebuilds the "Wear Your Batik" brand film end to end.
#   VOICE=voice-eleven   narration from ElevenLabs (default; needs ELEVENLABS_API_KEY in .env.local, voice jIqiRM4Svh204ihzOZ39)
#   VOICE=voice          narration from OpenAI gpt-4o-mini-tts (needs a valid OPENAI_API_KEY in .env.local)
#   VOICE=voice-scratch  local macOS timing voice (placeholder, files get "-temp-voice")
#   FORMATS="16x9"       which versions to render: any of 9x16 16x9 (default both)
#   CAPTURE=0            reuse the existing app captures instead of re-recording the running app
#   TTS=0                use recordings already in assets/$VOICE/line-0.wav … line-6.wav (e.g. a human narrator)
# Requires: the app at http://127.0.0.1:5180 (npm run dev) when CAPTURE=1, ffmpeg, Playwright's Chromium.
set -euo pipefail
cd "$(dirname "$0")/../../.."
BF=demo-video/brand-film
VOICE=${VOICE:-voice-eleven}
FORMATS=(${=FORMATS:-9x16 16x9})
# Anything not voiced by a final narrator is labelled so it cannot be mistaken for the finished film.
SUFFIX=""; [[ $VOICE == voice-scratch ]] && SUFFIX="-temp-voice"
if [[ ${CAPTURE:-1} == 1 ]]; then
  node $BF/scripts/capture-app.mjs
  node $BF/scripts/capture-3d.mjs
fi
npx tsx $BF/scripts/export-assets.ts
if [[ ${TTS:-1} == 1 ]]; then
  case $VOICE in
    voice-eleven) node $BF/scripts/tts-elevenlabs.mjs ;;
    voice) node $BF/scripts/tts.mjs ${TTS_VOICE:-marin} ;;
    *) node $BF/scripts/scratch-voice.mjs ;;
  esac
fi
node $BF/scripts/build-voice.mjs $VOICE
node $BF/scripts/make-score.mjs $VOICE
$BF/scripts/mix.sh $VOICE
for F in $FORMATS; do
  SIZE=1080x1920; [[ $F == 16x9 ]] && SIZE=1920x1080
  node $BF/scripts/render.mjs video $SIZE $BF/out/wear-your-batik-brand-film-$F$SUFFIX.mp4 $BF/out/audio/mix-$VOICE.wav "voice=$VOICE&subs=1"
  node $BF/scripts/render.mjs video $SIZE $BF/out/wear-your-batik-brand-film-$F-clean$SUFFIX.mp4 $BF/out/audio/mix-$VOICE.wav "voice=$VOICE"
done
node $BF/scripts/make-srt.mjs $VOICE $BF/out/wear-your-batik-brand-film$SUFFIX.srt
node $BF/scripts/verify.mjs "$SUFFIX" "$FORMATS"
