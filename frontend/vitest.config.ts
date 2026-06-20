import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    exclude: ['node_modules/**', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'lib/**/*.{ts,tsx}',
        'components/article/LikeButton.tsx',
        'components/shared/AdminGuard.tsx',
        'app/(public)/search/_components/SearchClient.tsx',
        'app/(public)/_components/HomeRealtime.tsx',
      ],
      exclude: [
        'node_modules/',
        'tests/',
        'e2e/',
        '**/*.config.{js,ts}',
        '**/*.d.ts',
        '**/types/**',
        'app/layout.tsx',
        'app/not-found.tsx',
        'app/error.tsx',
        'components/ui/**',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
