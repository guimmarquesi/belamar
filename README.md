# Belamar — campanha compartilhada

Aplicação web da campanha de RPG de Belamar, com autenticação, papéis de acesso e dados compartilhados em tempo real.

O projeto não depende do banco do Lovable. O frontend usa React + TanStack Start e o backend é um projeto Supabase externo, versionado em `supabase/migrations`.

## Funcionalidades

- Cadastro e login por e-mail e senha.
- Campanhas compartilhadas.
- Papéis de **Mestre**, **Jogador** e **Convidado**.
- Convites por link com limite de usos.
- Sincronização Realtime de:
  - quests;
  - poções;
  - bolsa e moedas;
  - NPCs;
  - participantes da campanha.
- Importação idempotente dos dados antigos do navegador.
- Exportação e importação de backup JSON para atravessar mudanças de domínio.
- RLS no banco: convidado é somente leitura; operações narrativas sensíveis são exclusivas do Mestre.

## Requisitos

- Node.js 22 ou Bun atual.
- Um projeto Supabase com as migrações desta pasta aplicadas.

## Configuração

Copie `.env.example` para `.env`:

```bash
cp .env.example .env
```

Preencha somente credenciais públicas do frontend:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Nunca coloque `service_role` em variáveis `VITE_*`.

O código contém um fallback explícito para o projeto Supabase já criado para Belamar, de forma que o preview atual funcione mesmo sem `.env`. Para outro banco, use as variáveis acima.

## Desenvolvimento

Com Bun:

```bash
bun install --frozen-lockfile
bun run dev
```

Com npm:

```bash
npm install
npm run dev
```

A aplicação abre em `http://localhost:8080`.

## Validação

```bash
npm run typecheck
npm run lint
npm run build
```

Ou tudo de uma vez:

```bash
npm run check
```

O workflow `.github/workflows/ci.yml` executa essas verificações em cada push e pull request.

## Banco de dados

As migrações ficam em `supabase/migrations` e espelham o banco externo usado pelo app. Elas criam:

- perfis vinculados a `auth.users`;
- campanhas e participantes;
- personagens, itens, NPCs, poções, quests e marcadores;
- documentos compartilhados;
- convites;
- políticas RLS;
- publicação Realtime.

No projeto Supabase já configurado para Belamar, essas migrações já foram aplicadas. Os arquivos existem para manter o GitHub como fonte de verdade e permitir reconstruir o banco em outro projeto.

## Migração dos dados antigos

O Mestre recebe a opção **Importar dados deste navegador** quando houver conteúdo legado no `localStorage`.

Como o armazenamento do navegador é separado por domínio:

1. No domínio antigo, abra o painel da engrenagem e clique em **Backup local**.
2. No domínio novo, entre como Mestre, abra a engrenagem e clique em **Importar JSON**.
3. Selecione o arquivo e confirme a importação para a campanha.

A importação não apaga o backup local e só marca a migração como concluída após todas as operações terminarem sem erro.

## O que ainda usa armazenamento local

Nesta etapa, quests, poções, bolsa/moedas e NPCs estão no Supabase. Os módulos abaixo ainda mantêm sua interface original em `localStorage`, embora seus dados possam ser copiados para o banco pelo importador:

- catálogo e atribuição de itens;
- notas de sessão e categorias;
- objetivos, status e notas do grupo;
- clima;
- edição dos marcadores do mapa.

Consulte `docs/IMPLEMENTATION_STATUS.md` para o inventário técnico.

## Deploy

O projeto mantém a configuração oficial de Vite/TanStack Start para Cloudflare Workers em `vite.config.ts` e `wrangler.jsonc`.

Depois de um build aprovado, configure as variáveis públicas no ambiente de hospedagem e publique o Worker. O domínio usado em produção deve ser incluído nas URLs de redirecionamento permitidas do Supabase Auth.
