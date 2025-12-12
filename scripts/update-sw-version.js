import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Generate a version based on timestamp (format: vYYYYMMDDHHmmss)
const now = new Date();
const version = `v${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

const swPath = join(__dirname, '..', 'public', 'sw.js');
let swContent = readFileSync(swPath, 'utf-8');

// Update the CACHE_VERSION
swContent = swContent.replace(
  /const CACHE_VERSION = ['"](.*?)['"];/,
  `const CACHE_VERSION = '${version}';`
);

writeFileSync(swPath, swContent, 'utf-8');
console.log(`✅ Updated service worker cache version to: ${version}`);
