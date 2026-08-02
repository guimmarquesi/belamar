# Estado da migração independente

## Implementado

### Identidade e acesso

- `AuthProvider` com sessão Supabase, login, cadastro e logout.
- Tela de entrada no mesmo tema visual de Belamar.
- `CampaignProvider` para selecionar, criar e entrar em campanhas.
- Papéis lidos exclusivamente de `campaign_members.role`.
- Convites por token com limite de usos.
- Painel de conta/Mestre sem desmontar o HUD original.

### Dados compartilhados

| Módulo | Leitura Realtime | Escrita remota | Permissão |
| --- | --- | --- | --- |
| Quests | Sim | Sim | Mestre |
| NPCs | Sim | Sim | Mestre |
| Poções | Sim | Sim | Mestre e Jogador |
| Bolsa | Sim | Sim | Mestre e Jogador |
| Moedas | Sim | Sim | Mestre e Jogador |
| Participantes | Sim | Convite | Mestre |

Convidados recebem acesso somente de leitura também no RLS, não apenas na interface.

### Migração

- Importador idempotente de todas as chaves legadas conhecidas.
- Marcador `belamar.supabase-migrated.<campaignId>` somente após sucesso integral.
- Dados locais não são apagados.
- Backup JSON e restauração entre domínios.

### Segurança

- Nenhuma `service_role` no frontend.
- RLS em todas as tabelas expostas.
- Funções de autorização no schema privado.
- `campaign_documents.updated_by` é preenchido pelo banco a partir de `auth.uid()`.
- Convite não permite conceder papel de Mestre.
- A RPC de convite é `SECURITY DEFINER` por necessidade funcional, com `search_path` fixo, autenticação obrigatória, token bloqueado durante o uso e execução revogada para `anon`/`public`.

## Ainda local na interface

- Itens e atribuição de proprietários.
- Notas de sessão e notas por categoria.
- Notas, objetivos e status do grupo.
- Clima.
- Edição de marcadores do mapa.

O importador já copia esses dados para `items`, `campaign_documents` e `map_markers`; falta substituir as stores visuais desses módulos pela camada remota.

## Arquivos centrais

- `src/lib/supabase.ts`
- `src/lib/database.types.ts`
- `src/lib/auth-context.tsx`
- `src/lib/campaign-context.tsx`
- `src/lib/campaign-data.ts`
- `src/lib/legacy-migration.ts`
- `src/lib/legacy-export.ts`
- `src/components/AuthScreen.tsx`
- `src/components/BelamarGate.tsx`
- `supabase/migrations/*`
