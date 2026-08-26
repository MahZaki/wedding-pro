/**
 * VOWLY logo system generator — single source of truth.
 * Construction spec: branding PRD §3
 *   viewBox 100x100 · dot Ø14 (r7) · dot gap 38 (cx 31/69)
 *   body width 72 (x 14..86) · soft curved arms · sharp lower point
 * Outputs the full asset tree from PRD §19 + app icons + favicon PNGs.
 */
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";

const BORDEAUX = "#6E2F3A";
const IVORY = "#FAF8F5";
const INK = "#1C1B1A";

/* ── The Vow symbol ─────────────────────────────────────────── */

// Filled ribbon arms (print/static quality) — each tapers to the single
// convergence point (50, 94) so the tip stays clean (no overlap notch).
function symbolGroup(color) {
  return `<g fill="${color}">
    <path d="M13.5 26 C20 50, 34 76, 50 94 C39.5 74, 30.2 48, 28.5 26 Z"/>
    <path d="M86.5 26 C80 50, 66 76, 50 94 C60.5 74, 69.8 48, 71.5 26 Z"/>
    <circle cx="31" cy="15" r="7"/>
    <circle cx="69" cy="15" r="7"/>
  </g>`;
}

// Open stroked arms (for the draw-in animation in React)
function symbolStrokes(color, width = 13) {
  return `<g stroke="${color}" stroke-width="${width}" fill="none" stroke-linecap="round">
    <path class="vowly-arm vowly-arm-l" d="M16 28 C22 48, 35 73, 50 91"/>
    <path class="vowly-arm vowly-arm-r" d="M84 28 C78 48, 65 73, 50 91"/>
    <circle class="vowly-dot vowly-dot-l" cx="31" cy="15" r="7" fill="${color}" stroke="none"/>
    <circle class="vowly-dot vowly-dot-r" cx="69" cy="15" r="7" fill="${color}" stroke="none"/>
  </g>`;
}

function symbolSvg(color, size = 100) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">${symbolGroup(color)}</svg>`;
}

/* Simplified favicon mark: thicker forms survive 16px (PRD §12) */
const FAVICON_MARK = `<g fill="${IVORY}">
  <path d="M11 24 C18.5 48, 33.5 75, 50 93 C40 73, 31 46, 28.5 24 Z"/>
  <path d="M89 24 C81.5 48, 66.5 75, 50 93 C60 73, 69 46, 71.5 24 Z"/>
  <circle cx="31" cy="14" r="8"/>
  <circle cx="69" cy="14" r="8"/>
</g>`;

const WORDMARK = (fill, x = 0, y = 0, size = 44) =>
  `<text x="${x}" y="${y}" font-family="Georgia, 'Times New Roman', serif" font-size="${size}" font-weight="700" letter-spacing="-1" fill="${fill}">vowly</text>`;

/* Horizontal lockup: symbol + wordmark on one line (PRD §6) */
function horizontalSvg(symbolColor, wordColor, { bg = null, w = 340, h = 100 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  ${bg ? `<rect width="${w}" height="${h}" fill="${bg}"/>` : ""}
  <g transform="translate(10 4) scale(0.92)">${symbolGroup(symbolColor)}</g>
  ${WORDMARK(wordColor, 112, 64)}
</svg>`;
}

/* Stacked lockup: symbol above centered wordmark (PRD §9) */
function stackedSvg(symbolColor, wordColor, w = 220, h = 260) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <g transform="translate(${w / 2 - 45} 18) scale(0.9)">${symbolGroup(symbolColor)}</g>
  <text x="${w / 2}" y="${h - 38}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="46" font-weight="700" letter-spacing="-1" fill="${wordColor}">vowly</text>
</svg>`;
}

/* ── Emit SVG tree (PRD §19) ────────────────────────────────── */

const files = new Map();

files.set("01_PRIMARY/vowly-horizontal.svg", horizontalSvg(BORDEAUX, INK));
files.set("01_PRIMARY/vowly-horizontal-dark.svg", horizontalSvg(IVORY, IVORY));
files.set("02_WORDMARK/vowly-wordmark.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" width="190" height="70" viewBox="0 0 190 70">${WORDMARK(INK, 8, 52)}</svg>`);
files.set("02_WORDMARK/vowly-wordmark-light.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" width="190" height="70" viewBox="0 0 190 70">${WORDMARK(IVORY, 8, 52)}</svg>`);
files.set("02_WORDMARK/vowly-wordmark-bordeaux.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" width="190" height="70" viewBox="0 0 190 70">${WORDMARK(BORDEAUX, 8, 52)}</svg>`);
files.set("03_SYMBOL/vowly-symbol.svg", symbolSvg(BORDEAUX));
files.set("03_SYMBOL/vowly-symbol-ink.svg", symbolSvg(INK));
files.set("03_SYMBOL/vowly-symbol-ivory.svg", symbolSvg(IVORY));
files.set("03_SYMBOL/vowly-symbol-bordeaux.svg", symbolSvg(BORDEAUX));
files.set("05_FAVICON/favicon.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 100 100"><rect width="100" height="100" rx="23" fill="${BORDEAUX}"/>${FAVICON_MARK}</svg>`);

/* App icon artwork: ivory symbol on bordeaux, ~23% corner radius (PRD §11) */
const appIconSvg = (rounded = false) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 100 100">${rounded ? `<rect width="100" height="100" rx="23" fill="${BORDEAUX}"/>` : `<rect width="100" height="100" fill="${BORDEAUX}"/>`}${FAVICON_MARK}</svg>`;

await mkdir("public/brand/01_PRIMARY", { recursive: true });
await mkdir("public/brand/02_WORDMARK", { recursive: true });
await mkdir("public/brand/03_SYMBOL", { recursive: true });
await mkdir("public/brand/04_APP_ICON", { recursive: true });
await mkdir("public/brand/05_FAVICON", { recursive: true });

for (const [path, svg] of files) {
  await writeFile(`public/brand/${path}`, svg);
}
console.log(`✓ wrote ${files.size} brand SVGs`);

/* Stacked for campaigns */
await mkdir("public/brand/09_EXTRAS", { recursive: true });
await writeFile("public/brand/09_EXTRAS/vowly-stacked.svg", stackedSvg(BORDEAUX, INK));
await mkdir("public/icons", { recursive: true });

/* ── Rasterize app icons + favicons ─────────────────────────── */

const iconSquare = Buffer.from(appIconSvg(false)); // full-bleed; OS applies mask
const iconRounded = Buffer.from(appIconSvg(true));

const pngJobs = [
  [iconSquare, 1024, "public/brand/04_APP_ICON/icon-1024.png"],
  [iconSquare, 512, "public/brand/04_APP_ICON/icon-512.png"],
  [iconSquare, 180, "public/brand/04_APP_ICON/icon-180.png"],
  [iconSquare, 32, "public/brand/04_APP_ICON/icon-32.png"],
  // Next.js file conventions
  [iconSquare, 1024, "src/app/icon.png"],
  [iconSquare, 180, "src/app/apple-icon.png"],
  // PWA manifest
  [iconSquare, 192, "public/icons/icon-192.png"],
  [iconSquare, 512, "public/icons/icon-512.png"],
  // Classic favicons (rounded tile reads better at tab size)
  [iconRounded, 32, "public/brand/05_FAVICON/favicon-32.png"],
  [iconRounded, 16, "public/brand/05_FAVICON/favicon-16.png"],
];

for (const [input, size, out] of pngJobs) {
  await sharp(input).resize(size, size).png().toFile(out);
  console.log(`✓ ${out}`);
}

console.log("\nBrand assets generated.");
