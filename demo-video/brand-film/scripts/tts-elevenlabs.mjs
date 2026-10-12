// Narration with ElevenLabs: the exact script, one request per scene line, written to assets/voice-eleven/line-N.wav.
// Needs ELEVENLABS_API_KEY in .env.local (never printed). Voice: ELEVEN_VOICE_ID or the film's chosen voice.
// Neighbouring lines are passed as context so the delivery stays continuous across the seven requests.
// Usage: node demo-video/brand-film/scripts/tts-elevenlabs.mjs [lineIndex...]
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { LINES } from './script.mjs';

const env = readFileSync(new URL('../../../.env.local', import.meta.url), 'utf8');
const read = name => process.env[name] || new RegExp(`^${name}=(.*)$`, 'm').exec(env)?.[1]?.trim().replace(/^["']|["']$/g, '');
const key = read('ELEVENLABS_API_KEY');
if (!key) throw Error('Add ELEVENLABS_API_KEY=... to .env.local');
const voice = read('ELEVEN_VOICE_ID') || 'jIqiRM4Svh204ihzOZ39';
const OUT = new URL('../assets/voice-eleven/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const only = process.argv.slice(2).map(Number);

for (const [i, line] of LINES.entries()) {
  if (only.length && !only.includes(i)) continue;
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({
      text: line.text,
      model_id: 'eleven_multilingual_v2',
      previous_text: LINES[i - 1]?.text, next_text: LINES[i + 1]?.text,
      voice_settings: { stability: .55, similarity_boost: .8, style: .15, use_speaker_boost: true, speed: .94 },
    }),
  });
  if (!res.ok) throw Error(`ElevenLabs failed for line ${i}: ${res.status} ${(await res.text()).slice(0, 300)}`);
  const mp3 = `${OUT}line-${i}.mp3`;
  writeFileSync(mp3, Buffer.from(await res.arrayBuffer()));
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', mp3, '-ar', '48000', '-ac', '1', `${OUT}line-${i}.wav`]);
  console.log('voiced', i, line.text);
}
