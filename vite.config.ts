import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente específicas do modo (development, production)
  // O terceiro argumento '' garante que todas as variáveis sejam carregadas, não apenas as prefixadas com VITE_
  // No entanto, para variáveis do próprio ambiente como HOSTNAME, é mais seguro usar process.env
  const env = loadEnv(mode, process.cwd(), '');

  // Obtém o HOSTNAME diretamente do ambiente do processo, se disponível
  const hostname = process.env.HOSTNAME;

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      // Usa a porta definida em VITE_PORT ou 5173 como padrão
      port: parseInt(env.VITE_PORT || '5173', 10),
      // Necessário para que o servidor Vite seja acessível dentro do WebContainer
      host: '0.0.0.0',
      hmr: hostname ? { // Só configura HMR se HOSTNAME estiver definido
        // Configuração específica para WebContainer para HMR funcionar corretamente
        clientPort: 443,
        // Usa process.env.HOSTNAME diretamente
        host: `${hostname}-443.use.bolt.dev`,
        protocol: 'wss',
      } : undefined, // Desativa HMR se HOSTNAME não for encontrado (fallback seguro)
    },
  }
})
