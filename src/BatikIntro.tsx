import { useEffect, useState, type CSSProperties } from 'react';
import { DEFAULT_DESIGN, MOTIFS, PALETTES, fabricSvg, motifArtwork, svgUrl, type Design } from './patterns';

const collection = MOTIFS.map((motif, index) => {
  const design: Design = { ...DEFAULT_DESIGN, ...PALETTES[index], motif: motif.value, rotation: 0, scale: 1.35 };
  return { ...motif, design, fabric: svgUrl(fabricSvg(design)), artwork: motifArtwork(motif.value, design).replaceAll('<path ', '<path pathLength="1" ') };
});

export default function BatikIntro({ onStart, onChoose }: { onStart: () => void; onChoose: (design: Design) => void }) {
  const [active, setActive] = useState(0);
  const [replay, setReplay] = useState(0);
  const selected = collection[active];
  useEffect(() => {
    const timer = window.setInterval(() => setActive(index => (index + 1) % collection.length), 8500);
    return () => window.clearInterval(timer);
  }, [active, replay]);
  function choose(index: number) { setActive(index); setReplay(value => value + 1); }
  return <div className="batik-intro" style={{ '--textile': selected.design.background } as CSSProperties}>
    <header className="intro-header">
      <a className="intro-brand" href="#" aria-label="Wear Your Batik home"><svg viewBox="0 0 100 110" aria-hidden="true" dangerouslySetInnerHTML={{ __html: collection[0].artwork }}/><span>Wear Your Batik<small>A digital batik atelier</small></span></a>
      <a className="intro-explore" href="#batik-collection">Collection <span aria-hidden="true">↙</span></a>
    </header>
    <section className="intro-stage" aria-labelledby="intro-title">
      <div className="intro-art" key={`${active}-${replay}`} aria-hidden="true">
        <div className="intro-fabric" style={{ backgroundImage: `url("${selected.fabric}")` }}/>
        <svg className="intro-botanical botanical-main" viewBox="-12 -12 128 130" dangerouslySetInnerHTML={{ __html: selected.artwork }}/>
        <svg className="intro-botanical botanical-echo" viewBox="-12 -12 128 130" dangerouslySetInnerHTML={{ __html: selected.artwork }}/>
        <span className="intro-orbit orbit-one"/><span className="intro-orbit orbit-two"/>
      </div>
      <div className="intro-copy-block">
        <p className="intro-invitation"><span/> Rooted in culture. Reimagined by you.</p>
        <h1 id="intro-title">A living art.<br/>An unfolding<br/>story.</h1>
        <p className="intro-description">Design your cloth. Wear your story.</p>
        <div className="intro-actions"><button className="intro-primary" onClick={onStart}>Create my batik <span aria-hidden="true">↗</span></button></div>
      </div>
      <div className="intro-art-caption"><span className="intro-caption-mark" aria-hidden="true">✳</span><div><span>On the cloth</span><strong>{selected.label}</strong></div></div>
    </section>
    <section id="batik-collection" className="intro-collection" aria-labelledby="collection-title">
      <div className="intro-collection-heading"><div><h2 id="collection-title">One cloth. Endless expressions.</h2></div><button className="intro-use" onClick={() => onChoose(selected.design)}>Create with {selected.label} <span aria-hidden="true">↗</span></button></div>
      <div className="intro-swatches" role="group" aria-label="Explore all six batik motifs">{collection.map((item, index) => <button className="intro-swatch" key={item.value} aria-pressed={index === active} onClick={() => choose(index)}><div className="intro-swatch-image" style={{ backgroundImage: `url("${item.fabric}")` }}><span aria-hidden="true">{index === active ? '✓' : '↗'}</span></div><span className="intro-swatch-label">{item.label}<small>{PALETTES[index].name}</small></span><span className="intro-swatch-progress" key={`${index}-${active}-${replay}`}/></button>)}</div>
    </section>
    <footer className="intro-footer"><p>A celebration of batik, open to everyone.</p><details><summary>About our inspiration</summary><p>These original digital motifs draw inspiration from batik’s botanical forms and wax-like outlines. They are not reproductions of a particular artisan’s cloth.</p><nav aria-label="Explore batik heritage"><a href="https://www.mkn.gov.my/web/ms/2024/01/25/martabatkan-penggunaan-batik-dikalangan-penjawat-awam/" target="_blank" rel="noreferrer">Malaysian batik</a><a href="https://www.nhb.gov.sg/acm/whats-on/exhibitions/batik-kita" target="_blank" rel="noreferrer">Batik in Singapore</a><a href="https://ich.unesco.org/en/RL/indonesian-batik-00170" target="_blank" rel="noreferrer">Indonesian batik</a></nav></details></footer>
  </div>;
}
