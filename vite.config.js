import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { ReactInjectorVitePlugin } from 'yunji-tagger';

export default defineConfig({
  plugins: [
    react(),
    ReactInjectorVitePlugin()
  ],
});
