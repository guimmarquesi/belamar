import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { CampaignInviteRow, CampaignRow, CharacterRow, Json, MemberRole } from "./database.types";
import { loadQuests, saveQuests, type Quest } from "./quests-store";
import { loadPotions, savePotions, type Potion } from "./potions-store";
import { loadBag, saveBag, loadCoins, saveCoins, type BagItem, type Coins } from "./bag-store";
import type { NpcRelation } from "./npcs";

const db = supabase as unknown as SupabaseClient;
function warn(scope: string, error: unknown) {
  if (error) console.warn(`[belamar:${scope}]`, error);
}

function useRealtimeReload(table: string, campaignId: string | null, reload: () => Promise<void>) {
  useEffect(() => {
    if (!campaignId) return;

    let channel: RealtimeChannel | null = db
      .channel(`belamar:${table}:${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => void reload(),
      )
      .subscribe();

    return () => {
      if (channel) void db.removeChannel(channel);
      channel = null;
    };
  }, [campaignId, reload, table]);
}

function useDebouncedRemotePersist<T>(
  campaignId: string | null,
  sync: (next: T) => Promise<void>,
  delay = 350,
) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestSync = useRef(sync);
  const pending = useRef<{ value: T; run: (next: T) => Promise<void> } | null>(null);
  latestSync.current = sync;

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const job = pending.current;
    pending.current = null;
    if (job) void job.run(job.value);
  }, []);

  useEffect(() => flush, [campaignId, flush]);

  return useCallback(
    (next: T) => {
      if (!campaignId) return;
      if (timer.current) clearTimeout(timer.current);
      pending.current = { value: next, run: latestSync.current };
      timer.current = setTimeout(flush, delay);
    },
    [campaignId, delay, flush],
  );
}


function usePendingDeletes<T extends { id: string }>(list: T[], scope: string | null) {
  const current = useRef<T[]>(list);
  const pendingDeletes = useRef<Set<string>>(new Set());
  current.current = list;

  useEffect(() => {
    pendingDeletes.current.clear();
  }, [scope]);

  const trackDeletes = useCallback((next: T[]) => {
    const nextIds = new Set(next.map((item) => item.id));
    for (const previous of current.current) {
      if (!nextIds.has(previous.id)) pendingDeletes.current.add(previous.id);
    }
    for (const item of next) pendingDeletes.current.delete(item.id);
  }, []);

  return { pendingDeletes, trackDeletes };
}

export type SyncedNpc = {
  id: string;
  name: string;
  relation: NpcRelation;
  faction?: string;
  lastSeen?: string;
  bond?: string;
  summary?: string;
  sigil?: string;
  accent?: string;
  portrait?: string;
};

export function useSyncedQuests(campaignId: string | null) {
  const [list, setList] = useState<Quest[]>([]);
  const [ready, setReady] = useState(false);
  const { pendingDeletes, trackDeletes } = usePendingDeletes(list, campaignId);

  const reload = useCallback(async () => {
    if (!campaignId) return;
    const { data, error } = await db
      .from("quests")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: true });
    if (error) return warn("quests:load", error);
    setList(
      ((data ?? []) as Record<string, unknown>[]).map((row) => ({
        id: String(row.legacy_id ?? row.id),
        title: String(row.title ?? ""),
        kind: (row.kind as Quest["kind"]) ?? "principal",
        status: (row.status as Quest["status"]) ?? "ativa",
        summary: String(row.summary ?? ""),
        notes: String(row.notes ?? ""),
        linkedMarkerIds: Array.isArray(row.linked_marker_ids)
          ? (row.linked_marker_ids as string[])
          : [],
        createdAt:
          Number(row.legacy_created_at ?? 0) || Date.parse(String(row.created_at ?? Date.now())),
      })),
    );
  }, [campaignId]);

  useEffect(() => {
    setReady(false);
    if (!campaignId) {
      setList(loadQuests());
      setReady(true);
      return;
    }
    void reload().finally(() => setReady(true));
  }, [campaignId, reload]);
  useRealtimeReload("quests", campaignId, reload);

  const sync = useCallback(
    async (next: Quest[]) => {
      if (!campaignId) return;
      const rows = next.map((q) => ({
        campaign_id: campaignId,
        legacy_id: q.id,
        title: q.title,
        kind: q.kind,
        status: q.status,
        summary: q.summary ?? "",
        notes: q.notes ?? "",
        linked_marker_ids: q.linkedMarkerIds,
        legacy_created_at: q.createdAt,
      }));
      if (rows.length) {
        const { error } = await db.from("quests").upsert(rows, {
          onConflict: "campaign_id,legacy_id",
        });
        if (error) return warn("quests:save", error);
      }
      const remove = [...pendingDeletes.current];
      if (remove.length) {
        const { error } = await db
          .from("quests")
          .delete()
          .eq("campaign_id", campaignId)
          .in("legacy_id", remove);
        if (error) return warn("quests:delete", error);
        for (const id of remove) pendingDeletes.current.delete(id);
      }
      await reload();
    },
    [campaignId, pendingDeletes, reload],
  );
  const queueSync = useDebouncedRemotePersist(campaignId, sync);

  const persist = useCallback(
    (next: Quest[]) => {
      trackDeletes(next);
      setList(next);
      if (!campaignId) saveQuests(next);
      else queueSync(next);
    },
    [campaignId, queueSync, trackDeletes],
  );

  return { list, persist, ready, remote: Boolean(campaignId) };
}

export function useSyncedPotions(campaignId: string | null) {
  const [list, setList] = useState<Potion[]>([]);
  const [ready, setReady] = useState(false);
  const { pendingDeletes, trackDeletes } = usePendingDeletes(list, campaignId);

  const reload = useCallback(async () => {
    if (!campaignId) return;
    const { data, error } = await db
      .from("potions")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: true });
    if (error) return warn("potions:load", error);
    setList(
      ((data ?? []) as Record<string, unknown>[]).map((row) => ({
        id: String(row.legacy_id ?? row.id),
        name: String(row.name ?? ""),
        effect: String(row.effect ?? ""),
        rarity: (row.rarity as Potion["rarity"]) ?? "sem",
        count: Number(row.quantity ?? 0),
      })),
    );
  }, [campaignId]);

  useEffect(() => {
    setReady(false);
    if (!campaignId) {
      setList(loadPotions());
      setReady(true);
      return;
    }
    void reload().finally(() => setReady(true));
  }, [campaignId, reload]);
  useRealtimeReload("potions", campaignId, reload);

  const sync = useCallback(
    async (next: Potion[]) => {
      if (!campaignId) return;
      const rows = next.map((p) => ({
        campaign_id: campaignId,
        legacy_id: p.id,
        name: p.name,
        effect: p.effect,
        rarity: p.rarity,
        quantity: p.count,
      }));
      if (rows.length) {
        const { error } = await db.from("potions").upsert(rows, {
          onConflict: "campaign_id,legacy_id",
        });
        if (error) return warn("potions:save", error);
      }
      const remove = [...pendingDeletes.current];
      if (remove.length) {
        const { error } = await db
          .from("potions")
          .delete()
          .eq("campaign_id", campaignId)
          .in("legacy_id", remove);
        if (error) return warn("potions:delete", error);
        for (const id of remove) pendingDeletes.current.delete(id);
      }
      await reload();
    },
    [campaignId, pendingDeletes, reload],
  );
  const queueSync = useDebouncedRemotePersist(campaignId, sync);
  const persist = useCallback(
    (next: Potion[]) => {
      trackDeletes(next);
      setList(next);
      if (!campaignId) savePotions(next);
      else queueSync(next);
    },
    [campaignId, queueSync, trackDeletes],
  );

  return { list, persist, ready, remote: Boolean(campaignId) };
}

export function useSyncedBag(campaignId: string | null) {
  const [list, setList] = useState<BagItem[]>([]);
  const [ready, setReady] = useState(false);
  const { pendingDeletes, trackDeletes } = usePendingDeletes(list, campaignId);

  const reload = useCallback(async () => {
    if (!campaignId) return;
    const { data, error } = await db
      .from("bag_items")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("updated_at", { ascending: true });
    if (error) return warn("bag:load", error);
    setList(
      ((data ?? []) as Record<string, unknown>[]).map((row) => ({
        id: String(row.legacy_id),
        name: String(row.name ?? ""),
        description: String(row.description ?? ""),
        count: Number(row.quantity ?? 0),
      })),
    );
  }, [campaignId]);

  useEffect(() => {
    setReady(false);
    if (!campaignId) {
      setList(loadBag());
      setReady(true);
      return;
    }
    void reload().finally(() => setReady(true));
  }, [campaignId, reload]);
  useRealtimeReload("bag_items", campaignId, reload);

  const sync = useCallback(
    async (next: BagItem[]) => {
      if (!campaignId) return;
      if (next.length) {
        const { error } = await db.from("bag_items").upsert(
          next.map((item) => ({
            campaign_id: campaignId,
            legacy_id: item.id,
            name: item.name,
            description: item.description,
            quantity: item.count,
          })),
          { onConflict: "campaign_id,legacy_id" },
        );
        if (error) return warn("bag:save", error);
      }
      const remove = [...pendingDeletes.current];
      if (remove.length) {
        const { error } = await db
          .from("bag_items")
          .delete()
          .eq("campaign_id", campaignId)
          .in("legacy_id", remove);
        if (error) return warn("bag:delete", error);
        for (const id of remove) pendingDeletes.current.delete(id);
      }
      await reload();
    },
    [campaignId, pendingDeletes, reload],
  );
  const queueSync = useDebouncedRemotePersist(campaignId, sync);
  const persist = useCallback(
    (next: BagItem[]) => {
      trackDeletes(next);
      setList(next);
      if (!campaignId) saveBag(next);
      else queueSync(next);
    },
    [campaignId, queueSync, trackDeletes],
  );

  return { list, persist, ready, remote: Boolean(campaignId) };
}

export function useSyncedCoins(campaignId: string | null) {
  const [coins, setCoins] = useState<Coins>({ gold: 0, silver: 0, bronze: 0 });

  const reload = useCallback(async () => {
    if (!campaignId) return;
    const { data, error } = await db
      .from("campaign_coins")
      .select("gold,silver,bronze")
      .eq("campaign_id", campaignId)
      .maybeSingle();
    if (error) return warn("coins:load", error);
    if (data) {
      const row = data as { gold: number; silver: number; bronze: number };
      setCoins({ gold: row.gold, silver: row.silver, bronze: row.bronze });
    }
  }, [campaignId]);

  useEffect(() => {
    if (!campaignId) setCoins(loadCoins());
    else void reload();
  }, [campaignId, reload]);
  useRealtimeReload("campaign_coins", campaignId, reload);

  const sync = useCallback(
    async (next: Coins) => {
      if (!campaignId) return;
      const { error } = await db.from("campaign_coins").upsert(
        { campaign_id: campaignId, ...next },
        { onConflict: "campaign_id" },
      );
      if (error) warn("coins:save", error);
    },
    [campaignId],
  );
  const queueSync = useDebouncedRemotePersist(campaignId, sync, 200);

  const persist = useCallback(
    (next: Coins) => {
      setCoins(next);
      if (!campaignId) saveCoins(next);
      else queueSync(next);
    },
    [campaignId, queueSync],
  );

  return { coins, persist, remote: Boolean(campaignId) };
}

export function useDocument<T extends Json>(campaignId: string | null, key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);

  const reload = useCallback(async () => {
    if (!campaignId) return;
    const { data, error } = await db
      .from("campaign_documents")
      .select("value")
      .eq("campaign_id", campaignId)
      .eq("key", key)
      .maybeSingle();
    if (error) return warn(`document:${key}:load`, error);
    if (data && "value" in data) setValue((data as { value: T }).value);
  }, [campaignId, key]);

  useEffect(() => {
    if (campaignId) void reload();
  }, [campaignId, reload]);
  useRealtimeReload("campaign_documents", campaignId, reload);

  const sync = useCallback(
    async (next: T) => {
      if (!campaignId) return;
      const { error } = await db.from("campaign_documents").upsert(
        { campaign_id: campaignId, key, value: next },
        { onConflict: "campaign_id,key" },
      );
      if (error) warn(`document:${key}:save`, error);
    },
    [campaignId, key],
  );
  const queueSync = useDebouncedRemotePersist(campaignId, sync);
  const persist = useCallback(
    (next: T) => {
      setValue(next);
      queueSync(next);
    },
    [queueSync],
  );

  return { value, persist };
}

export function useSyncedNpcs(campaignId: string | null, localFallback: () => SyncedNpc[]) {
  const [base, setBase] = useState<SyncedNpc[]>([]);
  const [ready, setReady] = useState(false);
  const { pendingDeletes, trackDeletes } = usePendingDeletes(base, campaignId);
  const extras = useDocument<Record<string, { lastSeen?: string; bond?: string }>>(
    campaignId,
    "npcs.extras",
    {},
  );

  const reload = useCallback(async () => {
    if (!campaignId) return;
    const { data, error } = await db
      .from("npcs")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: true });
    if (error) return warn("npcs:load", error);
    setBase(
      ((data ?? []) as Record<string, unknown>[]).map((row) => ({
        id: String(row.legacy_id ?? row.id),
        name: String(row.name ?? ""),
        relation: (row.relation as NpcRelation) ?? "desconhecido",
        faction: row.faction ? String(row.faction) : undefined,
        summary: row.summary ? String(row.summary) : undefined,
        sigil: row.sigil ? String(row.sigil) : undefined,
        accent: row.accent ? String(row.accent) : undefined,
        portrait: row.portrait_url ? String(row.portrait_url) : undefined,
      })),
    );
  }, [campaignId]);

  useEffect(() => {
    setReady(false);
    if (!campaignId) {
      setBase(localFallback());
      setReady(true);
      return;
    }
    void reload().finally(() => setReady(true));
  }, [campaignId, localFallback, reload]);
  useRealtimeReload("npcs", campaignId, reload);

  const list = base.map((npc) => ({ ...npc, ...(extras.value[npc.id] ?? {}) }));

  const sync = useCallback(
    async (next: SyncedNpc[]) => {
      if (!campaignId) return;
      const rows = next.map((npc) => ({
        campaign_id: campaignId,
        legacy_id: npc.id,
        name: npc.name,
        relation: npc.relation,
        faction: npc.faction ?? null,
        portrait_url: npc.portrait ?? null,
        summary: npc.summary ?? null,
        accent: npc.accent ?? null,
        sigil: npc.sigil ?? null,
      }));
      if (rows.length) {
        const { error } = await db.from("npcs").upsert(rows, {
          onConflict: "campaign_id,legacy_id",
        });
        if (error) return warn("npcs:save", error);
      }
      const remove = [...pendingDeletes.current];
      if (remove.length) {
        const { error } = await db
          .from("npcs")
          .delete()
          .eq("campaign_id", campaignId)
          .in("legacy_id", remove);
        if (error) return warn("npcs:delete", error);
        for (const id of remove) pendingDeletes.current.delete(id);
      }
      await reload();
    },
    [campaignId, pendingDeletes, reload],
  );
  const queueSync = useDebouncedRemotePersist(campaignId, sync);

  const persist = useCallback(
    (next: SyncedNpc[]) => {
      trackDeletes(next);
      if (!campaignId) {
        setBase(next);
        localStorage.setItem("belamar.custom-npcs", JSON.stringify(next));
        return;
      }
      setBase(next.map(({ lastSeen: _lastSeen, bond: _bond, ...npc }) => npc));
      const nextExtras: Record<string, { lastSeen?: string; bond?: string }> = {};
      for (const npc of next) {
        if (npc.lastSeen || npc.bond) {
          nextExtras[npc.id] = { lastSeen: npc.lastSeen, bond: npc.bond };
        }
      }
      extras.persist(nextExtras);
      queueSync(next);
    },
    [campaignId, extras, queueSync, trackDeletes],
  );

  return { list, persist, ready, remote: Boolean(campaignId) };
}

export async function fetchMyCampaigns(userId: string): Promise<{ campaign: CampaignRow; role: MemberRole }[]> {
  const { data: memberships, error } = await db
    .from("campaign_members")
    .select("campaign_id,role")
    .eq("user_id", userId)
    .order("joined_at", { ascending: true });
  if (error) {
    warn("campaigns:memberships", error);
    return [];
  }
  const memberRows = (memberships ?? []) as { campaign_id: string; role: MemberRole }[];
  if (!memberRows.length) return [];

  const { data: campaigns, error: campaignsError } = await db
    .from("campaigns")
    .select("*")
    .in(
      "id",
      memberRows.map((row) => row.campaign_id),
    );
  if (campaignsError) {
    warn("campaigns:load", campaignsError);
    return [];
  }
  const byId = new Map(
    ((campaigns ?? []) as CampaignRow[]).map((campaign) => [campaign.id, campaign] as const),
  );
  return memberRows.flatMap((membership) => {
    const campaign = byId.get(membership.campaign_id);
    return campaign ? [{ campaign, role: membership.role }] : [];
  });
}

export type OpenCampaignCharacter = Pick<CharacterRow, "id" | "name" | "owner_id" | "data">;

export async function fetchOpenCampaigns(): Promise<
  { campaign: CampaignRow; characters: OpenCampaignCharacter[] }[]
> {
  const { data: campaigns, error } = await db
    .from("campaigns")
    .select("*")
    .eq("is_open", true)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const rows = (campaigns ?? []) as CampaignRow[];
  if (!rows.length) return [];
  const { data: characters, error: characterError } = await db
    .from("characters")
    .select("id,name,owner_id,data,campaign_id")
    .in("campaign_id", rows.map((campaign) => campaign.id))
    .order("created_at", { ascending: true });
  if (characterError) throw characterError;

  const characterRows = (characters ?? []) as (OpenCampaignCharacter & { campaign_id: string })[];
  return rows.map((campaign) => ({
    campaign,
    characters: characterRows.filter((character) => character.campaign_id === campaign.id),
  }));
}

export async function joinOpenCampaign(options: {
  campaignId: string;
  role: Extract<MemberRole, "master" | "player">;
  characterIds: string[];
}): Promise<string> {
  const { data, error } = await db.rpc("join_open_campaign", {
    target_campaign: options.campaignId,
    selected_role: options.role,
    selected_characters: options.characterIds,
  });
  if (error) throw error;
  return String(data);
}

export async function fetchCampaignCharacters(campaignId: string): Promise<OpenCampaignCharacter[]> {
  const { data, error } = await db.from("characters").select("id,name,owner_id,data").eq("campaign_id", campaignId).order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as OpenCampaignCharacter[];
}

export async function setMyCharacters(campaignId: string, characterIds: string[]): Promise<void> {
  const { error } = await db.rpc("set_my_characters", { target_campaign: campaignId, selected_characters: characterIds });
  if (error) throw error;
}

export async function fetchMembers(campaignId: string) {
  const { data, error } = await db
    .from("campaign_members")
    .select("user_id,role,joined_at")
    .eq("campaign_id", campaignId);
  if (error) {
    warn("members:load", error);
    return [];
  }
  const members = (data ?? []) as { user_id: string; role: MemberRole; joined_at: string }[];
  if (!members.length) return [];
  const { data: profiles, error: profileError } = await db
    .from("profiles")
    .select("id,display_name,avatar_url")
    .in(
      "id",
      members.map((member) => member.user_id),
    );
  if (profileError) warn("members:profiles", profileError);
  const byId = new Map(
    ((profiles ?? []) as { id: string; display_name: string; avatar_url: string | null }[]).map(
      (profile) => [profile.id, profile] as const,
    ),
  );
  return members.map((member) => ({
    ...member,
    profiles: byId.get(member.user_id) ?? null,
  }));
}

export async function createCampaign(userId: string, name = "Belamar") {
  const suffix = `${userId.replace(/-/g, "").slice(0, 8)}-${Date.now().toString(36)}`;
  const { data, error } = await db
    .from("campaigns")
    .insert({ name, slug: `belamar-${suffix}`, owner_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data as CampaignRow;
}

export async function acceptInvite(token: string): Promise<string> {
  const { data, error } = await db.rpc("accept_campaign_invite", { invite_token: token });
  if (error) throw error;
  return String(data);
}

export async function createInvite(options: {
  campaignId: string;
  role: Exclude<MemberRole, "master">;
  createdBy: string;
  maxUses?: number;
}): Promise<CampaignInviteRow> {
  const { data, error } = await db
    .from("campaign_invites")
    .insert({
      campaign_id: options.campaignId,
      role: options.role,
      created_by: options.createdBy,
      max_uses: options.maxUses ?? 10,
      active: true,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as CampaignInviteRow;
}
