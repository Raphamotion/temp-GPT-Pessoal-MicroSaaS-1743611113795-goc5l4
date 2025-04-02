import React from 'react';
// Importar ícones se necessário, ex: Settings para configurações do Bot/Sessão
// import { Settings } from 'lucide-react';

type HeaderProps = {
  title: string;
};

const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-5">
      <h1 className="text-lg font-semibold text-gray-800 truncate">{title}</h1>
      {/* Adicionar botões de ação aqui, se necessário */}
      {/* Exemplo: Botão para configurações do Bot/Sessão */}
      {/* <button className="p-1 text-gray-500 hover:text-gray-800">
        <Settings size={20} />
      </button> */}
    </div>
  );
};

export default Header;
