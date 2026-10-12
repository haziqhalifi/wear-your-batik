export type StudioIconName = 'pen' | 'wax' | 'dots' | 'stamp' | 'move' | 'mirror-x' | 'mirror-y' | 'erase' | 'undo' | 'redo' | 'back' | 'restart' | 'clear' | 'eye' | 'eye-off' | 'settings';

const paths: Record<StudioIconName, React.ReactNode> = {
  pen: <><path d="m16 3 5 5-12 12-6 1 1-6Z"/><path d="m14 5 5 5M4 15l5 5"/></>,
  wax: <><path d="M3 17c4-12 6 12 10 0s6 0 8-8"/><path d="m3 5 2-2 2 2M5 3v6"/></>,
  dots: <>{[[6,6],[18,6],[12,12],[6,18],[18,18]].map(([cx,cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.7" fill="currentColor" stroke="none"/>)}</>,
  stamp: <><path d="M8 14v-3c0-2 2-3 2-5a2 2 0 0 1 4 0c0 2 2 3 2 5v3M5 14h14v4H5zM4 21h16"/></>,
  move: <><path d="M12 3v18M3 12h18m-12-6 3-3 3 3m-6 12 3 3 3-3M6 9l-3 3 3 3m12-6 3 3-3 3"/></>,
  'mirror-x': <><path d="M12 3v18M3 6l6 6-6 6Zm18 0-6 6 6 6Z"/></>,
  'mirror-y': <><path d="M3 12h18M6 3l6 6 6-6Zm0 18 6-6 6 6Z"/></>,
  erase: <><path d="m14 3 7 7-10 10H6l-4-4Z"/><path d="m8 10 7 7M11 20h10"/></>,
  undo: <><path d="m8 4-5 5 5 5"/><path d="M3 9h11a7 7 0 0 1 0 14"/></>,
  redo: <><path d="m16 4 5 5-5 5"/><path d="M21 9H10a7 7 0 0 0 0 14"/></>,
  back: <><path d="m11 4-8 8 8 8M3 12h18"/></>,
  restart: <><path d="M3 10a9 9 0 1 1 2 8M3 3v7h7"/></>,
  clear: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></>,
  eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
  'eye-off': <><path d="m3 3 18 18M10 5h2c6 0 10 7 10 7a21 21 0 0 1-3 4M6 6a22 22 0 0 0-4 6s4 7 10 7c2 0 4-1 5-2M10 10a3 3 0 0 0 4 4"/></>,
  settings: <><path d="M4 6h16M4 12h16M4 18h16"/><path d="M8 3v6M16 9v6M10 15v6"/></>,
};

export default function StudioIcon({ name }: { name: StudioIconName }) {
  return <svg className="studio-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
