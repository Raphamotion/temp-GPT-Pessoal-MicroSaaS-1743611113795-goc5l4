import React, { useState, useEffect } from 'react';
import { X, Key, CheckCircle, AlertTriangle } from 'lucide-react';

type ApiKeyModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => Promise<boolean>; // Retorna true se sucesso, false se erro
  userId: string | undefined;
  initialMaskedKey: string | null; // Chave mascarada existente (vem do estado do App)
  isSaving: boolean; // Estado de salvamento controlado pelo pai
};

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  userId,
  initialMaskedKey, // Recebe a chave mascarada atual
  isSaving,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Limpa o estado ao abrir/fechar
  useEffect(() => {
    if (isOpen) {
      setApiKeyInput(''); // Limpa input ao abrir
      setError(null);
      setShowSuccess(false);
    }
  }, [isOpen]);

  // Atualiza o input se a chave inicial mudar (ex: usuário salva e reabre)
  // Mas só se o modal estiver fechado, para não sobrescrever digitação
  // useEffect(() => {
  //   if (!isOpen && initialMaskedKey) {
  //      // Poderia pré-popular algo, mas geralmente não se faz com senhas/chaves
  //   }
  // }, [initialMaskedKey, isOpen]);


  if (!isOpen || !userId) return null;

  const validateKey = (key: string): boolean => {
    const trimmedKey = key.trim();
    if (!trimmedKey) {
      setError('A chave API não pode estar vazia.');
      return false;
    }
    // Validação básica do formato OpenAI
    if (!trimmedKey.startsWith('sk-') || trimmedKey.length < 40) { // Adiciona verificação de tamanho mínimo (aproximado)
      setError('Formato inválido. Verifique sua chave OpenAI (deve começar com "sk-").');
      return false;
    }
    setError(null);
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKeyInput(e.target.value);
    if (error) {
      setError(null); // Limpa erro ao digitar
    }
  };

  const handleSaveClick = async () => {
    console.log('[ApiKeyModal] handleSaveClick called.');
    const trimmedKey = apiKeyInput.trim();
    if (!validateKey(trimmedKey)) {
      console.log('[ApiKeyModal] handleSaveClick - Validation failed.');
      return;
    }

    setShowSuccess(false);
    console.log('[ApiKeyModal] handleSaveClick - Calling onSave prop...');
    const success = await onSave(trimmedKey); // Chama a função do App.tsx
    console.log('[ApiKeyModal] handleSaveClick - onSave prop returned:', success);

    if (success) {
      setShowSuccess(true);
      // Mantém o modal aberto por um instante para mostrar sucesso
      setTimeout(() => {
        onClose(); // Fecha o modal após o delay
      }, 1500);
    } else {
      // O erro deve ser setado pela função onSave (via alert/console no App.tsx)
      // Mas podemos setar um erro genérico aqui caso onSave retorne false sem um erro claro
      if (!error) { // Evita sobrescrever erro de validação
         setError('Falha ao salvar a chave. Verifique o console ou tente novamente.');
      }
      console.log('[ApiKeyModal] handleSaveClick - Save failed. Current error state:', error);
    }
  };

  // Botão desabilitado se estiver salvando, houver erro de validação, ou input vazio
  const isSaveDisabled = isSaving || !!error || !apiKeyInput.trim();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative animate-fade-in-scale">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          aria-label="Fechar modal"
        >
          <X size={20} />
        </button>

        <div className="flex items-center mb-4">
          <Key className="text-indigo-600 mr-2" size={24} />
          <h2 className="text-xl font-semibold text-gray-800">Conectar Chave API OpenAI</h2>
        </div>

        <p className="text-sm text-gray-600 mb-5">
          Cole sua chave API pessoal da OpenAI (começando com "sk-") abaixo. Ela será armazenada de forma segura e usada para interações com a IA.
        </p>

        {/* Mostra status da chave conectada SE ela existir */}
        {initialMaskedKey && !apiKeyInput && ( // Mostra só se não estiver digitando uma nova
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700 flex items-center">
            <CheckCircle size={16} className="mr-2 flex-shrink-0" />
            Chave conectada: <code className="ml-1 font-mono">{initialMaskedKey}</code>
            {/* TODO: Adicionar botão para desativar/excluir chave? */}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="apiKeyInput" className="block text-sm font-medium text-gray-700 mb-1">
            Sua Chave API OpenAI
          </label>
          <input
            id="apiKeyInput"
            type="password" // Mantém como password por segurança
            value={apiKeyInput}
            onChange={handleInputChange}
            placeholder={initialMaskedKey ? "Digite para substituir a chave existente" : "sk-..."}
            className={`w-full border rounded-md p-2 focus:outline-none focus:ring-2 ${
              error
                ? 'border-red-500 ring-red-500' // Estilo de erro
                : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500' // Estilo normal/foco
            }`}
            aria-invalid={!!error}
            aria-describedby={error ? "api-key-error" : undefined}
            disabled={isSaving} // Desabilita input durante o salvamento
          />
          {error && (
            <p id="api-key-error" className="text-xs text-red-600 mt-1 flex items-center">
              <AlertTriangle size={14} className="mr-1" /> {error}
            </p>
          )}
        </div>

        {/* Link para obter chave (opcional) */}
        <div className="text-xs text-gray-500 mb-4">
          Não tem uma chave? Obtenha uma em{' '}
          <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
            platform.openai.com/api-keys
          </a>
        </div>


        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isSaving} // Desabilita cancelar durante salvamento
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveClick}
            disabled={isSaveDisabled} // Usa a variável combinada
            className={`px-4 py-2 text-white rounded-md text-sm font-medium flex items-center justify-center min-w-[100px] ${ // Aumenta min-width
              isSaveDisabled
                ? 'bg-indigo-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            } transition-colors duration-200`}
          >
            {isSaving ? (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : showSuccess ? (
               <CheckCircle size={16} /> // Mostra check de sucesso
            ) : (
              'Salvar Chave'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
