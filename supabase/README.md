# Supabase — Belamar

Esta pasta versiona o mesmo esquema aplicado ao projeto Supabase externo de Belamar.

- As migrações incluem autenticação por `auth.users`, campanhas, papéis (`master`, `player`, `guest`), RLS, convites e Realtime.
- O frontend usa somente a URL e uma chave **publishable**. Nunca adicione `service_role` a arquivos `VITE_*`.
- `guest` é somente leitura por RLS; `player` pode alterar bolsa, moedas, itens, poções e documentos compartilhados; operações narrativas sensíveis (NPCs, quests e mapa) são exclusivas do Mestre.
- `campaign_documents.updated_by` é preenchido por trigger a partir de `auth.uid()`.

Para um projeto novo, aplique as migrações na ordem dos nomes dos arquivos.
