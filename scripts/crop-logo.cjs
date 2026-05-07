// One-shot helper: crops the transparent margin off public/logo-origin.PNG and
// writes a tight version to public/logo.png. Run with `node scripts/crop-logo.cjs`.
// Safe to delete after running — the output PNG is the source of truth.
const path = require('path');
const sharp = require('sharp');

const SRC = path.join(__dirname, '..', 'public', 'logo-origin.PNG');
const OUT = path.join(__dirname, '..', 'public', 'logo.png');

(async () => {
  const meta = await sharp(SRC).metadata();
  const trimmed = sharp(SRC).trim({ threshold: 1 });
  const trimmedMeta = await trimmed.clone().toBuffer({ resolveWithObject: true });
  await trimmed.png({ compressionLevel: 9 }).toFile(OUT);
  const finalMeta = await sharp(OUT).metadata();
  console.log(JSON.stringify({
    source: { w: meta.width, h: meta.height, ratio: (meta.width / meta.height).toFixed(3) },
    trimmedInfo: { w: trimmedMeta.info.width, h: trimmedMeta.info.height, trimOffsetTop: trimmedMeta.info.trimOffsetTop, trimOffsetLeft: trimmedMeta.info.trimOffsetLeft },
    output: { path: OUT, w: finalMeta.width, h: finalMeta.height, ratio: (finalMeta.width / finalMeta.height).toFixed(3) },
  }, null, 2));
})().catch((e) => { console.error(e); process.exit(1); });
