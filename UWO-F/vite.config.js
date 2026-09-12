import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'spa-fallback',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const spaRoutes = [
            '/our-team',
            '/our-team.html',
            '/about',
            '/about.html',
            '/blogs',
            '/blogs.html',
            '/contact',
            '/contact.html',
            '/aisa',
            '/aisa.html',
            '/efv',
            '/efv.html',
            '/blog-single',
            '/blog-single.html',
            '/partner-login',
            '/partner-login.html',
            '/partner-dashboard',
            '/partner-dashboard.html'
          ];
          const urlPath = req.url ? req.url.split('?')[0] : '';
          if (spaRoutes.includes(urlPath)) {
            req.url = '/index.html' + (req.url.includes('?') ? '?' + req.url.split('?')[1] : '');
          }
          next();
        });
      }
    }
  ],
  server: {
    port: 3000,
    strictPort: false,
  },
});
