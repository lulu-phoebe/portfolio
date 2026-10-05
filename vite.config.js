import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig(({command}) => ({base:command === 'build' ? '/portfolio/' : '/',build:{rollupOptions:{input:{main:fileURLToPath(new URL('./index.html',import.meta.url)),notebook:fileURLToPath(new URL('./notebook/index.html',import.meta.url))}}}}));
