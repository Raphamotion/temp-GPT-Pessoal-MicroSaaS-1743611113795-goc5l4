import React from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Bot } from 'lucide-react'; // Usar ícones diferentes

type ChatMessageProps = {
  role: 'user' | 'assistant';
  content: string;
};

const ChatMessage: React.FC<ChatMessageProps> = ({ role, content }) => {
  const isUser = role === 'user';

  return (
    <div className={`py-5 ${isUser ? 'bg-white' : 'bg-gray-50'} border-b border-gray-200`}>
      <div className="max-w-3xl mx-auto flex gap-4 px-4">
        {/* Ícone */}
        <div className="flex-shrink-0 mt-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'}`}>
            {isUser ? <User size={18} /> : <Bot size={18} />}
          </div>
        </div>

        {/* Conteúdo da Mensagem */}
        <div className="flex-1 prose prose-sm max-w-none">
          {/* Usar ReactMarkdown para renderizar markdown */}
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
