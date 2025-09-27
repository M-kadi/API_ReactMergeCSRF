import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key:  fs.readFileSync('cert/localhost-key.pem'),
      cert: fs.readFileSync('cert/localhost.pem'),
    },
    port: 5173,
    proxy: {
      '/bff': {
        target: 'https://localhost:54451', // Kestrel port of API+BFF
        changeOrigin: true,
        secure: false                       // accept self-signed dev cert
      }
    }
  }
});
