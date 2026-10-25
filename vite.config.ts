import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "127.0.0.1",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: false,
        configure(proxy) {
          proxy.on("proxyReq", (proxyReq, req) => {
            // Preserve the client boundary if development is explicitly exposed on a LAN.
            const remote = req.socket.remoteAddress || "unknown";
            if (!["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(remote)) {
              proxyReq.setHeader("x-forwarded-for", remote);
            }
          });
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));
