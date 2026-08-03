/// <reference lib="webworker" />

// 1. Import the default initialization function as 'init'
import init, * as photon from '@silvia-odwyer/photon';
import { ImageConversionOptions } from '../../core/interfaces/iimage-converter';

// Keep track of initialization so we only boot the WASM engine once per session
let wasmInitialized = false;

addEventListener('message', async (event: MessageEvent) => {
  const { file, options }: { file: File, options: ImageConversionOptions } = event.data;

  try {
    // 2. EXPLICITLY BOOT THE WEBASSEMBLY ENGINE
    if (!wasmInitialized) {
      // Pointing to the automated folder created by angular.json
      await init({ module_or_path: '/photon/photon_rs_bg.wasm' });
      wasmInitialized = true;
    }

    // 1. Read the user's file into a raw byte array
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // 2. Decode the image using the initialized Photon Rust/WASM engine
    let img = photon.PhotonImage.new_from_byteslice(bytes);

    // 3. Pipeline Step: Crop (MUST HAPPEN FIRST BEFORE RESIZE)
    if (options.crop && options.crop.width > 0 && options.crop.height > 0) {
      if (options.crop.width > options.crop.x && options.crop.height > options.crop.y) {
        const cropped = photon.crop(img, options.crop.x, options.crop.y, options.crop.width, options.crop.height);
        img.free();
        img = cropped;
      }
      else {
        throw new Error("Invalid crop coordinates. The crop area is out of bounds.");
      }
    }


    // 4. Pipeline Step: Resize with Aspect Ratio support
    if (options.resize) {
      // Get the width/height of the CURRENT image state (which might be cropped now!)
      const currentWidth = img.get_width();
      const currentHeight = img.get_height();

      let targetWidth = options.resize.width || currentWidth;
      let targetHeight = options.resize.height || currentHeight;

      // Calculate missing dimensions if the user wants proportional scaling
      if (options.resize.maintainAspectRatio) {
        const aspect = currentWidth / currentHeight;

        if (options.resize.width && !options.resize.height) {
          targetHeight = Math.round(options.resize.width / aspect);
        } else if (options.resize.height && !options.resize.width) {
          targetWidth = Math.round(options.resize.height * aspect);
        }
      }

      // 5 is the 'Lanczos3' algorithm in Photon — the highest quality resampling filter
      const resized = photon.resize(img, targetWidth, targetHeight, 5);
      img.free(); // Free the old image from WASM memory
      img = resized;
    }

    // 5. Pipeline Step: Color Filters
    if (options.filter && options.filter !== 'none') {
      switch (options.filter) {
        case 'grayscale':
          photon.grayscale(img);
          break;
        case 'sepia':
          photon.sepia(img);
          break;
        case 'invert':
          photon.invert(img);
          break;
        case 'vintage':
          photon.filter(img, 'twenties');
          break;
        case 'blur':
          photon.gaussian_blur(img, 1); // 1 is the blur radius
          break;
        case 'sharpen':
          photon.sharpen(img);
          break;
      }
    }

    // 6. Pipeline Step: Watermark Text
    if (options.watermarkText) {
      // draw_text(img, text, x, y, font_size)
      photon.draw_text(img, options.watermarkText, 10, 30, 20);
    }

    // 7. Extract the final computed pixels directly as a native ImageData object
    const imageData = img.get_image_data();
    const width = img.get_width();
    const height = img.get_height();

    // Completely clear the WASM memory buffer for this operation
    img.free();

    // 8. Hardware-Accelerated Formatting via OffscreenCanvas
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error("Could not initialize OffscreenCanvas context");
    }

    // Pass the ImageData object straight into the hardware canvas
    ctx.putImageData(imageData, 0, 0);

    // 9. Format mapping and native browser compression
    // Convert our uppercase strict types ('JPG', 'WEBP') to valid mime types
    const fmt = options.format.toLowerCase();
    const mimeType = (fmt === 'jpg' || fmt === 'jpeg') ? 'image/jpeg' : `image/${fmt}`;

    // Default to 0.8 (80%) quality if compression is lossy and no quality was specified
    const compressionRatio = options.quality ? options.quality / 100 : 0.8;

    const finalBlob = await canvas.convertToBlob({
      type: mimeType,
      quality: compressionRatio
    });

    // 10. Send the finished file back to the Angular Service
    postMessage({ success: true, blob: finalBlob });

  } catch (error: any) {
    postMessage({ success: false, error: error.message || 'Image processing failed in the Web Worker.' });
  }
});