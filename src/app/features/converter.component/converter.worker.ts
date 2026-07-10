/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const ffmpeg = new FFmpeg();

// Extend this as you add more conversion targets (audio/video/image/pdf).
const MIME_TYPES: Record<string, string> = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  avi: 'video/x-msvideo',
  mkv: 'video/x-matroska',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  aac: 'audio/aac',
  flac: 'audio/flac',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
};

function resolveMimeType(format: string): string {
  return MIME_TYPES[format.toLowerCase()] ?? 'application/octet-stream';
}

// Forward internal engine telemetry to the service instead of just the console,
// so the UI can optionally surface it (e.g. a "show details" panel on error).
ffmpeg.on('log', ({ message }) => {
  postMessage({ type: 'log', value: message });
});

ffmpeg.on('progress', ({ progress }) => {
  postMessage({ type: 'progress', value: Math.round(progress * 100) });
});

addEventListener('message', async ({ data }) => {
  const { file, formatFrom, formatTo } = data;

  // Give each job a unique working name so future batched/queued jobs
  // (once image/PDF tools are added) can't collide on the virtual FS.
  const jobId = crypto.randomUUID();
  const inputName = `${jobId}-input.${formatFrom.toLowerCase()}`;
  const outputName = `${jobId}-output.${formatTo.toLowerCase()}`;

  try {
    if (!ffmpeg.loaded) {
      postMessage({ type: 'status', value: 'Loading Engine...' });

      const baseURL = location.origin;
      console.log('[Worker] Booting Wasm Engine...');

      await ffmpeg.load({
        coreURL: `${baseURL}/ffmpeg-core/ffmpeg-core.js`,
        wasmURL: `${baseURL}/ffmpeg-core/ffmpeg-core.wasm`,
        classWorkerURL: `${baseURL}/ffmpeg-wrapper/worker.js`
      });

      console.log('[Worker] Engine Booted Successfully!');
    }

    postMessage({ type: 'status', value: 'Reading File...' });
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    postMessage({ type: 'status', value: 'Converting...' });
    // 1. Start with the base input arguments
    const execArgs = ['-i', inputName];

    // 2. If the output is an image format, force a single-frame output
    const imageFormats = ['png', 'jpg', 'jpeg', 'webp', 'gif'];
    if (imageFormats.includes(formatTo.toLowerCase())) {
      execArgs.push('-frames:v', '1', '-update', '1');
    }

    // 3. Add the final output name
    execArgs.push(outputName);

    // Add a log to prove the arguments are being passed
    console.log('[Worker] Executing FFmpeg with args:', execArgs);
    // 4. Execute the dynamically built command
    await ffmpeg.exec(execArgs);

    postMessage({ type: 'status', value: 'Finalizing...' });
    const outputData = await ffmpeg.readFile(outputName);

    // Transfer the underlying buffer instead of letting postMessage
    // structured-clone (copy) it — meaningfully cheaper for large files.
    postMessage(
      {
        type: 'complete',
        fileData: outputData,
        fileName: outputName,
        mimeType: resolveMimeType(formatTo),
      },
      [(outputData as Uint8Array).buffer as ArrayBuffer]
    );
  } catch (error: any) {
    console.error('[Worker Fatal Error]:', error);
    postMessage({ type: 'error', value: error.message || 'Conversion failed.' });
  } finally {
    // Always clean up, even on failure, so a bad job doesn't leak
    // memory in ffmpeg's virtual filesystem for the life of the worker.
    try {
      await ffmpeg.deleteFile(inputName);
    } catch {
      /* file may not have been written yet */
    }
    try {
      await ffmpeg.deleteFile(outputName);
    } catch {
      /* file may not exist if exec failed before producing output */
    }
  }
});