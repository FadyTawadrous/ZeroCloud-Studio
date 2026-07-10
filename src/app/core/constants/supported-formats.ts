// Central place to declare which conversions your ffmpeg core build actually
// supports. Extend this as you add more formats/tools (audio, image, pdf...).
export const SUPPORTED_CONVERSIONS: Record<string, string[]> = {
  MP4: ['MP3', 'WEBM', 'MOV', 'GIF'],
  MOV: ['MP4', 'WEBM', 'MP3'],
  WEBM: ['MP4', 'MP3'],
  MKV: ['MP4', 'MP3'],
  MP3: ['WAV', 'OGG', 'AAC', 'FLAC'],
  WAV: ['MP3', 'OGG', 'AAC', 'FLAC'],
  OGG: ['MP3', 'WAV'],
  FLAC: ['MP3', 'WAV'],
  PNG: ['JPG', 'WEBP', 'GIF'],
  JPG: ['PNG', 'WEBP'],
  JPEG: ['PNG', 'WEBP'],
  WEBP: ['PNG', 'JPG'],
};

export function isConversionSupported(from: string, to: string): boolean {
  const targets = SUPPORTED_CONVERSIONS[from.toUpperCase()];
  return !!targets && targets.includes(to.toUpperCase());
}

// Maps a format to a reasonable <input accept> value so the file picker
// only shows relevant files. Extend alongside SUPPORTED_CONVERSIONS.
const ACCEPT_MAP: Record<string, string> = {
  MP4: 'video/mp4',
  MOV: 'video/quicktime',
  WEBM: 'video/webm',
  MKV: 'video/x-matroska',
  MP3: 'audio/mpeg',
  WAV: 'audio/wav',
  OGG: 'audio/ogg',
  FLAC: 'audio/flac',
  PNG: 'image/png',
  JPG: 'image/jpeg',
  JPEG: 'image/jpeg',
  WEBP: 'image/webp',
};

export function acceptFor(format: string): string {
  return ACCEPT_MAP[format.toUpperCase()] ?? '*/*';
}