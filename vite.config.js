import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
// "npm run movil": HTTPS en la red local; sin él, el móvil bloquea los sensores (agitar)
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: mode === 'movil' ? [basicSsl()] : [],
  server: { host: true },
  build: { target: 'es2020', chunkSizeWarningLimit: 900 },
}));
