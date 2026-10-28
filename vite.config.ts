import { defineConfig } from 'vite';
export default defineConfig({ base: './', build: { target: 'es2022' }, server: { headers: { 'Cross-Origin-Resource-Policy':'same-origin' } } });
