# ⚡ ZeroCloud Studio

[![Live Demo](https://img.shields.io/badge/Live_Demo-Available_Now-success?style=for-the-badge)](https://zerocloud-studio.pages.dev/)
[![Angular](https://img.shields.io/badge/Angular-20-dd0031?style=for-the-badge&logo=angular)](https://angular.dev/)
[![PWA](https://img.shields.io/badge/PWA-100%25_Offline-5a0fc8?style=for-the-badge&logo=pwa)](https://zerocloud-studio.pages.dev/)

A 100% offline, client-side Progressive Web App (PWA) for processing media and documents directly in the browser. 

Traditional media converters require uploading sensitive files to third-party servers, risking data privacy and consuming unnecessary bandwidth. **ZeroCloud Studio** solves this by harnessing native hardware APIs and WebAssembly to process everything entirely on your local machine. No servers, no uploads, zero privacy risks.

**[Try the Live Demo](https://zerocloud-studio.pages.dev/)**

---

## ✨ Key Features

* **🛡️ Absolute Privacy:** Your files never leave your device. All processing is strictly client-side.
* **⚡ Blazing Fast Conversions:** Leverages the browser's native **WebCodecs API** for hardware-accelerated video and audio transcoding without the overhead of heavy FFmpeg ports.
* **🖼️ High-Performance Image Engine:** Utilizes **Photon** (compiled from Rust to WebAssembly) and `cropperjs` for zero-latency image resizing, cropping, and format conversion on the main UI thread.
* **📄 Document Utilities:** Merge, split, rotate, and extract PDFs entirely locally using `pdf-lib`.
* **✈️ Offline-First (PWA):** Fully installable to your desktop or mobile device. Once loaded, the application functions flawlessly without an active internet connection.
* **♾️ No Artificial Limits:** Forget the standard 50MB upload caps. If your device's RAM can handle the file size, ZeroCloud Studio can process it.

## 🛠️ Architecture & Tech Stack

ZeroCloud Studio is built with modern, strict web standards to ensure a lightweight footprint and maximum performance.

* **Frontend Framework:** Angular 20 (Standalone Components, Strict TypeScript)
* **Styling & UI:** Bootstrap 5, Custom CSS Variables, Responsive Grid
* **Core Processing:** 
  * `Mediabunny` (Audio/Video Transcoding)
  * `Photon Wasm` (Image Manipulation)
  * `pdf-lib` (Document Parsing)
* **Performance:** Lazy-loaded routing and modular service engines to keep the initial load under 4MB.
* **CI/CD:** Automated GitHub Actions pipeline for linting, deployed securely to the Cloudflare Pages global edge network.

---

## 🚀 Running Locally

Want to test the application or contribute? Follow these steps to spin up the environment locally.

### Prerequisites
* Node.js (v20 or higher recommended)
* Angular CLI

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/FadyTawadrous/ZeroCloud-Studio.git]
   cd ZeroCloud-Studio

2. **Install dependencies:**
```bash
npm install
```

3. **Run the development server**
```bash
ng serve
```

## Testing the PWA (Production Build)
To test the offline Service Worker capabilities, you must run the compiled production build:
```bash
npm run build
npx http-server -p 8080 dist/local-converter/browser
```
