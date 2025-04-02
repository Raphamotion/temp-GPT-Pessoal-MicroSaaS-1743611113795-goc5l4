import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PlusSquare, MessageSquare, LogOut as LogOutIcon, Key, CheckCircle, Loader2 } from 'lucide-react'; // Removido Settings, Adicionado Loader2
import type { User } from '@supabase/supabase-js';

// Tipo atualizado para Session
type Session = {
  id: string;
  title: string;
  created_at?: string; // Adicionado para possível ordenação/agrupamento futuro
};

type SidebarProps = {
  sessions: Session[]; // Renomeado de chats para sessions
  activeSessionId: string | null; // Renomeado de activeChat para activeSessionId
  onSessionSelect: (id: string) => void; // Renomeado de onChatSelect para onSessionSelect
  onNewSession: () => void; // Renomeado de onNewChat para onNewSession
  user: User | null;
  onLogout: () => void;
  onConnectOpenAI: () => void;
  apiKeyStatus: string | null;
  isLoadingSessions: boolean; // Novo: para indicar carregamento
  // userRole removido
};

const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSessionSelect,
  onNewSession,
  user,
  onLogout,
  onConnectOpenAI,
  apiKeyStatus,
  isLoadingSessions, // Recebe o estado de loading
  // userRole removido
}) => {
  const location = useLocation();

  // TODO: Agrupar sessões por data (ex: Hoje, Ontem, Mês Anterior) se necessário
  // Por enquanto, exibe todas juntas ordenadas pela API (mais recentes primeiro)

  // Link de Organização removido
  // const canManageOrg = userRole === 'admin' || userRole === 'gestor';

  return (
    <div className="flex flex-col h-full bg-gray-50 border-r border-gray-200 text-gray-800">
      {/* Cabeçalho da Sidebar */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Conversas</h2>
        <button
          onClick={onNewSession} // Chama onNewSession
          className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Nova Conversa"
          disabled={isLoadingSessions} // Desabilita durante o carregamento
        >
          {isLoadingSessions ? <Loader2 size={20} className="animate-spin" /> : <PlusSquare size={20} />}
        </button>
      </div>

      {/* Lista de Sessões */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoadingSessions ? (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            </div>
        ) : sessions.length > 0 ? (
          <ul>
            {sessions.map((session) => (
              <li key={session.id}>
                <button
                  onClick={() => onSessionSelect(session.id)} // Chama onSessionSelect
                  className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium text-left ${
                    activeSessionId === session.id && location.pathname === '/' // Ativo só se estiver na home
                      ? 'bg-gray-200 text-gray-900'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <MessageSquare size={16} className="mr-2 flex-shrink-0" />
                  <span className="truncate flex-1">{session.title}</span>
                  {/* TODO: Adicionar menu de contexto (renomear, excluir) */}
                </button>
              </li>
            ))}
          </ul>
        ) : (
            <div className="px-3 py-4 text-center text-sm text-gray-500">
                Nenhuma conversa encontrada. Crie uma nova!
            </div>
        )}
      </nav>

      {/* Rodapé da Sidebar */}
      <div className="p-4 border-t border-gray-200 space-y-3">
         {/* Botão Conectar OpenAI (sem alterações lógicas aqui) */}
         <button
           onClick={onConnectOpenAI}
           className={`w-full flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium border ${
             apiKeyStatus
               ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
               : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
           }`}
           title={apiKeyStatus ? `Chave conectada: ${apiKeyStatus}` : "Conectar chave API OpenAI"}
         >
           {apiKeyStatus ? (
             <>
               <CheckCircle size={16} className="mr-2 flex-shrink-0" />
               <span className="truncate">Chave: {apiKeyStatus}</span>
             </>
           ) : (
             <>
               <Key size={16} className="mr-2 flex-shrink-0" />
               Conectar OpenAI
             </>
           )}
         </button>

         {/* Link para Administração da Organização Removido */}
         {/* {canManageOrg && (...)} */}


        {/* Informações do Usuário/Logout (sem alterações lógicas aqui) */}
        {user && (
          <div className="flex items-center justify-between">
             <div className="flex items-center space-x-2 overflow-hidden">
                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold">
                  {user.email ? user.email[0].toUpperCase() : '?'}
                </div>
                <span className="text-sm font-medium truncate" title={user.email ?? 'Usuário'}>
                  {user.email ?? 'Usuário Logado'}
                </span>
             </div>
            <button
              onClick={onLogout}
              className="p-1 text-gray-500 hover:text-red-600"
              title="Sair"
            >
              <LogOutIcon size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
