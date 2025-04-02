import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Loader2 } from 'lucide-react';

// Removido onLoginSuccess das props, pois o listener em App.tsx cuidará disso
const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null); // Para mensagens de sucesso (ex: verificação de email)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      let response;
      if (isLogin) {
        console.log("Tentando login com:", email);
        response = await supabase.auth.signInWithPassword({ email, password });
        console.log("Resposta login:", response);
      } else {
        console.log("Tentando cadastro com:", email);
        response = await supabase.auth.signUp({
          email,
          password,
          // options: { // Adicione se precisar de dados extras no cadastro
          //   data: {
          //     // initial_role: 'owner' // Exemplo, se precisar definir um role inicial
          //   }
          // }
        });
        console.log("Resposta cadastro:", response);
        // Se o cadastro requer confirmação de email
        if (response.data.user && !response.data.session) {
           setMessage("Cadastro realizado! Verifique seu e-mail para confirmar a conta.");
        } else if (response.data.session) {
           setMessage("Cadastro realizado e login efetuado!"); // Auto-login após signup
        }
      }

      const { error: authError } = response;

      if (authError) {
        throw authError;
      }

      // O listener onAuthStateChange em App.tsx vai detectar a mudança
      // e atualizar o estado da aplicação, não precisamos fazer nada aqui.
      console.log(isLogin ? "Login bem-sucedido (ou erro tratado)." : "Cadastro bem-sucedido (ou erro tratado).");

    } catch (err: any) {
      console.error("Erro na autenticação:", err);
      setError(err.message || 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <img
            className="mx-auto h-12 w-auto"
            src="/logo.svg" // Certifique-se que o logo está na pasta public
            alt="GPT Builder Platform"
          />
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            {isLogin ? 'Acesse sua conta' : 'Crie sua conta'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ou{' '}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setMessage(null);
                // Limpar campos ao trocar? Opcional
                // setEmail('');
                // setPassword('');
              }}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              {isLogin ? 'crie uma nova conta' : 'faça login'}
            </button>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          <input type="hidden" name="remember" defaultValue="true" />
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                className="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Exibição de Erros e Mensagens */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}
          {message && (
             <div className="rounded-md bg-blue-50 p-4">
               <div className="flex">
                 <div className="ml-3">
                   <p className="text-sm font-medium text-blue-800">{message}</p>
                 </div>
               </div>
             </div>
           )}


          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                isLogin ? 'Entrar' : 'Cadastrar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthForm;
