// Subtitle file from the placed narration (assets/<voiceDir>/narration.json) → out/<name>.srt
// Usage: node demo-video/brand-film/scripts/make-srt.mjs [voiceDir=voice] [out=out/wear-your-batik-brand-film.srt]
import { readFileSync, writeFileSync } from 'node:fs';
const voiceDir = process.argv[2] || 'voice';
const out = process.argv[3] || new URL('../out/wear-your-batik-brand-film.srt', import.meta.url).pathname;
const { sentences } = JSON.parse(readFileSync(new URL(`../assets/${voiceDir}/narration.json`, import.meta.url), 'utf8'));
const ts = s => { const ms = Math.round(s * 1000); const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
const cues = sentences.map((s, i) => {
  const next = sentences[i + 1];
  const end = Math.min(s.end + .3, next ? next.start - .04 : 60, 60);
  return `${i + 1}\n${ts(s.start)} --> ${ts(end)}\n${s.caption}\n`;
});
writeFileSync(out, cues.join('\n'));
console.log(`wrote ${out}: ${cues.length} cues`);
