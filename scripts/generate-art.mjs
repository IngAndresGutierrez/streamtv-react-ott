#!/usr/bin/env node
/**
 * Generates original, license-free SVG artwork (posters 2:3 and backdrops 16:9)
 * for the mock catalog. Output: public/art/<id>-poster.svg, public/art/<id>-backdrop.svg
 *
 * Usage: node scripts/generate-art.mjs
 * The artwork is procedurally generated, so it carries no third-party rights.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'art');

/** id, title shown on the poster, [from, to, accent] colors, motif */
const ART = [
  ['sintel', 'SINTEL', ['#3b0d0c', '#0d1b2a', '#f4a259'], 'mountains'],
  ['big-buck-bunny', 'BIG BUCK BUNNY', ['#1b4332', '#081c15', '#b7e4c7'], 'hills'],
  ['tears-of-steel', 'TEARS OF STEEL', ['#14213d', '#000000', '#4cc9f0'], 'grid'],
  ['dark-truths', 'DARK TRUTHS', ['#240046', '#10002b', '#e0aaff'], 'orbs'],
  ['bbb-dash', 'BUNNY · DASH', ['#03045e', '#000814', '#90e0ef'], 'waves'],
  ['bbb-hls', 'BUNNY · HLS', ['#2d6a4f', '#081c15', '#ffd166'], 'hills'],
  ['tos-hls', 'STEEL · HLS', ['#1d3557', '#0b0c10', '#e63946'], 'grid'],
  ['horizonte-rojo', 'HORIZONTE ROJO', ['#6a040f', '#03071e', '#ffba08'], 'sun'],
  ['ultima-frecuencia', 'LA ÚLTIMA FRECUENCIA', ['#003049', '#000000', '#fcbf49'], 'waves'],
  ['codigo-andino', 'CÓDIGO ANDINO', ['#3a5a40', '#0b1d13', '#dad7cd'], 'mountains'],
  ['mareas-de-neon', 'MAREAS DE NEÓN', ['#7209b7', '#0b0221', '#4cc9f0'], 'orbs'],
  ['expedicion-polar', 'EXPEDICIÓN POLAR', ['#457b9d', '#0a1128', '#f1faee'], 'mountains'],
  ['noches-de-lima', 'NOCHES DE LIMA', ['#9d0208', '#14010a', '#ffd60a'], 'grid'],
  ['archivo-silencioso', 'EL ARCHIVO SILENCIOSO', ['#495057', '#0b0b0b', '#ced4da'], 'orbs'],
  ['orbita-baja', 'ÓRBITA BAJA', ['#023e8a', '#000814', '#ade8f4'], 'sun'],
  ['senal-error', 'SEÑAL DE PRUEBA', ['#370617', '#0b0b0b', '#ff4d6d'], 'grid'],
];

/** Small deterministic PRNG so the art is stable between runs. */
function rng(seed) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function motif(kind, w, h, accent, rand) {
  const parts = [];
  switch (kind) {
    case 'mountains':
      for (let layer = 0; layer < 3; layer++) {
        const base = h * (0.55 + layer * 0.12);
        let d = `M0 ${h} L0 ${base}`;
        for (let x = 0; x <= w; x += w / 6) d += ` L${x} ${base - rand() * h * 0.25}`;
        d += ` L${w} ${h} Z`;
        parts.push(`<path d="${d}" fill="${accent}" opacity="${0.12 + layer * 0.12}"/>`);
      }
      break;
    case 'hills':
      for (let layer = 0; layer < 3; layer++) {
        const y = h * (0.6 + layer * 0.1);
        parts.push(
          `<ellipse cx="${w * rand()}" cy="${y + h * 0.2}" rx="${w * 0.8}" ry="${h * 0.25}" fill="${accent}" opacity="${0.1 + layer * 0.1}"/>`,
        );
      }
      break;
    case 'grid':
      for (let i = 0; i < 14; i++) {
        const x = (w / 14) * i;
        parts.push(`<line x1="${x}" y1="0" x2="${x + w * 0.3}" y2="${h}" stroke="${accent}" stroke-width="2" opacity="0.15"/>`);
      }
      parts.push(`<rect x="${w * 0.1}" y="${h * 0.2}" width="${w * 0.8}" height="${h * 0.02}" fill="${accent}" opacity="0.5"/>`);
      break;
    case 'orbs':
      for (let i = 0; i < 6; i++) {
        parts.push(
          `<circle cx="${w * rand()}" cy="${h * rand() * 0.7}" r="${Math.min(w, h) * (0.05 + rand() * 0.2)}" fill="${accent}" opacity="${0.08 + rand() * 0.2}"/>`,
        );
      }
      break;
    case 'waves':
      for (let i = 0; i < 6; i++) {
        const y = h * (0.35 + i * 0.09);
        parts.push(
          `<path d="M0 ${y} C ${w * 0.25} ${y - 60}, ${w * 0.75} ${y + 60}, ${w} ${y}" stroke="${accent}" stroke-width="${3 + i}" fill="none" opacity="${0.12 + i * 0.06}"/>`,
        );
      }
      break;
    case 'sun':
      parts.push(`<circle cx="${w * 0.5}" cy="${h * 0.42}" r="${Math.min(w, h) * 0.22}" fill="${accent}" opacity="0.55"/>`);
      for (let i = 0; i < 5; i++) {
        const y = h * (0.45 + i * 0.04);
        parts.push(`<rect x="0" y="${y}" width="${w}" height="${h * 0.012}" fill="#000" opacity="0.35"/>`);
      }
      break;
  }
  return parts.join('');
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function svg(id, title, [from, to, accent], kind, w, h, withTitle) {
  const rand = rng(id + w);
  const words = title.split(' ');
  const lines = [];
  for (const word of words) {
    const last = lines[lines.length - 1];
    if (last && (last + ' ' + word).length <= 12) lines[lines.length - 1] = last + ' ' + word;
    else lines.push(word);
  }
  const fontSize = w * 0.11;
  const text = withTitle
    ? lines
        .map(
          (line, i) =>
            `<text x="${w * 0.08}" y="${h * 0.8 + i * fontSize * 1.05 - (lines.length - 1) * fontSize}" font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="${fontSize}" fill="#fff" letter-spacing="1">${escapeXml(line)}</text>`,
        )
        .join('')
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>
<linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.7"/></linearGradient></defs>
<rect width="${w}" height="${h}" fill="url(#g)"/>${motif(kind, w, h, accent, rand)}<rect width="${w}" height="${h}" fill="url(#s)"/>${text}
</svg>`;
}

mkdirSync(OUT, { recursive: true });
for (const [id, title, colors, kind] of ART) {
  writeFileSync(join(OUT, `${id}-poster.svg`), svg(id, title, colors, kind, 400, 600, true));
  writeFileSync(join(OUT, `${id}-backdrop.svg`), svg(id, title, colors, kind, 1920, 1080, false));
}
console.log(`Generated ${ART.length * 2} SVG files in ${OUT}`);
