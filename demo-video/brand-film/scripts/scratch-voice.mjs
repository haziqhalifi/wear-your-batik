// Temporary narration with a local macOS voice, for timing only (used until a valid OpenAI key is available).
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { LINES } from './script.mjs';
const OUT = new URL('../assets/voice-scratch/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const voice = process.argv[2] || 'Samantha', rate = process.argv[3] || '158';
for (const [i, line] of LINES.entries()) {
  // Light pauses after sentences, as the direction asks for gentle pauses.
  const text = line.text.replace(/\. /g, '. [[slnc 260]] ').replace(/, /g, ', [[slnc 90]] ').replace(/Batik/g, 'Bahtik').replace(/batik/g, 'bahtik');
  execFileSync('say', ['-v', voice, '-r', rate, '-o', `${OUT}line-${i}.aiff`, text]);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', `${OUT}line-${i}.aiff`, '-ar', '48000', '-ac', '1', `${OUT}line-${i}.wav`]);
}
console.log('scratch narration written with', voice);
