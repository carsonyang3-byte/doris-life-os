import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import type { IncomingMessage } from "http"

// https://vite.dev/config/
export default defineConfig({
  base: '/doris-life-os/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // 为JS和CSS文件添加哈希值，防止缓存
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/doris-life-os/weread-i": {
        target: "https://i.weread.qq.com",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/doris-life-os\/weread-i/, ""),
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req: IncomingMessage) => {
            const xc = req.headers["x-weread-cookie"]
            if (xc) {
              proxyReq.setHeader("Cookie", Array.isArray(xc) ? xc[0] : xc)
            }
            proxyReq.setHeader(
              "User-Agent",
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
          })
        },
      },
      "/doris-life-os/weread-origin": {
        target: "https://weread.qq.com",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/doris-life-os\/weread-origin/, ""),
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req: IncomingMessage) => {
            const xc = req.headers["x-weread-cookie"]
            if (xc) {
              proxyReq.setHeader("Cookie", Array.isArray(xc) ? xc[0] : xc)
            }
            proxyReq.setHeader(
              "User-Agent",
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
          })
        },
      },
    },
  },
});
