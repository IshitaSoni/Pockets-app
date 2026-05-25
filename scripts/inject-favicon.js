/* Post-build: replace the Expo-injected favicon link with our SVG + ICO fallback. */
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'dist', 'index.html');

if (!fs.existsSync(htmlPath)) {
  console.error('inject-favicon: dist/index.html not found, skipping.');
  process.exit(0);
}

const original = fs.readFileSync(htmlPath, 'utf8');
const replacement =
  '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />' +
  '<link rel="alternate icon" href="/favicon.ico" />';

const updated = original.replace(
  /<link rel="icon" href="\/favicon\.ico" \/>/,
  replacement
);

if (updated === original) {
  console.error('inject-favicon: expected <link rel="icon"> not found in dist/index.html.');
  process.exit(1);
}

fs.writeFileSync(htmlPath, updated);
console.log('inject-favicon: injected SVG favicon link.');
