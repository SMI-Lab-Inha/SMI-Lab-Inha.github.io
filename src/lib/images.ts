import type { ImageMetadata } from 'astro';

const imageModules = import.meta.glob<ImageMetadata>(
  '../assets/images/**/*.{avif,jpeg,jpg,png,webp}',
  { eager: true, import: 'default' },
);

export function resolveImage(publicPath: string) {
  const key = publicPath.replace(/^\/images\//, '../assets/images/');
  const image = imageModules[key];
  if (!image) throw new Error(`No source image found for ${publicPath} (expected ${key})`);
  return image;
}
