import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabaseClient';
import { Session as SupabaseSession, User, PostgrestError } from '@supabase/supabase-js'; // Import PostgrestError
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import Header from './components/Header';
import ApiKeyModal from './components/ApiKeyModal';
import AuthForm from './components/AuthForm';
import { maskApiKey } from './lib/utils';

// Tipagem para as mensagens
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// Tipagem para as conversas/sessões
interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

function App() {
  const [supabaseSession, setSupabaseSession] = useState<SupabaseSession | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [maskedApiKey, setMaskedApiKey] = useState<string | null>(null);
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [globalError, setGlobalErrorState] = useState<string | null>(null);


  // --- Autenticação ---
  useEffect(() => {
    console.log('[Auth Effect] --- EFFECT START --- Setting up listener.');
    setLoadingAuth(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[Auth Effect] Initial getSession:', session ? 'Session found' : 'No session');
      setSupabaseSession(session);
    }).catch(error => {
      console.error("[Auth Effect] Error in initial getSession:", error);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log(`[Auth Listener] Event: ${_event}, Session:`, session ? 'Got session' : 'No session');
      setSupabaseSession(session);
      setLoadingAuth(false);
      if (!session) {
        setChatSessions([]);
        setMessages([]);
        setCurrentSessionId(null);
        setMaskedApiKey(null);
        console.log('[Auth Listener] User logged out, cleared user data.');
      }
    });

    return () => {
      console.log('[Auth Effect] --- EFFECT CLEANUP --- Removing listener.');
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // --- Carregamento de Dados do Usuário ---
  const fetchUserData = useCallback(async (userId: string) => {
    console.log(`[FetchUserData] Starting fetch for user: ${userId}. Setting isLoadingSessions = true.`);
    setIsLoadingSessions(true);
    setMaskedApiKey(null); // Assumir que não há chave até salvar com sucesso

    try {
      console.log(`[FetchUserData] Preparing to fetch sessions for user: ${userId}`);
      // Simulação por enquanto:
      await new Promise(resolve => setTimeout(resolve, 50));
      console.log('[FetchUserData] Skipping session fetch for now.');
      setChatSessions([]);
      setCurrentSessionId(null);

    } catch (error) {
      console.error('[FetchUserData] Unexpected error fetching user data:', error);
      setChatSessions([]);
      setCurrentSessionId(null);
      setMaskedApiKey(null);
    } finally {
      console.log(`[FetchUserData] Finished fetch for user: ${userId}. Setting isLoadingSessions = false.`);
      setIsLoadingSessions(false);
    }
  }, []);

  // --- Efeito para Carregar Dados Quando a Sessão Muda ---
  useEffect(() => {
    if (supabaseSession?.user?.id) {
      console.log('[Session Effect] Active session found. Calling fetchUserData.');
      fetchUserData(supabaseSession.user.id);
    } else {
      console.log('[Session Effect] No active session. Skipping data fetch.');
    }
  }, [supabaseSession, fetchUserData]);


  // --- Manipulador para Salvar Chave API (Usando RLS) ---
  const handleSaveApiKey = async (apiKey: string): Promise<boolean> => {
    console.log('[handleSaveApiKey RLS] Function called. Key (first 5 chars):', apiKey.substring(0, 5));

    if (!supabaseSession?.user?.id) {
      console.error('[handleSaveApiKey RLS] User not logged in. Aborting.');
      setGlobalErrorState('Erro: Usuário não está logado.');
      return false;
    }
    if (!apiKey.trim()) {
      console.error('[handleSaveApiKey RLS] API key is empty. Aborting.');
      // Poderia adicionar um setGlobalErrorState aqui também se quisesse
      return false;
    }

    const userId = supabaseSession.user.id;
    console.log(`[handleSaveApiKey RLS] User logged in (${userId}), key provided.`);
    console.log('[handleSaveApiKey RLS] Setting isSavingApiKey = true.');
    setIsSavingApiKey(true);
    setGlobalErrorState(null);

    try {
      console.log(`[handleSaveApiKey RLS] Preparing to call supabase.from("user_api_keys").upsert({ user_id: ${userId}, api_key: [HIDDEN] })...`);
      const { error } = await supabase
        .from('user_api_keys')
        .upsert(
          {
            user_id: userId, // Garante que estamos salvando para o usuário logado
            api_key: apiKey, // A chave real
          },
          {
            onConflict: 'user_id', // Se já existir um registro para este user_id, atualiza
          }
        );

      console.log('[handleSaveApiKey RLS] supabase.from().upsert() finished.');

      if (error) {
        // --- LOG DETALHADO DO ERRO ---
        console.error('[handleSaveApiKey RLS] Supabase upsert returned error object:', error);
        console.error(`[handleSaveApiKey RLS] Error Details: Message: ${error.message}, Details: ${error.details}, Hint: ${error.hint}, Code: ${error.code}`);
        // --- FIM DO LOG DETALHADO ---

        let userMessage = `Erro ao salvar a chave: ${error.message}`;
        if (error.message.includes('violates row-level security policy')) {
           userMessage = 'Erro: Falha de permissão ao salvar a chave. Verifique as políticas RLS.';
        } else if (error.code === '23505') { // Código para unique violation (pode acontecer se onConflict falhar)
           userMessage = 'Erro: Conflito ao salvar a chave (possível problema com onConflict).';
        } else if (error.code === '22001') { // Código para string data right truncation
           userMessage = 'Erro: A chave API fornecida é muito longa.';
        }
        // Adicione mais mapeamentos de error.code para mensagens amigáveis se necessário

        setGlobalErrorState(userMessage);
        setIsSavingApiKey(false);
        return false;
      }

      console.log('[handleSaveApiKey RLS] Upsert successful.');
      setMaskedApiKey(maskApiKey(apiKey));
      setIsApiKeyModalOpen(false);
      setGlobalErrorState(null); // Limpa erro em caso de sucesso
      setIsSavingApiKey(false);
      return true;

    } catch (catchError: any) {
      console.error('[handleSaveApiKey RLS] Unexpected error during upsert:', catchError);
      // Tenta extrair mensagem do erro capturado
      const errorMessage = catchError instanceof Error ? catchError.message : String(catchError);
      setGlobalErrorState(`Erro inesperado ao tentar salvar: ${errorMessage}`);
      setIsSavingApiKey(false);
      return false;
    } finally {
      console.log('[handleSaveApiKey RLS] Function execution finished (try/catch/finally).');
      // setIsSavingApiKey(false); // Movido para dentro do try/catch para garantir que seja setado antes do return
    }
  };


  // --- Manipulador de Envio de Mensagem ---
  const handleSendMessage = (text: string) => {
    if (!text.trim() || !currentSessionId) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };
    setMessages(prevMessages => [...prevMessages, newMessage]);

    // TODO: Adicionar lógica para chamar a API da OpenAI
  };

  // --- Manipulador para Nova Sessão ---
  const handleNewSession = async () => {
      if (!supabaseSession?.user?.id) return;
      console.log("Creating new session...");
      setIsLoadingSessions(true);

      // Simulação por enquanto:
      await new Promise(resolve => setTimeout(resolve, 300));
      const newSession: ChatSession = {
          id: `simulated-${Date.now()}`,
          title: `Nova Conversa ${chatSessions.length + 1}`,
          created_at: new Date().toISOString(),
      };
      setChatSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setMessages([]);
      setIsLoadingSessions(false);
      console.log("Simulated new session created:", newSession.id);
  };

  // --- Manipulador para Selecionar Sessão ---
  const handleSelectSession = (sessionId: string) => {
      console.log("Selecting session:", sessionId);
      setCurrentSessionId(sessionId);
      setMessages([]); // Limpa mensagens atuais (simulação)
      console.log("TODO: Load messages for session", sessionId);
  };


  // --- Renderização ---
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    if (globalError) {
      timeoutId = setTimeout(() => {
        setGlobalErrorState(null);
      }, 7000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [globalError]);


  if (loadingAuth) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Carregando autenticação...</div>;
  }

  if (!supabaseSession) {
    return <AuthForm />;
  }

  const userEmail = supabaseSession.user.email || 'Usuário';
  const currentUser = supabaseSession.user;

  return (
    <div className="flex h-screen bg-gray-900 text-white">
       {globalError && (
         <div style={{
           position: 'fixed', top: 0, left: 0, right: 0,
           backgroundColor: '#f8d7da', color: '#721c24',
           padding: '10px', textAlign: 'center', zIndex: 1000,
           borderBottom: '1px solid #f5c6cb'
         }}>
           {globalError}
           <button onClick={() => setGlobalErrorState(null)} style={{ marginLeft: '15px', background: 'none', border: 'none', color: '#721c24', fontWeight: 'bold', cursor: 'pointer' }}>X</button>
         </div>
       )}

      <Sidebar
          sessions={chatSessions}
          activeSessionId={currentSessionId}
          onSessionSelect={handleSelectSession}
          onNewSession={handleNewSession}
          isLoadingSessions={isLoadingSessions}
          user={currentUser}
          onLogout={() => supabase.auth.signOut()}
          onConnectOpenAI={() => setIsApiKeyModalOpen(true)}
          apiKeyStatus={maskedApiKey ? 'connected' : 'disconnected'}
       />

      <div className="flex flex-col flex-1">
        <Header
          userEmail={userEmail}
          apiKeyStatus={maskedApiKey ? 'connected' : 'disconnected'}
          onApiKeyClick={() => setIsApiKeyModalOpen(true)}
          onLogout={() => supabase.auth.signOut()}
        />

        <main className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-800">
          {isLoadingSessions && !currentSessionId ? (
             <div className="flex justify-center items-center h-full">
               <p>Carregando dados...</p>
             </div>
          ) : messages.length === 0 && currentSessionId ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-gray-400">Digite algo para iniciar a conversa.</p>
            </div>
          ) : messages.length === 0 && !currentSessionId ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-gray-400">Selecione uma conversa ou <button onClick={handleNewSession} className="text-indigo-400 hover:underline">crie uma nova</button>.</p>
            </div>
          ) : (
            messages.map(msg => <ChatMessage key={msg.id} message={msg} />)
          )}
        </main>

        <footer className="p-4 bg-gray-900 border-t border-gray-700">
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={isLoadingSessions || !currentSessionId}
          />
        </footer>
      </div>

      {isApiKeyModalOpen && (
        <ApiKeyModal
          isOpen={isApiKeyModalOpen}
          onClose={() => setIsApiKeyModalOpen(false)}
          onSave={handleSaveApiKey}
          userId={currentUser.id}
          initialMaskedKey={maskedApiKey}
          isSaving={isSavingApiKey}
        />
      )}
    </div>
  );
}

export default App;
