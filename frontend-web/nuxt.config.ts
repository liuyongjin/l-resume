/** 开发模式启动 / HMR 重载时的占位页，替代默认 Nuxt Logo 全屏页 */
const devLoadingTemplate = () => `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>简流</title>
  <script src="/theme-init.js"><\/script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; background: hsl(0 0% 98%); color-scheme: light; }
    html.dark, html.dark body { background: hsl(240 10% 3.9%); color-scheme: dark; }
    .loader { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; }
    .spinner {
      width: 24px; height: 24px;
      border: 2px solid rgba(14, 165, 233, 0.2);
      border-top-color: #0EA5E9;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body><div class="loader"><div class="spinner"></div></div></body>
</html>`

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  srcDir: 'src/',
  /** 关闭 ssr:false 页面 hydrate 前的默认 Nuxt Logo 全屏加载动画 */
  spaLoadingTemplate: false,

  devServer: {
    loadingTemplate: devLoadingTemplate,
  },

  runtimeConfig: {
    apiBackend: process.env.NUXT_API_BACKEND || 'http://localhost:3001',
  },
  
  modules: [
    '@nuxtjs/tailwindcss', 
    '@pinia/nuxt'
  ],

  components: [
    {
      path: '~/components',
      ignore: ['**/ui/**']
    },
    {
      path: '~/components/ui',
      extensions: ['.vue'],
      pathPrefix: false
    }
  ],
  
  css: ['~/assets/css/style.css'],
  
  app: {
    head: {
      title: '简流 - 智能简历工作流',
      titleTemplate: '%s | 简流',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
        { name: 'theme-color', content: '#0EA5E9' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'description', content: '简流 - AI 驱动的简历制作平台，模板编辑、智能工作流与实时预览一体化' },
        { name: 'keywords', content: '简历,Resume,AI简历,简历模板,工作流' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700&display=swap',
        },
      ],
      script: [
        { src: '/theme-init.js', tagPriority: 'critical' },
      ]
    },
    pageTransition: false,
  },
  
  vite: {
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          timeout: 300000,
          proxyTimeout: 300000,
        }
      }
    },
    optimizeDeps: {
      include: ['pinia'],
      exclude: ['@vue-flow/core', '@vue-flow/controls', '@vue-flow/minimap', '@vue-flow/background']
    },
    resolve: {
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.css']
    },
    build: {
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks: {
            'vue-flow': ['@vue-flow/core', '@vue-flow/controls', '@vue-flow/minimap', '@vue-flow/background']
          }
        }
      }
    },
    plugins: []
  },
  
  nitro: {
    compressPublicAssets: true,
    devProxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        timeout: 300000,
        proxyTimeout: 300000,
      }
    },
    routeRules: {
      '/api/**': { proxy: 'http://localhost:3001/api/**', headers: { 'Cache-Control': 'no-store' } },
      '/': { headers: { 'Cache-Control': 'public, max-age=0, must-revalidate' } },
      '/**': { headers: { 'Cache-Control': 'no-store' } },
      '/_nuxt/**': { headers: { 'Cache-Control': 'max-age=31536000' } },
      '/assets/**': { headers: { 'Cache-Control': 'max-age=31536000' } },
    }
  },
  
  typescript: {
    strict: true,
    typeCheck: false
  },
  
  experimental: {
    payloadExtraction: false
  },
  
  performance: {
    prefetch: true,
    preload: true,
    chunkPreload: true
  },
  
  vue: {
    compilerOptions: {
      isCustomElement: (tag) => tag.startsWith('vue-flow') || tag === 'v-flow'
    }
  }
})
