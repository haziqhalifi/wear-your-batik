import { garmentInfo, type GarmentType } from './garments';
export type Motif = 'flower' | 'leaf' | 'flow' | 'orchid' | 'fan' | 'geometry';
export type Stroke = {
  points: [number, number][]; color: string; width: number;
  kind?: 'pen' | 'wax' | 'dots' | 'stamp' | 'erase';
  stamp?: Motif; rotation?: number; size?: number; flipX?: boolean; flipY?: boolean;
  accent?: string; secondary?: string; wax?: string;
};
export type Design = {
  garment: GarmentType;
  wearer: 'male' | 'female';
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
  garment: 'shirt', wearer: 'male', motif: 'flower', ...PALETTES[0], scale: 1.7, rotation: -15, density: 1,
  arrangement: 'staggered', texture: 'dots', placement: 'allover',
  mode: 'motifs', underlay: false, strokes: [], sleeve: 'short', collar: 'classic', fit: 'regular',
};
// New sessions begin with empty cloth; the original design remains a motif preset.
export const BLANK_DESIGN: Design = { ...DEFAULT_DESIGN, mode: 'draw', underlay: false, texture: 'plain', strokes: [] };
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
export function stampTransform(stroke: Stroke) {
  const [x, y] = stroke.points[0] || [50, 50];
  return `translate(${n(x)} ${n(y)}) scale(${stroke.flipX ? -1 : 1} ${stroke.flipY ? -1 : 1}) rotate(${n(stroke.rotation || 0)}) scale(${n(stroke.size || 30) / 100}) translate(-50 -50)`;
}
export function marksArtwork(strokes: Stroke[], prefix = 'ink') {
  let art = '';
  strokes.forEach((stroke, i) => {
    if (stroke.kind === 'erase') {
      art = `<defs><mask id="${prefix}-${i}" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><rect width="100" height="100" fill="white"/>${strokeShape(stroke, 'black')}</mask></defs><g mask="url(#${prefix}-${i})">${art}</g>`;
    } else if (stroke.kind === 'stamp') {
      art += `<g transform="${stampTransform(stroke)}">${motifArtwork(stroke.stamp || 'flower', { foreground: stroke.color, accent: stroke.accent || stroke.color, secondary: stroke.secondary || stroke.color, wax: stroke.wax || '#fff0ce' })}</g>`;
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

/** Flat panel atlas for concept meshes; same repeat, marks and border artwork as the editor. */
export function garmentPanelSvg(d: Design, width: number, height: number, part: 'body' | 'sleeve' | 'trim' | 'wrap') {
  const w = width * 600, h = height * 600;
  const placement = part !== 'body' && part !== 'wrap' ? '' : d.placement === 'hem' ? border(d, 0, Math.max(0, h - 82), w, 72)
    : d.placement === 'panels' && part === 'wrap' ? [0.057, .503, .95].map(centre => `<rect x="${(centre-.085)*w}" width="${w*.17}" height="${h}" fill="${safeColor(d.background)}" stroke="${safeColor(d.wax)}" stroke-width="2"/>`).join('')
    : d.placement === 'panels' ? `<rect x="${w*.32}" width="${w*.36}" height="${h}" fill="${safeColor(d.background)}"/><path d="M${w*.32} 0V${h}M${w*.68} 0V${h}" stroke="${safeColor(d.wax)}" stroke-width="2"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${patternDef(d)}</defs><rect width="${w}" height="${h}" fill="url(#batik)"/>${placement}</svg>`;
}

function topSvg(d: Design): string {
  const left = d.fit === 'relaxed' ? 193 : 207, right = 600 - left;
  const sleeves = d.sleeve === 'long' ? `L480 425L421 442L${right} 208` : d.sleeve === 'sleeveless' ? `L${right} 208` : `L486 207L421 250L${right} 208`;
  const otherSleeve = d.sleeve === 'long' ? 'L179 442L120 425' : d.sleeve === 'sleeveless' ? '' : 'L179 250L114 207';
  const body = (d.garment === 'blouse' || d.wearer === 'female') ? `Q${right - 25} 345 ${right} 503Q300 520 ${left} 503Q${left + 25} 345 ${left} 208` : `L${right} 503Q300 520 ${left} 503L${left} 208`;
  const shape = `M192 98L245 72Q300 ${d.collar === 'round' ? 149 : 101} 355 72L408 98${sleeves}${body}${otherSleeve}Z`;
  const collar = d.collar === 'classic' ? `<path d="M245 72L300 103L277 157L232 106ZM355 72L300 103L323 157L368 106Z" fill="url(#batik)" stroke="#252b35" stroke-opacity=".35" stroke-width="2"/>` : d.collar === 'mandarin' ? `<path d="M245 72Q300 101 355 72L355 91Q300 122 245 91Z" fill="url(#batik)" stroke="#252b35" stroke-opacity=".35" stroke-width="2"/>` : `<path d="M245 73Q300 149 355 73" fill="none" stroke="${safeColor(d.background)}" stroke-width="12"/>`;
  const seams = `M192 106L${left} 208M408 106L${right} 208${d.sleeve === 'short' ? 'M124 194L182 233M418 233L477 194' : ''}M${left + 2} 493Q300 507 ${right - 2} 493`;
  const placement = d.placement === 'hem' ? border(d, 180, 402, 240, 90) : d.placement === 'panels' ? `<rect x="257" y="100" width="86" height="420" fill="${safeColor(d.background)}"/><path d="M257 100V520M343 100V520" stroke="${safeColor(d.wax)}" stroke-width="2"/>` : '';
  const cuffs = d.sleeve === 'long' ? '<path d="M123 409L178 425M422 425L477 409" stroke="#252b35" stroke-opacity=".35" stroke-width="3"/>' : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 600 600"><defs>${patternDef(d)}<clipPath id="shirt"><path d="${shape}"/></clipPath><linearGradient id="shade"><stop stop-color="#000" stop-opacity=".14"/><stop offset=".25" stop-color="#fff" stop-opacity=".08"/><stop offset=".53" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient><filter id="shadow"><feDropShadow dx="0" dy="12" stdDeviation="10" flood-opacity=".1"/></filter></defs><rect width="600" height="600" fill="#f5f2ea"/><path d="${shape}" fill="url(#batik)" filter="url(#shadow)"/><g clip-path="url(#shirt)">${placement}<rect x="100" y="60" width="400" height="480" fill="url(#shade)"/><path d="M300 106V513" stroke="${safeColor(d.background)}" stroke-width="16"/><path d="M307 109V509" stroke="#252b35" stroke-opacity=".2"/><path d="${seams}" fill="none" stroke="#252b35" stroke-opacity=".27" stroke-width="2"/></g>${collar}${cuffs}${d.collar !== 'round' ? '<path d="M245 73Q300 103 355 73L300 104Z" fill="#232b3a" fill-opacity=".35"/>' : ''}${[171, 226, 281, 336, 391, 446].map(y => `<circle cx="300" cy="${y}" r="3.3" fill="#f8f5e9" stroke="#353744" stroke-width=".8"/>`).join('')}</svg>`;
}

/** One garment renderer is used by thumbnails, the live preview and photo try-on. */
export function garmentSvg(d: Design): string {
  if (d.garment === 'shirt' || d.garment === 'blouse') return topSvg(d);
  const info = garmentInfo(d.garment);
  const lower = info.region === 'lower';
  const isDress = ['gown', 'dress', 'maxi', 'kids-dress'].includes(d.garment);
  const kids = info.group === 'kids';
  const relaxed = d.fit === 'relaxed';
  const left = relaxed ? 212 : 225, right = 600 - left;
  const top = lower ? 105 : 70;
  const hem = d.garment === 'skirt' ? 493 : d.garment === 'dress' ? 455 : d.garment === 'kids-dress' ? 470 : d.garment === 'kids-shirt' ? 420 : d.garment === 'romper' ? 460 : ['blazer','jacket'].includes(d.garment) ? 450 : 535;
  const waist = kids ? 245 : isDress ? 265 : 320;
  const sleeve = info.sleeves.includes(d.sleeve) ? d.sleeve : info.sleeve;
  const collar = info.collars.includes(d.collar) ? d.collar : info.collar;
  const neck = collar === 'round' ? 130 : 102;
  const shoulders = `M250 70Q300 ${neck} 350 70L405 103`;
  const rightSleeve = sleeve === 'long' ? `L474 365L426 384L${right} 205` : sleeve === 'short' ? `L461 195L415 225L${right} 195` : `L${right} 195`;
  const leftSleeve = sleeve === 'long' ? 'L174 384L126 365L195 103Z' : sleeve === 'short' ? 'L185 225L139 195L195 103Z' : 'L195 103Z';
  let shape: string;
  let detail = '';
  const bg = safeColor(d.background), wax = safeColor(d.wax);
  if (d.garment === 'sarong') {
    shape = 'M195 105H405L416 535Q300 550 184 535Z';
    detail = '<path d="M195 123H405M365 125L344 527M205 134L198 515M386 136L398 518"/>';
  } else if (d.garment === 'skirt') {
    shape = `M${left} 105H${right}L454 493Q300 526 146 493Z`;
    detail = `<path d="M${left} 125H${right}M245 137L202 490M300 138V503M355 137L398 490"/>`;
  } else if (d.garment === 'palazzo') {
    shape = `M${left} 105H${right}L430 535H316L300 267L284 535H170Z`;
    detail = `<path d="M${left} 126H${right}M300 127V267M249 140L228 518M351 140L372 518M174 519H284M316 519H426"/>`;
  } else {
    const sides = isDress
      ? `Q${relaxed ? right : 334} 240 ${relaxed ? right : 337} ${waist}L${d.garment === 'gown' ? 464 : 438} ${hem}Q300 ${hem + 20} ${d.garment === 'gown' ? 136 : 162} ${hem}L${relaxed ? left : 263} ${waist}Q${relaxed ? left : 266} 240 ${left} 195`
      : d.garment === 'romper' ? `L390 460H315L300 351L285 460H210L${left} 195`
      : d.garment === 'kebaya' ? `Q338 295 381 488L327 529L300 481L273 529L219 488Q262 295 ${left} 195`
      : `L${right} ${hem}Q300 ${hem + 12} ${left} ${hem}L${left} 195`;
    shape = shoulders + rightSleeve + sides + leftSleeve;
    detail = `<path d="M195 110L${left} 195M405 110L${right} 195"/>`;
    if (isDress) detail += `<path d="M${relaxed ? left : 263} ${waist}Q300 ${waist + 9} ${relaxed ? right : 337} ${waist}M275 ${waist + 16}L236 ${hem-12}M325 ${waist + 16}L364 ${hem-12}"/>`;
    if (d.garment === 'blazer') detail += `<path d="M250 70L300 250L350 70L371 151L337 174L348 193L300 270L252 193L263 174L229 151Z" fill="${bg}"/><path d="M300 250V450M238 347H280M320 347H362"/><circle cx="309" cy="305" r="4" fill="${wax}"/>`;
    else if (d.garment === 'kebaya') detail += `<path d="M250 70L300 218L350 70M300 218V481"/><path d="M273 529L300 481L327 529" stroke="${wax}" stroke-width="6"/>`;
    else if (!isDress) detail += `<path d="M300 110V${d.garment === 'romper' ? 352 : hem}" stroke="${bg}" stroke-width="10"/><path d="M303 110V${d.garment === 'romper' ? 352 : hem}"/>`;
    if (d.garment === 'jacket') detail += `<path d="M${left} ${hem-14}H${right}M129 351L176 369M424 369L471 351" stroke="${bg}" stroke-width="19"/><path d="M295 128V${hem}" stroke="${wax}" stroke-width="2"/>`;
    if (info.collars.length && collar === 'classic') detail += `<path d="M250 70L300 102L278 144L238 102ZM350 70L300 102L322 144L362 102Z" fill="${bg}"/>`;
    if (info.collars.length && collar === 'mandarin') detail += `<path d="M250 70Q300 102 350 70V88Q300 120 250 88Z" fill="${bg}"/>`;
    if (d.garment === 'kids-shirt') detail += [162,212,262,312,362].map(y => `<circle cx="300" cy="${y}" r="3" fill="${wax}"/>`).join('');
  }
  const placement = d.placement === 'hem' ? border(d, 100, hem - 79, 400, 70) : d.placement === 'panels' ? `<rect x="263" y="${top}" width="74" height="490" fill="${bg}"/><path d="M263 ${top}V560M337 ${top}V560" stroke="${wax}" stroke-width="2"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 600 600"><defs>${patternDef(d)}<clipPath id="garment"><path d="${shape}"/></clipPath><linearGradient id="garment-shade"><stop stop-color="#000" stop-opacity=".13"/><stop offset=".45" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".15"/></linearGradient></defs><rect width="600" height="600" fill="#f5f2ea"/><path d="${shape}" fill="url(#batik)" stroke="${bg}" stroke-width="2"/><g clip-path="url(#garment)">${placement}<rect x="100" y="60" width="400" height="500" fill="url(#garment-shade)"/><g fill="none" stroke="#252b35" stroke-opacity=".45" stroke-width="2" stroke-linejoin="round">${detail}</g></g></svg>`;
}
export const shirtSvg = garmentSvg;

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
