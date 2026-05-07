// Generates the PWA icon set from public/logo-origin.PNG (1080×1080 master).
// Run with: node scripts/generate-pwa-icons.cjs
//
// Output:
//   public/icons/icon-192.png       — referenced by manifest.json (small)
//   public/icons/icon-512.png       — referenced by manifest.json (large)
//   public/apple-touch-icon.png     — iOS Safari uses this when added to home screen
//
// The source PNG already has ~12% padding around the badge — that gives us a
// natural "safe zone" so the icons render correctly when modern Android
// aggressively crops them into circles/squircles (`purpose: "maskable any"`
// in manifest.json declares this support).

const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'public', 'logo-origin.PNG');
const ICONS_DIR = path.join(ROOT, 'public', 'icons');

const TARGETS = [
  { size: 192, out: path.join(ICONS_DIR, 'icon-192.png') },
  { size: 512, out: path.join(ICONS_DIR, 'icon-512.png') },
  { size: 180, out: path.join(ROOT, 'public', 'apple-touch-icon.png') },
];

(async () => {
  if (!fs.existsSync(SRC)) throw new Error(`Missing source: ${SRC}`);
  fs.mkdirSync(ICONS_DIR, { recursive: true });

  const results = [];
  for (const { size, out } of TARGETS) {
    // Background: white. iOS doesn't support transparent apple-touch-icons
    // (renders black behind PNG transparency on the home screen). Standard
    // PWA icons also benefit from a solid background for OS-mask consistency.
    await sharp(SRC)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .png({ compressionLevel: 9 })
      .toFile(out);
    const meta = await sharp(out).metadata();
    results.push({ out: path.relative(ROOT, out), w: meta.width, h: meta.height, bytes: fs.statSync(out).size });
  }
  console.log(JSON.stringify({ generated: results }, null, 2));
})().catch((e) => { console.error(e); process.exit(1); });
