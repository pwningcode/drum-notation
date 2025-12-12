import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Standard padding percentage (15% is common for app icons)
const PADDING_PERCENT = 0.15;

// Icon sizes needed
const ANDROID_SIZES = [48, 72, 96, 144, 192, 512];
const APPLE_SIZES = [57, 60, 72, 76, 114, 120, 144, 152, 180];
const FAVICON_SIZES = [16, 32, 96];
const MS_SIZES = [70, 144, 150, 310];

async function generateIconWithPadding(inputPath, outputPath, size) {
  // Calculate the content size (with padding)
  const contentSize = Math.round(size * (1 - 2 * PADDING_PERCENT));
  const padding = Math.round(size * PADDING_PERCENT);
  
  // Read the source image
  const sourceImage = sharp(inputPath);
  const metadata = await sourceImage.metadata();
  
  // Resize the content to fit within the padded area
  const resized = sourceImage
    .resize(contentSize, contentSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
    });
  
  // Create a new image with the target size and transparent background
  const padded = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([
      {
        input: await resized.toBuffer(),
        left: padding,
        top: padding
      }
    ]);
  
  await padded.png().toFile(outputPath);
  console.log(`Generated ${outputPath} (${size}x${size})`);
}

async function findSourceIcon() {
  const publicDir = join(__dirname, '..', 'public');
  const files = await readdir(publicDir);
  
  // Look for the largest existing icon as source
  const candidates = [
    'android-icon-192x192.png',
    'apple-icon-180x180.png',
    'android-icon-144x144.png'
  ];
  
  for (const candidate of candidates) {
    if (files.includes(candidate)) {
      return join(publicDir, candidate);
    }
  }
  
  throw new Error('Could not find a source icon file');
}

async function main() {
  const sourceIcon = await findSourceIcon();
  const publicDir = join(__dirname, '..', 'public');
  
  console.log(`Using source icon: ${sourceIcon}`);
  console.log(`Generating icons with ${(PADDING_PERCENT * 100).toFixed(0)}% padding...\n`);
  
  // Generate Android icons
  console.log('Generating Android icons...');
  for (const size of ANDROID_SIZES) {
    await generateIconWithPadding(
      sourceIcon,
      join(publicDir, `android-icon-${size}x${size}.png`),
      size
    );
  }
  
  // Generate Apple icons
  console.log('\nGenerating Apple icons...');
  for (const size of APPLE_SIZES) {
    await generateIconWithPadding(
      sourceIcon,
      join(publicDir, `apple-icon-${size}x${size}.png`),
      size
    );
  }
  
  // Generate default Apple icons
  await generateIconWithPadding(
    sourceIcon,
    join(publicDir, 'apple-icon.png'),
    180
  );
  await generateIconWithPadding(
    sourceIcon,
    join(publicDir, 'apple-icon-precomposed.png'),
    180
  );
  
  // Generate favicons
  console.log('\nGenerating favicons...');
  for (const size of FAVICON_SIZES) {
    await generateIconWithPadding(
      sourceIcon,
      join(publicDir, `favicon-${size}x${size}.png`),
      size
    );
  }
  
  // Generate Microsoft icons
  console.log('\nGenerating Microsoft icons...');
  for (const size of MS_SIZES) {
    await generateIconWithPadding(
      sourceIcon,
      join(publicDir, `ms-icon-${size}x${size}.png`),
      size
    );
  }
  
  console.log('\n✅ All icons generated successfully!');
  console.log('\nNext steps:');
  console.log('1. Update site.webmanifest to include the 512x512 icon');
  console.log('2. Test the icons on your mobile device');
}

main().catch(console.error);
