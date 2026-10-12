// Narration: one warm female voice, subtle Malaysian English accent, exact script lines only.
// Uses the project's own OPENAI_API_KEY from .env.local (never printed). Output: assets/voice/line-N.wav
// Usage: node demo-video/brand-film/scripts/tts.mjs [voice] [lineIndex...]
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { LINES } from './script.mjs';

const env = readFileSync(new URL('../../../.env.local', import.meta.url), 'utf8');
const key = /^OPENAI_API_KEY=(.*)$/m.exec(env)?.[1]?.trim().replace(/^["']|["']$/g, '');
if (!key) throw Error('OPENAI_API_KEY is missing from .env.local');
const OUT = new URL('../assets/voice/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const voice = process.argv[2] || 'marin';
const only = process.argv.slice(3).map(Number);

const instructions = `Voice: a single warm female narrator speaking clear, natural English with a subtle Malaysian accent: gentle, educated Malaysian cadence, never exaggerated or caricatured.
Tone: intimate, assured and inviting, with restrained emotion, like narrating a quiet, beautiful craft film about textile art.
Pacing: unhurried and calm. Leave gentle pauses at full stops and soft breaths at commas. Do not rush.
Pronunciation: "batik" is said naturally as "BAH-tik". "Wear Your Batik" is a brand name, spoken warmly.
Delivery: close and soft but clear, no sales energy, no added words.`;

for (const [i, line] of LINES.entries()) {
  if (only.length && !only.includes(i)) continue;
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini-tts', voice, input: line.text, instructions, response_format: 'wav' }),
  });
  if (!res.ok) throw Error(`TTS failed for line ${i}: ${res.status} ${(await res.text()).slice(0, 300)}`);
  writeFileSync(`${OUT}line-${i}.wav`, Buffer.from(await res.arrayBuffer()));
  console.log('voiced', i, line.text);
}
