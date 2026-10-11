import { garmentInfo, type GarmentType } from '../src/garments.js';
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import sharp from 'sharp';

export class TryOnError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export function configuration() {
  let local: Record<string, string | undefined> = {};
  try { local = parseEnv(readFileSync('.env.local', 'utf8')); } catch { /* setup may be pending */ }
  return {
    apiKey: local.OPENAI_API_KEY || process.env.OPENAI_API_KEY || '',
    model: local.OPENAI_IMAGE_MODEL || process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2',
  };
}

export function tryOnPrompt(garment: GarmentType = 'shirt') {
  const info = garmentInfo(garment);
  const change = info.region === 'lower'
    ? "Replace only the person's lower garment. Preserve their existing upper garment."
    : info.region === 'full'
      ? "Replace the person's upper and lower clothing only as needed for this single one-piece garment."
      : garment === 'blazer' || garment === 'jacket'
        ? "Put this outer jacket over the person's existing inner top. Preserve their lower clothing."
        : "Replace only the person's upper garment. Preserve their lower clothing.";
  return `Create a realistic clothing try-on photograph.
Image 1 is the person to edit. Image 2 is the exact batik garment product design to put on that person.
The selected garment is: ${info.label}. ${info.hint}.
${change}
Match the silhouette, garment length, sleeve length, neckline, seams and closures shown in image 2. A sarong is wrapped cloth; palazzo pants have two distinct wide legs. A kebaya-inspired blouse is lined and opaque.
Preserve the identity, age, face, hair, skin, body proportions, hands, pose, shoes, background, framing and lighting of image 1. Never make an adult look like a child or a child look like an adult. Adapt the garment to the existing person without changing their body.
Faithfully reproduce the garment's pattern: same motif shapes, palette, relative repeat size, arrangement and border or panel placement. Do not invent a different batik design, add text or add accessories.
Drape the garment naturally, preserving plausible seams, buttons and folds. The pattern should follow the fabric without being replaced or blurred. Keep the person fully clothed with opaque fabric.
Return one photograph only. No comparison panels, borders, captions, swatches or watermark.`;
}
export const TRYON_PROMPT = tryOnPrompt();

export async function normalizeImage(value: unknown, label: string): Promise<string> {
  if (typeof value !== 'string') throw new TryOnError(400, 'INVALID_IMAGE', `Choose a ${label} image first.`);
  const match = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) throw new TryOnError(400, 'INVALID_IMAGE', `${label} must be a JPEG or PNG image.`);
  if (match[2].length > Math.ceil(10 * 1024 * 1024 / 3) * 4) throw new TryOnError(413, 'IMAGE_TOO_LARGE', `${label} must be 10 MB or smaller.`);
  const input = Buffer.from(match[2], 'base64');
  if (input.length > 10 * 1024 * 1024) throw new TryOnError(413, 'IMAGE_TOO_LARGE', `${label} must be 10 MB or smaller.`);
  try {
    const instance = sharp(input, { limitInputPixels: 32_000_000 });
    const meta = await instance.metadata();
    if (!['jpeg', 'png'].includes(meta.format || '') || !meta.width || !meta.height || (meta.pages || 1) > 1) throw new Error('Invalid image');
    if (meta.width < 64 || meta.height < 64) throw new Error('Too small');
    // Resizing and re-encoding removes metadata and bounds the provider payload.
    const png = await instance.rotate().resize({ width: 1536, height: 1536, fit: 'inside', withoutEnlargement: true }).png().toBuffer();
    return `data:image/png;base64,${png.toString('base64')}`;
  } catch {
    throw new TryOnError(400, 'INVALID_IMAGE', `${label} could not be read. Use a non-animated JPEG or PNG at least 64 pixels wide and tall.`);
  }
}

export async function generateTryOn(
  personImage: string, garmentImage: string,
  options: { apiKey: string; model: string; garmentType?: GarmentType; outputFormat?: 'png' | 'jpeg'; signal?: AbortSignal; fetcher?: typeof fetch },
) {
  if (!options.apiKey) throw new TryOnError(503, 'NOT_CONFIGURED', 'Photo try-on is not connected yet. Add your OpenAI key to .env.local, then retry.');
  const started = Date.now();
  let response: Response;
  try {
    response = await (options.fetcher || fetch)('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${options.apiKey}`, 'Content-Type': 'application/json' },
      signal: options.signal || AbortSignal.timeout(90_000),
      body: JSON.stringify({
        model: options.model, images: [{ image_url: personImage }, { image_url: garmentImage }],
        prompt: tryOnPrompt(options.garmentType), n: 1, size: '1024x1536', quality: 'medium', output_format: options.outputFormat || 'png',
      }),
    });
  } catch (error) {
    if (options.signal?.aborted || (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name))) {
      throw new TryOnError(504, 'TIMEOUT', 'The preview took too long. Your pattern and photo are still here. Please try again.');
    }
    throw new TryOnError(502, 'NETWORK_ERROR', 'Could not reach OpenAI. Check your connection and try again.');
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const code = data?.error?.code;
    if (response.status === 401) throw new TryOnError(503, 'API_KEY_INVALID', 'The OpenAI API key was not accepted. Check the key in .env.local.');
    if (response.status === 403) throw new TryOnError(503, 'MODEL_ACCESS', 'This OpenAI project cannot use the selected image model. Check model access or organization verification.');
    if (response.status === 429) throw new TryOnError(429, 'PROVIDER_LIMIT', 'OpenAI has reached a usage, credit, or rate limit. Check the project billing and try again later.');
    if (code === 'moderation_blocked' || code === 'content_policy_violation') throw new TryOnError(422, 'IMAGE_NOT_ACCEPTED', 'This image could not be processed. Try a different clear, fully clothed photo.');
    throw new TryOnError(502, 'PROVIDER_ERROR', 'OpenAI could not generate this preview. Please try again or choose a different photo.');
  }
  const b64 = data?.data?.[0]?.b64_json;
  if (typeof b64 !== 'string' || !b64.length) throw new TryOnError(502, 'EMPTY_RESULT', 'No image was returned. Your design is saved in this session; please retry.');
  return { image: `data:image/${options.outputFormat || 'png'};base64,${b64}`, model: options.model, durationMs: Date.now() - started };
}
