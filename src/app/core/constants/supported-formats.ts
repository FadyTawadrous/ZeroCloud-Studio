// Core conversion matrix for Version 1 (Pure WebCodecs + WebAssembly)
// Legacy formats (WMA, WMV, FLV, AVI) are intentionally excluded for V1 
// to maintain a lightweight, high-performance architecture.

// --- STRICT TYPES FOR INTERFACES ---
export type SupportedVideoFormat = 'MP4' | 'WEBM' | 'MOV' | 'MKV' | 'AV1';
export type SupportedAudioFormat = 'MP3' | 'WAV' | 'OGG' | 'FLAC' | 'AAC' | 'OPUS';
export type SupportedImageFormat = 'PNG' | 'JPG' | 'JPEG' | 'WEBP' | 'AVIF' | 'ICO' | 'BMP' | 'TGA' | 'TIFF' | 'TIF' | 'SVG';

// Extract subsets for output interfaces (since some formats are input-only)
export type ImageOutputFormat = 'PNG' | 'JPG' | 'JPEG' | 'WEBP' | 'AVIF' | 'ICO';
export type AudioOutputFormat = 'MP3' | 'WAV' | 'OGG' | 'FLAC' | 'AAC' | 'OPUS';
export type VideoOutputFormat = 'MP4' | 'WEBM' | 'MOV';

export const SUPPORTED_CONVERSIONS: Record<string, string[]> = {
  // --- VIDEO (Powered by Mediabunny) ---
  MP4: ['WEBM', 'MOV', 'MP3', 'WAV'], // Video to Video / Video to Audio
  WEBM: ['MP4', 'MOV', 'MP3', 'WAV'],
  MOV: ['MP4', 'WEBM', 'MP3', 'WAV'],
  MKV: ['MP4', 'WEBM', 'MOV', 'MP3', 'WAV'], // MKV is heavy, often input-only, but transcodable
  AV1:  ['MP4', 'WEBM', 'MOV', 'MP3', 'WAV'],

  // --- AUDIO (Powered by Mediabunny) ---
  MP3: ['WAV', 'OGG', 'FLAC', 'AAC', 'OPUS'],
  WAV: ['MP3', 'OGG', 'FLAC', 'AAC', 'OPUS'],
  OGG: ['MP3', 'WAV', 'FLAC', 'AAC', 'OPUS'],
  FLAC: ['MP3', 'WAV', 'OGG', 'AAC', 'OPUS'],
  AAC: ['MP3', 'WAV', 'OGG', 'FLAC', 'OPUS'],
  OPUS: ['MP3', 'WAV', 'OGG', 'FLAC', 'AAC'],

  // --- IMAGES (Powered by Photon + OffscreenCanvas) ---
  PNG: ['JPG', 'WEBP', 'AVIF', 'ICO'],
  JPG: ['PNG', 'WEBP', 'AVIF', 'ICO'],
  JPEG: ['PNG', 'WEBP', 'AVIF', 'ICO'],
  WEBP: ['PNG', 'JPG', 'AVIF', 'ICO'],
  AVIF: ['PNG', 'JPG', 'WEBP', 'ICO'],
  ICO: ['PNG', 'JPG', 'WEBP', 'AVIF'],
  SVG: ['PNG', 'JPG', 'WEBP', 'AVIF', 'ICO'],

  // Input-only image formats (uncompressed/legacy)
  BMP:  ['PNG', 'JPG', 'WEBP', 'AVIF', 'ICO'],
  TGA:  ['PNG', 'JPG', 'WEBP', 'AVIF', 'ICO'],
  TIFF: ['PNG', 'JPG', 'WEBP', 'AVIF', 'ICO'],
  TIF:  ['PNG', 'JPG', 'WEBP', 'AVIF', 'ICO'],
};

export function isConversionSupported(from: string, to: string): boolean {
  const targets = SUPPORTED_CONVERSIONS[from.toUpperCase()];
  return !!targets && targets.includes(to.toUpperCase());
}

// Maps a format to a strict <input accept> value so the browser's 
// native file picker only shows files our pipeline can actually process.
const ACCEPT_MAP: Record<string, string> = {
  // Video
  MP4: 'video/mp4',
  MOV: 'video/quicktime',
  WEBM: 'video/webm',
  MKV: 'video/x-matroska',
  AV1: 'video/av1',
  
  // Audio
  MP3: 'audio/mpeg',
  WAV: 'audio/wav',
  OGG: 'audio/ogg',
  FLAC: 'audio/flac',
  AAC: 'audio/aac',
  OPUS: 'audio/opus',

  // Images
  PNG: 'image/png',
  JPG: 'image/jpeg',
  JPEG: 'image/jpeg',
  WEBP: 'image/webp',
  AVIF: 'image/avif',
  ICO: 'image/x-icon',
  BMP:  'image/bmp',
  TGA:  'image/x-tga',
  TIFF: 'image/tiff',
  TIF:  'image/tiff',
  SVG:  'image/svg+xml'
};

export function acceptFor(format: string): string {
  return ACCEPT_MAP[format.toUpperCase()] ?? '*/*';
}