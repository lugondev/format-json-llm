import { defineConfig } from 'vite';

export default defineConfig({
  // Project Pages are served from https://<user>.github.io/format-json-llm/
  base: '/format-json-llm/',
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
