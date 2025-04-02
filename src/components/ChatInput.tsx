import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

type ChatInputProps = {
  onSendMessage: (message: string) => void;
  disabled?: boolean; // Mantido, controlado pelo App.tsx
  placeholder?: string; // Mantido, controlado pelo App.tsx
};

// Nenhuma mudança lógica necessária aqui, pois `disabled` e `placeholder`
// são controlados pelo App.tsx, que foi atualizado.
const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false, placeholder = "Pergunte alguma coisa..." }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 128; // 8rem
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [message]);

  return (
    <div className="p-4 bg-white border-t border-gray-200">
      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder} // Recebe o placeholder atualizado do App.tsx
          className="flex-1 border border-gray-300 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32 overflow-y-auto"
          rows={1}
          disabled={disabled} // Recebe o estado disabled atualizado do App.tsx
          style={{ lineHeight: '1.5rem' }}
        />
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className={`p-2 rounded-lg text-white ${
            disabled || !message.trim()
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } transition-colors duration-200`}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
