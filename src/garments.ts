export type GarmentType = 'shirt' | 'blouse' | 'sarong' | 'kebaya' | 'tunic' | 'gown' | 'dress' | 'maxi' | 'blazer' | 'skirt' | 'palazzo' | 'jacket' | 'kids-shirt' | 'kids-dress' | 'romper';
export type GarmentGroup = 'traditional' | 'everyday' | 'kids';
export type Sleeve = 'short' | 'long' | 'sleeveless';
export type Collar = 'classic' | 'mandarin' | 'round';
type Garment = {
  value: GarmentType; label: string; hint: string; group: GarmentGroup;
  region: 'upper' | 'lower' | 'full'; sleeves: readonly Sleeve[]; collars: readonly Collar[];
  sleeve: Sleeve; collar: Collar; fit: 'regular' | 'relaxed';
};
export const GARMENT_GROUPS = [
  { value: 'traditional', label: 'Traditional & formal' },
  { value: 'everyday', label: 'Everyday' },
  { value: 'kids', label: 'Kids' },
] as const;
export const GARMENTS: readonly Garment[] = [
  { value:'sarong', label:'Sarong / kain', hint:'Wrapped cloth with an overlap', group:'traditional', region:'lower', sleeves:[], collars:[], sleeve:'sleeveless', collar:'round', fit:'regular' },
  { value:'kebaya', label:'Kebaya-inspired blouse', hint:'Lined, fitted and long-sleeved', group:'traditional', region:'upper', sleeves:['long'], collars:[], sleeve:'long', collar:'round', fit:'regular' },
  { value:'tunic', label:'Baju / tunic', hint:'A longer, easy silhouette', group:'traditional', region:'upper', sleeves:['short','long','sleeveless'], collars:['mandarin','round'], sleeve:'long', collar:'mandarin', fit:'relaxed' },
  { value:'gown', label:'Formal gown', hint:'A shaped waist and floor-length skirt', group:'traditional', region:'full', sleeves:['short','long','sleeveless'], collars:['round'], sleeve:'sleeveless', collar:'round', fit:'regular' },
  { value:'blazer', label:'Tailored blazer', hint:'Lapel collar and tailored jacket', group:'traditional', region:'upper', sleeves:['long'], collars:[], sleeve:'long', collar:'classic', fit:'regular' },
  { value:'shirt', label:'Office / dress shirt', hint:'Button front and classic collar', group:'everyday', region:'upper', sleeves:['short','long','sleeveless'], collars:['classic','mandarin','round'], sleeve:'short', collar:'classic', fit:'regular' },
  { value:'blouse', label:'Blouse / top', hint:'A gently shaped everyday top', group:'everyday', region:'upper', sleeves:['short','long','sleeveless'], collars:['round','mandarin','classic'], sleeve:'short', collar:'round', fit:'regular' },
  { value:'dress', label:'A-line dress', hint:'A flared, knee-length skirt', group:'everyday', region:'full', sleeves:['short','long','sleeveless'], collars:['round','mandarin'], sleeve:'short', collar:'round', fit:'regular' },
  { value:'maxi', label:'Maxi dress', hint:'Long, flowing and relaxed', group:'everyday', region:'full', sleeves:['short','long','sleeveless'], collars:['round'], sleeve:'sleeveless', collar:'round', fit:'relaxed' },
  { value:'skirt', label:'Midi skirt', hint:'A flowing, flared separate', group:'everyday', region:'lower', sleeves:[], collars:[], sleeve:'sleeveless', collar:'round', fit:'regular' },
  { value:'palazzo', label:'Palazzo pants', hint:'Wide legs and a comfortable waist', group:'everyday', region:'lower', sleeves:[], collars:[], sleeve:'sleeveless', collar:'round', fit:'relaxed' },
  { value:'jacket', label:'Bomber jacket', hint:'Zip front with ribbed cuffs', group:'everyday', region:'upper', sleeves:['long'], collars:[], sleeve:'long', collar:'mandarin', fit:'relaxed' },
  { value:'kids-shirt', label:'Kids’ shirt', hint:'An easy, short-sleeved shirt', group:'kids', region:'upper', sleeves:['short','long'], collars:['classic','round'], sleeve:'short', collar:'classic', fit:'relaxed' },
  { value:'kids-dress', label:'Kids’ dress', hint:'A simple, flared day dress', group:'kids', region:'full', sleeves:['short','sleeveless'], collars:['round'], sleeve:'short', collar:'round', fit:'relaxed' },
  { value:'romper', label:'Kids’ romper', hint:'One piece with short legs', group:'kids', region:'full', sleeves:['short','sleeveless'], collars:['round'], sleeve:'short', collar:'round', fit:'relaxed' },
];
export const garmentInfo = (value: GarmentType) => GARMENTS.find(g => g.value === value)!;
export const isGarmentType = (value: unknown): value is GarmentType => GARMENTS.some(g => g.value === value);
export function garmentDefaults(garment: GarmentType) {
  const { sleeve, collar, fit } = garmentInfo(garment);
  return { garment, sleeve, collar, fit };
}
export const supportsSample = (garment: GarmentType) => garmentInfo(garment).region === 'upper' && garmentInfo(garment).group !== 'kids';
