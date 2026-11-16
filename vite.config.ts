import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const api = env.API_PROXY_TARGET || 'http://127.0.0.1:8000';
  const apiRoutes = ['/publicacoes', '/login', '/alunos', '/cursos', '/cadastro', '/encontros', '/participacoes', '/busca', '/mensagens', '/conversas', '/notificacoes'];
  return {
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    proxy: {
      ...Object.fromEntries(apiRoutes.map((route) => [route, api])),
    },
  },
  };
});
