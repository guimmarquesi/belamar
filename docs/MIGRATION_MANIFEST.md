# Belamar — Manifesto de Migração (Etapa 1)

Documento técnico de inventário para migrar o projeto fora da plataforma Lovable.
Nenhum comportamento, visual, texto, dado inicial ou asset foi alterado nesta etapa.

## 1. Chaves de `localStorage`

Todas as chaves usam o prefixo `belamar` (duas convenções coexistem: `belamar.*` e `belamar:*`).

| Chave                        | Formato       | Origem                                        | Conteúdo                              |
| ---------------------------- | ------------- | --------------------------------------------- | ------------------------------------- |
| `belamar.session-notes`       | JSON (array)  | `src/routes/index.tsx`                        | Notas da sessão                       |
| `belamar.category-notes`      | JSON (objeto) | `src/routes/index.tsx`                        | Notas por categoria                   |
| `belamar.quests`              | JSON (array)  | `src/lib/quests-store.ts`                     | Missões                               |
| `belamar.potions`             | JSON (array)  | `src/lib/potions-store.ts`                    | Poções                                |
| `belamar.potions.seeded.v1`   | `"1"`         | `src/lib/potions-store.ts`                    | Flag de seed inicial das poções       |
| `belamar.custom-items`        | JSON (array)  | `src/lib/items-store.ts`                      | Itens criados pelo usuário            |
| `belamar.item-owners`         | JSON (objeto) | `src/lib/items-store.ts`                      | Mapa item → dono                      |
| `belamar.hidden-items`        | JSON (array)  | `src/lib/items-store.ts`                      | Itens ocultados                       |
| `belamar.bag`                 | JSON (array)  | `src/lib/bag-store.ts`                        | Conteúdo da bolsa                     |
| `belamar.bag.coins`           | JSON (objeto) | `src/lib/bag-store.ts`                        | Moedas                                |
| `belamar.custom-npcs`         | JSON (array)  | `src/lib/npcs-store.ts`, `NpcsPanel.tsx`      | NPCs criados pelo usuário             |
| `belamar.custom-markers`      | JSON (array)  | `MapDrawer.tsx`, `QuestsPanel.tsx`            | Marcadores do mapa                    |
| `belamar.notes`               | JSON          | `PartyPanel.tsx`                              | Notas do grupo                        |
| `belamar.party-goals`         | JSON          | `PartyPanel.tsx`                              | Objetivos do grupo                    |
| `belamar.party-status`        | JSON          | `PartyPanel.tsx`                              | Status do grupo                       |
| `belamar:weather`             | string        | `WeatherControl.tsx`                          | Clima escolhido manualmente           |
| `belamar:weather-auto`        | JSON (objeto) | `WorldHub.tsx`                                | Cache do clima automático             |
| `belamar:weather-auto-ts`     | número (str)  | `WorldHub.tsx`                                | Timestamp do cache de clima           |

Exportação em JSON de todas essas chaves: `src/lib/legacy-export.ts`.

## 2. Stores e módulos de domínio (`src/lib`)

| Arquivo             | Papel                                                          |
| ------------------- | -------------------------------------------------------------- |
| `bag-store.ts`      | Bolsa + moedas (localStorage)                                  |
| `items-store.ts`    | Itens customizados, donos, itens ocultos                       |
| `items.ts`          | Catálogo estático de itens (dados iniciais)                    |
| `npcs-store.ts`     | NPCs customizados                                              |
| `npcs.ts`           | Catálogo estático de NPCs                                      |
| `potions-store.ts`  | Poções + seed inicial versionado                               |
| `quests-store.ts`   | Missões                                                        |
| `party.ts`          | Dados do grupo (estático)                                      |
| `lore.ts`           | Lore / textos do mundo (estático)                              |
| `map.ts`            | Regiões e hotspots do mapa (estático)                          |
| `error-capture.ts`  | Captura de erros globais para o wrapper SSR                    |
| `error-page.ts`     | HTML de erro 500 autocontido                                   |
| `utils.ts`          | `cn()` (clsx + tailwind-merge)                                 |
| `supabase.ts`       | **Novo** — cliente Supabase opcional (sem quebrar sem env)     |
| `legacy-export.ts`  | **Novo** — exportação JSON das chaves `belamar.*` / `belamar:*` |

Componentes de UI: `src/components/*` (+ `src/components/ui` — shadcn/ui). Hook: `src/hooks/use-mobile.tsx`.

## 3. Assets (`src/assets`)

```
belamar-map.jpg
hud-reference.png
parchment.jpg
wood-bg.jpg
engravings/bolsa.png, faccoes.png, grupo.png, itens.png, misterios.png, npcs.png, pocoes.png, quests.png
party/bandolim.png, dread-moore.jpeg, enoque.jpeg, huang.jpeg, rust.jpeg
scene/parchment-envelope.png, scroll-banner.png, table-bg.jpg, wax-seal.png
```

Todos importados como assets do Vite (ES import) — nenhum removido ou renomeado.

## 4. Configuração atual

| Item              | Valor                                                                              |
| ----------------- | ---------------------------------------------------------------------------------- |
| Build tool        | Vite 7                                                                             |
| Framework         | TanStack Start v1 (SSR) + TanStack Router (file-based em `src/routes`)              |
| UI                | React 19, Tailwind CSS v4 (via `src/styles.css`), shadcn/ui, lucide-react           |
| Dados             | TanStack Query (client) + `localStorage`                                            |
| Runtime de deploy | Cloudflare Workers (`wrangler.jsonc`, `main: src/server.ts`, `nodejs_compat`)       |
| Entry SSR         | `src/server.ts` (wrapper de erro) — apontado via `tanstackStart({ server:{entry} })`|
| Middleware        | `src/start.ts` (`errorMiddleware` em `requestMiddleware`)                           |
| Router            | `src/router.tsx` (`getRouter()`), árvore gerada em `src/routeTree.gen.ts`            |
| Alias             | `@/*` → `./src/*` (tsconfig + `vite-tsconfig-paths` + alias explícito)              |
| CSS transformer   | lightningcss                                                                        |
| Dev server        | host `::`, porta 8080, `strictPort`                                                 |

Vite config: `vite.config.ts` usa plugins oficiais — `@tailwindcss/vite`,
`vite-tsconfig-paths`, `@tanstack/react-start/plugin/vite`, `@vitejs/plugin-react`,
`@cloudflare/vite-plugin` (somente em `build`).

## 5. Dependências do Lovable

| Dependência                          | Status                                                                 |
| ------------------------------------ | ---------------------------------------------------------------------- |
| `@lovable.dev/vite-tanstack-config`  | **Removida** nesta etapa; substituída por config oficial equivalente.  |
| `@lovable.dev/vite-plugin-hmr-gate`  | Carregada apenas pelo pacote acima (sandbox) — não é mais usada.       |
| `@lovable.dev/vite-plugin-dev-server-bridge` | Idem.                                                          |
| `nitro` (preset cloudflare-module)   | Era usado pelo wrapper Lovable; agora o build usa `@cloudflare/vite-plugin`. Pacote mantido em `dependencies` para não alterar o lockfile além do necessário. |
| Lovable Cloud / Supabase gerenciado  | **Não habilitado.** O cliente em `src/lib/supabase.ts` depende só de env vars. |

Nenhum código de aplicação dependia de APIs Lovable em runtime.

## 6. Variáveis de ambiente

Ver `.env.example`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Somente variáveis `VITE_*` chegam ao cliente. Segredos devem ficar no servidor
(`process.env`, lidos dentro de handlers).

## 7. Comandos

| Comando            | Ação                                        |
| ------------------ | ------------------------------------------- |
| `npm install`      | Instala dependências                        |
| `npm run dev`      | Dev server em `http://localhost:8080`       |
| `npm run build`    | Build de produção (client + Worker SSR)     |
| `npm run build:dev`| Build em modo development                   |
| `npm run preview`  | Preview do build                            |
| `npm run lint`     | ESLint                                      |
| `npm run format`   | Prettier                                    |

Deploy Cloudflare: `npx wrangler deploy` a partir da saída do build (`wrangler.jsonc`).
