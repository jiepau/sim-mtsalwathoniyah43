import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const backendUrl = process.env.VITE_SUPABASE_URL || "https://lnskrkkyeavoshufhwkm.supabase.co";
const backendPublishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxuc2tya2t5ZWF2b3NodWZod2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NjQ5ODEsImV4cCI6MjA4NTM0MDk4MX0.3ZZE6wVmDtmvxkzLA4PokQPJH7P9r8G1N2_EgTL_YGA";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(backendUrl),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(backendPublishableKey),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
