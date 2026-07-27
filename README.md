# ZeroCloud Studio

A 100% offline, client-side Progressive Web App (PWA) for processing media and documents directly in the browser. 

No servers, no uploads, zero privacy risks.

Live Demo: https://zerocloud-studio.pages.dev/

## Features
* **PDF Studio:** Merge, split, rotate, and extract PDFs using `pdf-lib`.
* **Image Engine:** Crop, convert, and scale images (JPEG, PNG, WEBP) using `cropperjs, and photon`.
* **Video/Audio Transcoding:** Local media conversion powered by WebAssembly.
* **Offline-First:** Fully installable PWA that works in airplane mode.

## Tech Stack
* **Framework:** Angular 20 (Standalone Components)
* **Styling:** Bootstrap 5 & Custom CSS Variables
* **Architecture:** Lazy-loaded routing and modular service engines
* **Build:** Strict TypeScript with esbuild

## Running Locally
1. `npm install`
2. `ng serve` for development
3. `ng build` followed by `npx http-server -p 8080 dist/local-converter/browser` to test the PWA offline.
