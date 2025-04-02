# GPT Builder MicroSaaS – PRD Atualizado com Base Completa

## Visão Geral
Plataforma web que permite a criação e publicação de assistentes personalizados com inteligência artificial. Esses assistentes podem ser utilizados como interfaces conversacionais, sistemas de apoio ao cliente, consultores de conteúdo ou interfaces de microaplicações. O foco está em facilitar o uso para criadores independentes, com possibilidade de trabalho em times simples, onde o usuário principal pode adicionar e gerenciar subusuários sob sua própria conta, mantendo controle total dos dados e permissões.

## Perfis de Usuário
- **Usuário Proprietário (Owner)**: É o criador da conta principal. Pode criar múltiplos projetos, bots, bases de conhecimento e gerenciar permissões de seus subusuários.
- **Subusuário (Membro do Time)**: Conta vinculada ao usuário proprietário por meio de um `owner_id`. Pode interagir com bots e projetos conforme permissões definidas pelo proprietário. Não possui acesso a projetos de outros proprietários.

## Autenticação e Sessões
- Sistema de autenticação fornecido pela Supabase (Auth), via e-mail e senha.
- Sessões persistidas no `localStorage`, com verificação automática da sessão ativa.
- O `auth.uid()` é a chave principal de identificação do usuário em todas as tabelas.
- O campo `owner_id` define a quem pertence um dado recurso (mesmo quando criado por subusuário).

## Funcionalidades Principais
- Criar, editar, clonar e deletar assistentes (bots) personalizados.
- Treinar assistentes com fontes variadas: upload de arquivos, inserção manual de conteúdo, links e integrações.
- Gerenciar diferentes tipos de conhecimento (documentos, coleções, categorias).
- Configurar comportamentos dos bots (temperatura, tom de voz, persona, etc).
- Criar, salvar e reaproveitar prompts personalizados.
- Configurar regras de ativação e uso do assistente (público/privado, embed, API).
- Acompanhar histórico de conversas e interações com os bots.
- Exportar e importar configurações dos assistentes.
- Gerenciar subusuários: adicionar, remover e controlar permissões básicas por projeto.

## Estrutura de Dados
- O banco utiliza uma estrutura relacional em PostgreSQL com o Supabase.
- Todas as entidades principais (bots, mensagens, coleções, fontes, prompts, sessões) possuem uma coluna `owner_id` vinculada ao `auth.uid()` do proprietário da conta.
- Os subusuários também possuem `user_id` próprio, mas todos os recursos criados ficam vinculados ao `owner_id`.
- As tabelas aplicam RLS (Row Level Security) com policies de acesso baseadas em `auth.uid()` e `owner_id`.
- Suporte a enumerações, tabelas auxiliares e campos JSON para garantir flexibilidade sem comprometer a integridade.

## Regras de Segurança (RLS e Policies)
- Todas as tabelas aplicam políticas de segurança (RLS) que garantem acesso ao usuário logado e ao dono da conta (em caso de subusuário).
- As políticas seguem o padrão:
  ```sql
  CREATE POLICY "Usuário acessa dados próprios ou do owner"
  ON tabela
  FOR ALL
  USING (auth.uid() = user_id OR auth.uid() = owner_id);
  ```
- As tabelas que envolvem ações (ex: sessões, mensagens) aplicam controle adicional de integridade por função e contexto.

## Integração com o Bolt
- O Bolt deve se autenticar com a `anon key` da Supabase e manter sessões válidas do Supabase Auth para operar.
- Toda ação no banco deve passar pelo contexto do usuário logado, identificado por `auth.uid()`.
- O Bolt deve identificar quando o usuário logado é um subusuário e garantir que as ações afetem corretamente os dados vinculados ao `owner_id`.
- Requisições devem prever possíveis erros causados por RLS e tratar de forma adequada.
- O Bolt pode ler um schema JSON para entender dinamicamente a estrutura das tabelas e construir ações seguras e contextuais.
- A lógica de frontend (ou fluxo automatizado) deve se adaptar aos metadados do schema + PRD.

## Comportamento Esperado
- O proprietário da conta pode acessar, gerenciar e excluir todos os dados vinculados à sua conta, incluindo os criados por subusuários.
- Subusuários só acessam e interagem com dados do `owner_id` ao qual estão vinculados.
- A plataforma é expansível, com suporte futuro a APIs, webhooks, automações e integração com ferramentas externas.

## Considerações Finais
Este PRD define uma base sólida para uma aplicação SaaS voltada a criadores individuais que desejam contar com apoio colaborativo. A estrutura de subusuários sob gestão do proprietário permite controle, simplicidade e segurança, mantendo o sistema leve e escalável. O banco pode evoluir com novas permissões ou perfis, desde que preserve a lógica de vinculação por `owner_id` e o controle centralizado pelo dono da conta.
