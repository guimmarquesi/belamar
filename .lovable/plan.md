Vou refazer o visual da home mantendo 100% da lógica (rotas, drawers, painéis, stores, mapa, quests, etc.). A estrutura de 6 medalhões + pergaminho central + cartucho do mapa + barra inferior **já existe** em `src/routes/index.tsx` — só vou trocar a "pele".

## 1. Fundo: mesa medieval com props

`src/routes/index.tsx` — substituir o fundo atual por uma cena de mesa de madeira com objetos decorativos posicionados como na referência.

- Gerar 1 imagem hero de fundo (madeira escura + vinheta + iluminação quente vinda do topo, sem objetos) → `src/assets/table-bg.jpg`.
- Gerar props transparentes (PNG) posicionados absolute em cantos:
  - canto sup-esq: nota rasgada "O mar guarda segredos antigos."
  - canto sup-centro/esq: vela acesa com castiçal de bronze
  - canto sup-dir: moeda dourada + canto de mapa antigo
  - canto inf-esq: livro de couro fechado + anel
  - lateral esq: pena de corvo + moeda de navio
  - canto inf-dir: caneca de bronze + moedas + chave
- Adicionar partículas de poeira sutis (CSS `@keyframes` simples, ~15 pontos flutuantes) e vinheta escura nas bordas (já tem `.vignette`, reforçar).

## 2. Pergaminho central "BELAMAR"

Substituir o card central retangular atual por um pergaminho envelopado com selo de cera vermelho, exatamente como a imagem:

- Usar `parchment.jpg` (já existe no projeto) com máscara/borda irregular via SVG ou PNG com bordas rasgadas → gerar `src/assets/parchment-envelope.png` (transparente, formato envelope dobrado).
- Sobrepor texto: título **BELAMAR** em Cinzel grande + "CIDADE LIVRE" como subtítulo entre filetes ornamentais.
- Selo de cera vermelho ao centro-inferior do envelope → gerar `src/assets/wax-seal.png` (transparente).
- Pequena rosa-dos-ventos minimalista acima do título (manter `Compass` em estilo gravura).

## 3. Medalhões laterais (6 botões)

Manter os 6 `CATEGORIES` com seus handlers atuais. Trocar o estilo neon por **selos circulares de pergaminho com gravura medieval monocromática**.

- Cada medalhão = círculo com textura de pergaminho + borda decorativa (filetes finos + losangos) + ícone gravura (estilo bico-de-pena, monocromático sépia).
- Substituir os ícones `lucide-react` atuais por gravuras geradas (PNG transparente, ~256×256):
  - `npc-engraving.png` — figura encapuzada
  - `guild-engraving.png` — estandarte com leão
  - `items-engraving.png` — mochila de aventureiro
  - `quests-engraving.png` — pergaminho enrolado
  - `mysteries-engraving.png` — livro com olho
  - `factions-engraving.png` — dois estandartes cruzados
- Posicionamento conforme imagem: 3 à esquerda empilhados (NPCs / Guild / Itens) e 3 à direita (Quests / Mistérios / Facções), alinhados verticalmente nas mesmas alturas que o pergaminho central.
- Label abaixo de cada medalhão em Cinzel, letterspacing alto, cor creme/dourado pálido.
- Hover: leve glow âmbar/dourado quente (sem neon), escala 1.04, sombra mais profunda — como se a luz da vela batesse.
- Mantém `onClick` → abre `SidePanel` com painel atual (PartyPanel, NpcsPanel, QuestsPanel, ItemsList, etc.) — **zero mudança lógica**.

## 4. Cartucho "Mapa de Belamar"

Abaixo do pergaminho central, manter o trigger do `MapDrawer`:

- Pergaminho horizontal estreito com bordas rasgadas (PNG com transparência) → `src/assets/scroll-banner.png`.
- Texto "MAPA DE BELAMAR" + "Explore a cidade, bairros, portos e locais importantes." + ícone de lupa à direita.
- Hover: animação `translateY(-3px)` + sombra mais funda — efeito "o papel levanta".
- `onClick` continua abrindo `MapDrawer` atual (com `focusMarker` etc.).

## 5. Barra inferior

A barra fixa com Notícias / Diário / Anotações / Galeria / Relatórios já existe. Reestilizar como **barra de madeira escura entalhada**:

- Fundo madeira mais escuro, borda superior com filete dourado.
- Ícones em traço fino dourado pálido + label em Cinzel uppercase.
- Hover: brilho âmbar suave + leve elevação.
- Handlers permanecem.

## 6. Tipografia

- Títulos: `Cinzel` (já carregado) — manter, ajustar tracking maior em BELAMAR.
- Texto manuscrito: `IM Fell English` (já carregado).
- Corpo: `Lora` (já carregado).
- Preservar acentuação PT-BR em todos os textos.

## 7. Animações

- Partículas de poeira: `@keyframes dust-drift` em `src/styles.css`.
- Velas piscando: já existe `.flicker`, aplicar ao halo da vela.
- Pergaminho central: leve `float-slow` (já existe).
- Hover dos medalhões: transição 250ms ease-out.
- Parallax discreto no mouse-move (3-5px) apenas nos props decorativos do fundo — `useEffect` leve no `BelamarBoard`.

## 8. Responsividade

- Desktop (atual viewport 847px+): layout 3+3 como na referência.
- Mobile (<768px): props decorativos do fundo somem (ou ficam só vela + livro), medalhões viram grid 2×3 abaixo do pergaminho, cartucho do mapa full-width, barra inferior continua fixa.
- Pergaminho central encolhe proporcionalmente com `clamp()`.

## 9. Arquivos

**Editados:**
- `src/routes/index.tsx` — JSX da home (estrutura mantida, classes/elementos visuais trocados).
- `src/styles.css` — tokens novos (dourados quentes, sépia), keyframes `dust-drift`, utilitários `.engraving`, `.seal-medallion`, `.parchment-card`, `.wood-bar`.

**Criados (assets gerados):**
- `src/assets/table-bg.jpg` (fundo madeira)
- `src/assets/parchment-envelope.png` (pergaminho central)
- `src/assets/wax-seal.png` (selo de cera)
- `src/assets/scroll-banner.png` (cartucho do mapa)
- `src/assets/props/candle.png`, `coin-ship.png`, `coin-gold.png`, `feather.png`, `book.png`, `key.png`, `mug.png`, `map-corner.png`, `ring.png`, `note-torn.png`
- `src/assets/engravings/npc.png`, `guild.png`, `items.png`, `quests.png`, `mysteries.png`, `factions.png`

**Não tocados** (preservados integralmente):
- `MapDrawer`, `QuestsPanel`, `NpcsPanel`, `PartyPanel`, `ItemsList`, `LoreBlock`, todos os stores (`items-store`, `quests-store`), `lib/map.ts`, `lib/quests-store.ts`, rotas, `routeTree.gen.ts`.

## 10. Fora do escopo

- Não mexer em nenhuma lógica de quests/itens/mapa/NPCs.
- Não trocar fontes globais (só ajustar pesos/tracking).
- Não adicionar libs novas (sem framer-motion novo — usar CSS + transitions já disponíveis).
- Backend/cloud: nada.
