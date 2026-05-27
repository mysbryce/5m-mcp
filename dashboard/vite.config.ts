import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [vue(), viteSingleFile()],
  build: {
    // Emit a single self-contained index.html the FiveM resource serves verbatim.
    outDir: '../dist/dashboard',
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
  },
});
