import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

// Detect restricted environments (Google AI Studio, StackBlitz, Codespaces, etc.)
function isSandboxed() {
  const forbiddenHosts = [
    "aistudio.google.com",
    "stackblitz.io",
    "codesandbox.io",
    "replit.com",
    "github.dev",
  ];

  if (typeof window !== "undefined") {
    return forbiddenHosts.some(h => window.location.hostname.includes(h));
  }

  // Server-side fallback (safe default)
  return process.env.SANDBOX === "true" || process.env.DISABLE_HMR === "true";
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const sandbox = isSandboxed();

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      '__SANDBOX__': JSON.stringify(sandbox),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      hmr: sandbox
        ? false
        : {
            protocol: "ws",
            host: "localhost",
            port: 5173,
          },
    },
  };
});
