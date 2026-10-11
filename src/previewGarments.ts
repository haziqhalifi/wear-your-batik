import { GARMENTS, type GarmentType } from './garments';
export const PREVIEW_GARMENTS: readonly GarmentType[] = GARMENTS.map(garment => garment.value);
export const supports3D = (garment: GarmentType) => PREVIEW_GARMENTS.includes(garment);
