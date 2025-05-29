import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    base: '/aitripplanner/', // 👈 Needed for GitHub Pages
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      __VITE_GEMINI_API_KEY__: JSON.stringify(env.VITE_GEMINI_API_KEY),
    },
  };
});
