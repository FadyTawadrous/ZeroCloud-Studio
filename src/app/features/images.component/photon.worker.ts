/// <reference lib="webworker" />
// 1. Import the default initialization function as 'init'
import init, * as photon from '@silvia-odwyer/photon';

// Keep track of initialization so we only boot the WASM engine once per session
let wasmInitialized = false;

addEventListener('message', async (event: MessageEvent) => {
  const { file, options } = event.data;

  try {
    // 2. EXPLICITLY BOOT THE WEBASSEMBLY ENGINE
    if (!wasmInitialized) {
      // Pass the configuration as an object to satisfy modern wasm-bindgen requirements
      await init({ module_or_path: '/photon_rs_bg.wasm' }); 
      wasmInitialized = true;
    }

    // 1. Read the user's file into a raw byte array
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // 2. Decode the image using the newly initialized Photon Rust/WASM engine
    let img = photon.PhotonImage.new_from_byteslice(bytes);

    // 3. Pipeline Step: Resize
    if (options.resize) {
      const resized = photon.resize(img, options.resize.width, options.resize.height, 5);
      img.free();
      img = resized;
    }

    // 4. Pipeline Step: Crop
    if (options.crop) {
      const cropped = photon.crop(img, options.crop.x, options.crop.y, options.crop.width, options.crop.height);
      img.free();
      img = cropped;
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
      }
    }

    // 6. Pipeline Step: Watermark Text
    if (options.watermark) {
      photon.draw_text(img, options.watermark, 10, 30, 20);
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
    const mimeType = options.format === 'jpeg' ? 'image/jpeg' : `image/${options.format}`;
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