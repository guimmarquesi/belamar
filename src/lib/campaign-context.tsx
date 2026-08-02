/**
 * Campanha ativa: carrega as campanhas do usuário, aceita convites via
 * `?invite=<uuid>` e expõe o papel (`campaign_members.role`).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CampaignRow, MemberRole } from "@/lib/database.types";
import {
  acceptInvite,
  createCampaign as createCampaignRow,
  fetchMembers,
  fetchMyCampaigns,
} from "@/lib/campaign-data";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

export type CampaignMemberView = {
  user_id: string;
  role: MemberRole;
  joined_at: string;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
};

type CampaignValue = {
  loading: boolean;
  campaign: CampaignRow | null;
  campaignId: string | null;
  campaigns: { campaign: CampaignRow; role: MemberRole }[];
  role: MemberRole | null;
  isMaster: boolean;
  members: CampaignMemberView[];
  error: string | null;
  pendingInvite: string | null;
  createCampaign: (name?: string) => Promise<void>;
  joinWithInvite: (token: string) => Promise<void>;
  selectCampaign: (id: string) => void;
  refresh: () => Promise<void>;
};

const CampaignContext = createContext<CampaignValue | null>(null);

function inviteFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const token = new URLSearchParams(window.location.search).get("invite");
  return token && token.trim() ? token.trim() : null;
}

function clearInviteFromUrl() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("invite");
  window.history.replaceState({}, "", url.toString());
}

export function CampaignProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<{ campaign: CampaignRow; role: MemberRole }[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [members, setMembers] = useState<CampaignMemberView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingInvite, setPendingInvite] = useState<string | null>(null);

  const load = useCallback(
    async (preferId?: string) => {
      if (!user) {
        setCampaigns([]);
        setActiveId(null);
        setLoading(false);
        return [];
      }
      const list = await fetchMyCampaigns(user.id);
      setCampaigns(list);
      setActiveId((current) => {
        const wanted = preferId ?? current;
        if (wanted && list.some((c) => c.campaign.id === wanted)) return wanted;
        return list[0]?.campaign.id ?? null;
      });
      setLoading(false);
      return list;
    },
    [user],
  );

  // Convite na URL: aceita automaticamente após login.
  useEffect(() => {
    if (!user) {
      setLoading(false);
      setPendingInvite(inviteFromUrl());
      return;
    }
    let alive = true;
    setLoading(true);

    void (async () => {
      const token = inviteFromUrl();
      let preferId: string | undefined;
      if (token) {
        try {
          preferId = await acceptInvite(token);
          clearInviteFromUrl();
          setPendingInvite(null);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Convite inválido ou expirado.");
          setPendingInvite(token);
        }
      }
      if (alive) await load(preferId);
    })();

    return () => {
      alive = false;
    };
  }, [user, load]);

  useEffect(() => {
    if (!activeId) {
      setMembers([]);
      return;
    }
    let alive = true;
    const reloadMembers = async () => {
      const list = await fetchMembers(activeId);
      if (alive) setMembers(list);
    };
    void reloadMembers();

    const channel = supabase
      .channel(`belamar:members:${activeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "campaign_members",
          filter: `campaign_id=eq.${activeId}`,
        },
        () => {
          void reloadMembers();
          void load(activeId);
        },
      )
      .subscribe();

    return () => {
      alive = false;
      void supabase.removeChannel(channel);
    };
  }, [activeId, load]);

  const createCampaign = useCallback(
    async (name = "Belamar") => {
      if (!user) return;
      setError(null);
      try {
        const created = await createCampaignRow(user.id, name);
        await load(created.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível criar a campanha.");
        throw err;
      }
    },
    [user, load],
  );

  const joinWithInvite = useCallback(
    async (token: string) => {
      setError(null);
      try {
        const campaignId = await acceptInvite(token.trim());
        clearInviteFromUrl();
        setPendingInvite(null);
        await load(campaignId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Convite inválido ou expirado.");
        throw err;
      }
    },
    [load],
  );

  const value = useMemo<CampaignValue>(() => {
    const active = campaigns.find((c) => c.campaign.id === activeId) ?? null;
    return {
      loading,
      campaign: active?.campaign ?? null,
      campaignId: active?.campaign.id ?? null,
      campaigns,
      role: active?.role ?? null,
      isMaster: active?.role === "master",
      members,
      error,
      pendingInvite,
      createCampaign,
      joinWithInvite,
      selectCampaign: setActiveId,
      refresh: async () => {
        await load();
      },
    };
  }, [
    loading,
    campaigns,
    activeId,
    members,
    error,
    pendingInvite,
    createCampaign,
    joinWithInvite,
    load,
  ]);

  return <CampaignContext.Provider value={value}>{children}</CampaignContext.Provider>;
}

export function useCampaign(): CampaignValue {
  const ctx = useContext(CampaignContext);
  if (!ctx) throw new Error("useCampaign deve ser usado dentro de <CampaignProvider>");
  return ctx;
}
