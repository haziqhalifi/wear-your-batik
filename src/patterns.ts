export type Motif = 'flower' | 'leaf' | 'flow' | 'orchid' | 'fan' | 'geometry';
export type Stroke = {
  points: [number, number][]; color: string; width: number;
  kind?: 'pen' | 'wax' | 'dots' | 'stamp' | 'erase';
  stamp?: Motif; rotation?: number; size?: number; flipX?: boolean; flipY?: boolean;
  accent?: string; secondary?: string; wax?: string;
};
export type Design = {
  motif: Motif;
  background: string; foreground: string; accent: string; secondary: string; wax: string;
  scale: number; rotation: number; density: number;
  arrangement: 'grid' | 'staggered';
  texture: 'plain' | 'dots' | 'crackle';
  placement: 'allover' | 'hem' | 'panels';
  mode: 'motifs' | 'draw'; underlay: boolean; strokes: Stroke[];
  sleeve: 'short' | 'long' | 'sleeveless';
  collar: 'classic' | 'mandarin' | 'round'; fit: 'regular' | 'relaxed';
};
export const PALETTES = [
  { name: 'Laut & coral', background: '#123f50', foreground: '#ef785c', accent: '#efbd66', secondary: '#479c96', wax: '#f9e6b8' },
  { name: 'Bunga magenta', background: '#48275d', foreground: '#e76192', accent: '#f4ba50', secondary: '#56aaa0', wax: '#fff0ce' },
  { name: 'Indigo malam', background: '#172c53', foreground: '#668db5', accent: '#d9ac60', secondary: '#3d646d', wax: '#f6e5be' },
  { name: 'Hijau rimba', background: '#164b40', foreground: '#a8c271', accent: '#e5a44e', secondary: '#4f9181', wax: '#f3edbe' },
  { name: 'Senja merah', background: '#823c43', foreground: '#f3a780', accent: '#e4be66', secondary: '#9d7288', wax: '#ffedcb' },
  { name: 'Hitam & ivory', background: '#252728', foreground: '#e0d8c7', accent: '#bb9261', secondary: '#7f8980', wax: '#faf2dc' },
] as const;
export const MOTIFS = [
  { value: 'flower', label: 'Bunga raya', description: 'Open petals, fine veins and curling stems.' },
  { value: 'leaf', label: 'Daun tropika', description: 'Sweeping tropical leaves with wax-like veins.' },
  { value: 'orchid', label: 'Orkid', description: 'Layered blossoms with small buds and foliage.' },
  { value: 'flow', label: 'Sulur', description: 'Curving vines, tendrils and scattered blooms.' },
  { value: 'fan', label: 'Kipas daun', description: 'Radiating leaves with delicate dotted details.' },
  { value: 'geometry', label: 'Pucuk', description: 'An original pointed, botanical border motif.' },
] as const;
export const DEFAULT_DESIGN: Design = {
  motif: 'flower', ...PALETTES[0], scale: 1.7, rotation: -15, density: 1,
  arrangement: 'staggered', texture: 'dots', placement: 'allover',
  mode: 'motifs', underlay: false, strokes: [], sleeve: 'short', collar: 'classic', fit: 'regular',
};
export const safeColor = (value: string) => /^#[\da-f]{6}$/i.test(value) ? value : '#283c65';
const n = (value: number, fallback = 0) => Number.isFinite(value) ? value : fallback;

// Original vector studies based on the floral, foliage and wax-outline direction in the supplied references.
export function motifArtwork(kind: Motif, colours: Pick<Design, 'foreground' | 'accent' | 'secondary' | 'wax'>): string {
  const f = safeColor(colours.foreground), a = safeColor(colours.accent), s = safeColor(colours.secondary), w = safeColor(colours.wax);
  const leaf = `<path d="M0 0C-20-4-23-24-15-39C1-32 10-16 0 0Z" fill="${s}"/><path d="M0 0L-14-34M-5-12L-16-17M-9-23L-19-26" fill="none"/>`;
  const bloom = `<g fill="${f}">${Array.from({ length: 5 }, (_, i) => `<path transform="rotate(${i * 72})" d="M0 2C-12-3-23-14-15-25C-10-34-2-27 0-25C7-35 21-28 19-18C18-9 7-3 0 2Z"/><path transform="rotate(${i * 72})" d="M0-3L-5-21M1-4L8-22M-2-5L-11-16" fill="none" stroke-width=".65"/>`).join('')}</g><circle r="5" fill="${a}"/><path d="M0 0Q14 2 23-11" fill="none" stroke-width="2"/><g fill="${a}"><circle cx="23" cy="-11" r="2.8"/><circle cx="20" cy="-15" r="1.6"/><circle cx="27" cy="-9" r="1.6"/></g>`;
  let body = '';
  if (kind === 'flower') body = `<path d="M16 99Q72 65 59 19M43 78Q8 59 15 32M61 52Q96 61 94 26" fill="none" stroke-width="1.5"/><g transform="translate(31 82) rotate(-44) scale(.8)">${leaf}</g><g transform="translate(70 71) rotate(64) scale(.8)">${leaf}</g><g transform="translate(55 43)">${bloom}</g><g transform="translate(14 24) scale(.3)">${bloom}</g>`;
  if (kind === 'leaf') body = `<path d="M12 98Q70 56 78 6" fill="none" stroke-width="2"/>${[0,1,2,3].map(i => `<g transform="translate(${29+i*12} ${83-i*18}) rotate(${i % 2 ? 78 : -25}) scale(${.9-i*.08})">${leaf}</g>`).join('')}<g transform="translate(82 78) scale(.35)">${bloom}</g>`;
  if (kind === 'orchid') body = `<path d="M14 102Q73 79 75 10" fill="none" stroke-width="1.5"/><g transform="translate(27 87) rotate(-40)">${leaf}</g>${[[51,50,1],[80,18,.45],[22,23,.5]].map(([x,y,z]) => `<g transform="translate(${x} ${y}) scale(${z})"><g fill="${f}"><path d="M0 0C-37-6-37-37-17-28L0-8C-6-41 18-43 14-18L5-3C30-35 45-12 20-2Z"/><path d="M-2 0C-38 3-23 32-7 15C3 36 30 20 15 6Z" fill="${a}"/></g><path d="M-2-4L-18-21M4-5L9-26M9-3L27-14M-4 5L-17 16M5 7L13 17" fill="none" stroke-width=".8"/><circle r="5" fill="${s}"/></g>`).join('')}`;
  if (kind === 'flow') body = `<path d="M-10 84C70 105 96 17 47 12C8 8 5 65 39 60C64 57 61 33 44 34M42 60Q95 55 107 86" fill="none" stroke-width="2"/><g transform="translate(74 70) rotate(90) scale(.7)">${leaf}</g><g transform="translate(19 74) rotate(-50) scale(.65)">${leaf}</g><g transform="translate(76 22) scale(.45)">${bloom}</g>`;
  if (kind === 'fan') body = `<g transform="translate(51 84)">${[-60,-30,0,30,60].map((r,i) => `<g transform="rotate(${r})"><path d="M0 0C-22-20-15-58 0-69C17-50 18-21 0 0Z" fill="${i%2 ? a : s}"/><path d="M0-3V-61M0-20L-9-32M0-34L9-46M0-48L-7-55" fill="none" stroke-width=".8"/></g>`).join('')}</g><circle cx="51" cy="85" r="5" fill="${f}"/>`;
  if (kind === 'geometry') body = `<path d="M10 92L50 8L90 92Z" fill="${s}"/><path d="M22 84L50 25L78 84Z" fill="${f}"/><path d="M50 81V36M50 70L35 57M50 57L59 46M50 79L67 65" fill="none" stroke-width="1.3"/>${[16,30,44,58,72,86].map(x => `<circle cx="${x}" cy="96" r="1.6" fill="${a}"/>`).join('')}<path d="M2 5L12 15L2 25M98 5L88 15L98 25" fill="none"/>`;
  return `<g stroke="${w}" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">${body}<g fill="${a}" stroke-width=".5"><circle cx="6" cy="48" r="1.6"/><circle cx="91" cy="94" r="2"/><circle cx="94" cy="8" r="1"/></g></g>`;
}

function strokeShape(stroke: Stroke, color: string) {
  const points = stroke.points.filter(p => p.every(Number.isFinite));
  if (!points.length) return '';
  const width = Math.max(.2, Math.min(30, n(stroke.width, 2)));
  const dots = stroke.kind === 'dots' ? ` stroke-dasharray=".01 ${width * 2}"` : '';
  return points.length === 1 ? `<circle cx="${points[0][0]}" cy="${points[0][1]}" r="${width / 2}" fill="${color}"/>` : `<path d="M${points.map(p => p.join(' ')).join('L')}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"${dots}/>`;
}
export function marksArtwork(strokes: Stroke[], prefix = 'ink') {
  let art = '';
  strokes.forEach((stroke, i) => {
    if (stroke.kind === 'erase') {
      art = `<defs><mask id="${prefix}-${i}" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><rect width="100" height="100" fill="white"/>${strokeShape(stroke, 'black')}</mask></defs><g mask="url(#${prefix}-${i})">${art}</g>`;
    } else if (stroke.kind === 'stamp') {
      const [x,y] = stroke.points[0] || [50,50];
      art += `<g transform="translate(${n(x)} ${n(y)}) scale(${stroke.flipX ? -1 : 1} ${stroke.flipY ? -1 : 1}) rotate(${n(stroke.rotation || 0)}) scale(${n(stroke.size || 30) / 100}) translate(-50 -50)">${motifArtwork(stroke.stamp || 'flower', { foreground: stroke.color, accent: stroke.accent || stroke.color, secondary: stroke.secondary || stroke.color, wax: stroke.wax || '#fff0ce' })}</g>`;
    } else art += strokeShape(stroke, safeColor(stroke.color));
  });
  return art;
}
function ground(d: Design) {
  if (d.texture === 'dots') return `<g fill="${safeColor(d.wax)}" opacity=".24">${Array.from({ length: 100 }, (_, i) => `<circle cx="${i % 10 * 10 + (Math.floor(i / 10) % 2 ? 5 : 0)}" cy="${Math.floor(i / 10)*10}" r=".65"/>`).join('')}</g>`;
  if (d.texture === 'crackle') return `<path d="M0 17L19 12L29 0M19 12L26 36L0 49M26 36L49 28L57 0M49 28L64 52L100 39M64 52L57 77L81 100M57 77L29 68L10 100M29 68L26 36M100 81L82 78L64 52" fill="none" stroke="${safeColor(d.wax)}" stroke-width=".45" opacity=".35"/>`;
  return '';
}
export function tileArtwork(d: Design, prefix = 'tile') {
  const base = d.mode === 'motifs' || d.underlay ? `<g transform="translate(50 50) rotate(${n(d.rotation)}) scale(${n(d.density, 1)}) translate(-50 -50)">${motifArtwork(d.motif, d)}</g>` : '';
  return `<rect width="100" height="100" fill="${safeColor(d.background)}"/>${ground(d)}${base}${d.mode === 'draw' ? marksArtwork(d.strokes, prefix) : ''}`;
}
function tileBody(d: Design) {
  const mark = tileArtwork(d, 'first');
  // Each repeat is clipped to its own tile; brush marks at an edge never bleed into adjacent cells.
  return `<rect width="100" height="${d.arrangement === 'staggered' ? 200 : 100}" fill="${safeColor(d.background)}"/><defs><clipPath id="tile-clip"><rect width="100" height="100"/></clipPath></defs><g clip-path="url(#tile-clip)">${mark}</g>${d.arrangement === 'staggered' ? `<g transform="translate(-50 100)"><g clip-path="url(#tile-clip)">${tileArtwork(d, 'second')}</g></g><g transform="translate(50 100)"><g clip-path="url(#tile-clip)">${tileArtwork(d, 'third')}</g></g>` : ''}`;
}
export function patternTileSvg(d: Design): string {
  const h = d.arrangement === 'staggered' ? 200 : 100;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${100 * d.scale}" height="${h * d.scale}" viewBox="0 0 100 ${h}">${tileBody(d)}</svg>`;
}
function patternDef(d: Design) {
  const h = d.arrangement === 'staggered' ? 200 : 100;
  return `<pattern id="batik" width="${72 * d.scale}" height="${h * .72 * d.scale}" patternUnits="userSpaceOnUse" viewBox="0 0 100 ${h}">${tileBody(d)}</pattern>`;
}
function border(d: Design, x: number, y: number, width: number, height: number) {
  return `<g><rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${safeColor(d.foreground)}"/><path d="M${x} ${y+4}h${width}M${x} ${y+height-4}h${width}" stroke="${safeColor(d.wax)}" stroke-width="2"/>${Array.from({ length: Math.ceil(width/28) }, (_, i) => `<g transform="translate(${x+i*28} ${y+8}) scale(.28 ${(height-16)/100})">${motifArtwork('geometry', d)}</g>`).join('')}</g>`;
}
export function fabricSvg(d: Design) {
  const placement = d.placement === 'hem' ? border(d, 0, 365, 480, 105) : d.placement === 'panels' ? `<rect x="145" width="190" height="480" fill="${safeColor(d.background)}"/><path d="M151 0V480M329 0V480" stroke="${safeColor(d.wax)}" stroke-width="3"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 480 480"><defs>${patternDef(d)}</defs><rect width="480" height="480" fill="url(#batik)"/>${placement}</svg>`;
}

export function shirtSvg(d: Design): string {
  const left = d.fit === 'relaxed' ? 193 : 207, right = 600 - left;
  const sleeves = d.sleeve === 'long' ? `L480 425L421 442L${right} 208` : d.sleeve === 'sleeveless' ? `L${right} 208` : `L486 207L421 250L${right} 208`;
  const otherSleeve = d.sleeve === 'long' ? 'L179 442L120 425' : d.sleeve === 'sleeveless' ? '' : 'L179 250L114 207';
  const shape = `M192 98L245 72Q300 ${d.collar === 'round' ? 149 : 101} 355 72L408 98${sleeves}L${right} 503Q300 520 ${left} 503L${left} 208${otherSleeve}Z`;
  const collar = d.collar === 'classic' ? `<path d="M245 72L300 103L277 157L232 106ZM355 72L300 103L323 157L368 106Z" fill="url(#batik)" stroke="#252b35" stroke-opacity=".35" stroke-width="2"/>` : d.collar === 'mandarin' ? `<path d="M245 72Q300 101 355 72L355 91Q300 122 245 91Z" fill="url(#batik)" stroke="#252b35" stroke-opacity=".35" stroke-width="2"/>` : `<path d="M245 73Q300 149 355 73" fill="none" stroke="${safeColor(d.background)}" stroke-width="12"/>`;
  const seams = `M192 106L${left} 208M408 106L${right} 208${d.sleeve === 'short' ? 'M124 194L182 233M418 233L477 194' : ''}M${left + 2} 493Q300 507 ${right - 2} 493`;
  const placement = d.placement === 'hem' ? border(d, 180, 402, 240, 90) : d.placement === 'panels' ? `<rect x="257" y="100" width="86" height="420" fill="${safeColor(d.background)}"/><path d="M257 100V520M343 100V520" stroke="${safeColor(d.wax)}" stroke-width="2"/>` : '';
  const cuffs = d.sleeve === 'long' ? '<path d="M123 409L178 425M422 425L477 409" stroke="#252b35" stroke-opacity=".35" stroke-width="3"/>' : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 600 600"><defs>${patternDef(d)}<clipPath id="shirt"><path d="${shape}"/></clipPath><linearGradient id="shade"><stop stop-color="#000" stop-opacity=".14"/><stop offset=".25" stop-color="#fff" stop-opacity=".08"/><stop offset=".53" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient><filter id="shadow"><feDropShadow dx="0" dy="12" stdDeviation="10" flood-opacity=".1"/></filter></defs><rect width="600" height="600" fill="#f5f2ea"/><path d="${shape}" fill="url(#batik)" filter="url(#shadow)"/><g clip-path="url(#shirt)">${placement}<rect x="100" y="60" width="400" height="480" fill="url(#shade)"/><path d="M300 106V513" stroke="${safeColor(d.background)}" stroke-width="16"/><path d="M307 109V509" stroke="#252b35" stroke-opacity=".2"/><path d="${seams}" fill="none" stroke="#252b35" stroke-opacity=".27" stroke-width="2"/></g>${collar}${cuffs}${d.collar !== 'round' ? '<path d="M245 73Q300 103 355 73L300 104Z" fill="#232b3a" fill-opacity=".35"/>' : ''}${[171, 226, 281, 336, 391, 446].map(y => `<circle cx="300" cy="${y}" r="3.3" fill="#f8f5e9" stroke="#353744" stroke-width=".8"/>`).join('')}</svg>`;
}

export const svgUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export async function svgPng(svg: string, width = 1024, height = 1024): Promise<string> {
  const img = new Image();
  img.src = svgUrl(svg);
  await img.decode();
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Image export is unavailable in this browser.');
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/png');
}
