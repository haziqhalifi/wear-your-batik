import type { GarmentType } from './garments';
export const PREVIEW_GARMENTS = ['shirt', 'dress', 'sarong'] as const;
export const supports3D = (garment: GarmentType) => (PREVIEW_GARMENTS as readonly string[]).includes(garment);
