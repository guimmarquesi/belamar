/**
 * Migração idempotente dos dados legados de `localStorage` para o Supabase.
 *
 * Nada é apagado do navegador: o localStorage continua intacto como backup.
 * Só depois de todas as operações concluírem gravamos o marcador
 * `belamar.supabase-migrated.<campaignId>`.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./supabase";

const db = supabase as unknown as SupabaseClient;
import type { Json, PotionRarityDb, QuestKindDb, QuestStatusDb } from "./database.types";

export const migratedMarkerKey = (campaignId: string) => `belamar.supabase-migrated.${campaignId}`;

export function isMigrated(campaignId: string): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(migratedMarkerKey(campaignId)) === "1";
}

function markMigrated(campaignId: string) {
  if (typeof window !== "undefined") localStorage.setItem(migratedMarkerKey(campaignId), "1");
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function rawString(key: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
}

export type MigrationReport = {
  ok: boolean;
  counts: Record<string, number>;
  errors: string[];
};

/** Chaves já existentes no banco, para não duplicar (idempotência). */
async function existingLegacyIds(table: string, campaignId: string): Promise<Set<string>> {
  const { data, error } = await db.from(table)
    .select("legacy_id")
    .eq("campaign_id", campaignId);
  if (error) throw error;
  const set = new Set<string>();
  for (const row of (data ?? []) as { legacy_id: string | null }[]) {
    if (row.legacy_id) set.add(row.legacy_id);
  }
  return set;
}

async function insertRows(table: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const { error } = await db.from(table)
    .insert(rows);
  if (error) throw error;
}

/** Importa todos os dados locais para a campanha indicada. */
export async function migrateLocalDataToCampaign(campaignId: string): Promise<MigrationReport> {
  const counts: Record<string, number> = {};
  const errors: string[] = [];

  const step = async (label: string, fn: () => Promise<number>) => {
    try {
      counts[label] = await fn();
    } catch (err) {
      errors.push(`${label}: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  /* ------------------------------------------------------------ bag_items */
  await step("bag_items", async () => {
    const bag = read<{ id: string; name: string; description?: string; count?: number }[]>(
      "belamar.bag",
      [],
    );
    if (!bag.length) return 0;
    const { data, error } = await supabase
      .from("bag_items")
      .select("legacy_id")
      .eq("campaign_id", campaignId);
    if (error) throw error;
    const have = new Set((data ?? []).map((r) => r.legacy_id));
    const rows = bag
      .filter((i) => !have.has(i.id))
      .map((i) => ({
        campaign_id: campaignId,
        legacy_id: i.id,
        name: i.name,
        description: i.description ?? "",
        quantity: i.count ?? 0,
      }));
    await insertRows("bag_items", rows);
    return rows.length;
  });

  /* -------------------------------------------------------- campaign_coins */
  await step("campaign_coins", async () => {
    const coins = read<{ gold?: number; silver?: number; bronze?: number } | null>(
      "belamar.bag.coins",
      null,
    );
    if (!coins) return 0;
    const { error } = await supabase.from("campaign_coins").upsert(
      {
        campaign_id: campaignId,
        gold: coins.gold ?? 0,
        silver: coins.silver ?? 0,
        bronze: coins.bronze ?? 0,
      },
      { onConflict: "campaign_id" },
    );
    if (error) throw error;
    return 1;
  });

  /* ---------------------------------------------------------------- items */
  await step("items", async () => {
    const custom = read<
      { id: string; name: string; rarity?: string; flavor?: string; effect?: string }[]
    >("belamar.custom-items", []);
    const owners = read<Record<string, string>>("belamar.item-owners", {});
    const hidden = read<string[]>("belamar.hidden-items", []);
    const have = await existingLegacyIds("items", campaignId);

    const rows: Record<string, unknown>[] = [];
    for (const item of custom) {
      if (have.has(item.id)) continue;
      rows.push({
        campaign_id: campaignId,
        legacy_id: item.id,
        name: item.name,
        description: item.effect ?? "",
        rarity: item.rarity ?? "comum",
        hidden: false,
        data: { flavor: item.flavor ?? "", owner: owners[item.id] ?? null } as Json,
      });
    }
    // Itens embutidos ocultados/atribuídos ficam registrados como referência.
    const builtinKeys = new Set<string>([...hidden, ...Object.keys(owners)]);
    for (const key of builtinKeys) {
      if (!key.startsWith("builtin:") || have.has(key)) continue;
      rows.push({
        campaign_id: campaignId,
        legacy_id: key,
        name: key.replace("builtin:", ""),
        description: null,
        rarity: null,
        hidden: hidden.includes(key),
        data: { builtin: true, owner: owners[key] ?? null } as Json,
      });
    }
    await insertRows("items", rows);
    return rows.length;
  });

  /* ----------------------------------------------------------------- npcs */
  await step("npcs", async () => {
    const npcs = read<
      {
        id: string;
        name: string;
        relation?: string;
        faction?: string;
        portrait?: string;
        summary?: string;
        accent?: string;
        sigil?: string;
        lastSeen?: string;
        bond?: string;
      }[]
    >("belamar.custom-npcs", []);
    if (!npcs.length) return 0;
    const have = await existingLegacyIds("npcs", campaignId);
    const rows = npcs
      .filter((n) => !have.has(n.id))
      .map((n) => ({
        campaign_id: campaignId,
        legacy_id: n.id,
        name: n.name,
        relation: n.relation ?? "aliado",
        faction: n.faction ?? null,
        portrait_url: n.portrait ?? null,
        summary: n.summary ?? null,
        accent: n.accent ?? null,
        sigil: n.sigil ?? null,
      }));
    await insertRows("npcs", rows);

    // Campos sem coluna própria seguem em campaign_documents.
    const extras: Record<string, { lastSeen?: string; bond?: string }> = {};
    for (const n of npcs) {
      if (n.lastSeen || n.bond) extras[n.id] = { lastSeen: n.lastSeen, bond: n.bond };
    }
    if (Object.keys(extras).length) {
      const { error } = await supabase
        .from("campaign_documents")
        .upsert(
          { campaign_id: campaignId, key: "npcs.extras", value: extras as Json },
          { onConflict: "campaign_id,key" },
        );
      if (error) throw error;
    }
    return rows.length;
  });

  /* -------------------------------------------------------------- potions */
  await step("potions", async () => {
    const potions = read<
      { id: string; name: string; effect?: string; rarity?: string; count?: number }[]
    >("belamar.potions", []);
    if (!potions.length) return 0;
    const have = await existingLegacyIds("potions", campaignId);
    const rows = potions
      .filter((p) => !have.has(p.id))
      .map((p) => ({
        campaign_id: campaignId,
        legacy_id: p.id,
        name: p.name,
        effect: p.effect ?? "",
        rarity: (p.rarity ?? "sem") as PotionRarityDb,
        quantity: p.count ?? 0,
      }));
    await insertRows("potions", rows);
    return rows.length;
  });

  /* --------------------------------------------------------------- quests */
  await step("quests", async () => {
    const quests = read<
      {
        id: string;
        title: string;
        kind?: string;
        status?: string;
        summary?: string;
        notes?: string;
        linkedMarkerIds?: string[];
        createdAt?: number;
      }[]
    >("belamar.quests", []);
    if (!quests.length) return 0;
    const have = await existingLegacyIds("quests", campaignId);
    const rows = quests
      .filter((q) => !have.has(q.id))
      .map((q) => ({
        campaign_id: campaignId,
        legacy_id: q.id,
        title: q.title,
        kind: (q.kind ?? "principal") as QuestKindDb,
        status: (q.status ?? "ativa") as QuestStatusDb,
        summary: q.summary ?? "",
        notes: q.notes ?? "",
        linked_marker_ids: q.linkedMarkerIds ?? [],
        legacy_created_at: q.createdAt ?? Date.now(),
      }));
    await insertRows("quests", rows);
    return rows.length;
  });

  /* ---------------------------------------------------------- map_markers */
  await step("map_markers", async () => {
    const markers = read<
      { id: string; name: string; x?: number; y?: number; type?: string; district?: string }[]
    >("belamar.custom-markers", []);
    if (!markers.length) return 0;
    const have = await existingLegacyIds("map_markers", campaignId);
    const rows = markers
      .filter((m) => !have.has(m.id))
      .map((m) => ({
        campaign_id: campaignId,
        legacy_id: m.id,
        name: m.name,
        x: m.x ?? 0,
        y: m.y ?? 0,
        marker_type: m.type ?? null,
        data: m as unknown as Json,
      }));
    await insertRows("map_markers", rows);
    return rows.length;
  });

  /* --------------------------------------------------- campaign_documents */
  await step("campaign_documents", async () => {
    const docKeys = [
      "belamar.session-notes",
      "belamar.category-notes",
      "belamar.notes",
      "belamar.party-goals",
      "belamar.party-status",
      "belamar:weather",
      "belamar:weather-auto",
    ];
    const rows: { campaign_id: string; key: string; value: Json }[] = [];
    for (const key of docKeys) {
      const raw = rawString(key);
      if (raw === null) continue;
      let value: Json;
      try {
        value = JSON.parse(raw) as Json;
      } catch {
        value = raw;
      }
      rows.push({ campaign_id: campaignId, key, value });
    }
    if (!rows.length) return 0;
    const { error } = await supabase
      .from("campaign_documents")
      .upsert(rows, { onConflict: "campaign_id,key" });
    if (error) throw error;
    return rows.length;
  });

  const ok = errors.length === 0;
  if (ok) markMigrated(campaignId);
  return { ok, counts, errors };
}

/** Existe algum dado legado neste navegador? */
export function hasLegacyData(): boolean {
  if (typeof window === "undefined") return false;
  const keys = [
    "belamar.bag",
    "belamar.bag.coins",
    "belamar.custom-items",
    "belamar.item-owners",
    "belamar.hidden-items",
    "belamar.custom-npcs",
    "belamar.potions",
    "belamar.quests",
    "belamar.custom-markers",
    "belamar.session-notes",
    "belamar.category-notes",
    "belamar.notes",
    "belamar.party-goals",
    "belamar.party-status",
    "belamar:weather",
    "belamar:weather-auto",
  ];
  return keys.some((k) => localStorage.getItem(k) !== null);
}
