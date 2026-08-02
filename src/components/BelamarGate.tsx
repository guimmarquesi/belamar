import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Check,
  Copy,
  DoorOpen,
  Download,
  Loader2,
  LogOut,
  Settings,
  Shield,
  Upload,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import tableBg from "@/assets/scene/table-bg.jpg";
import parchmentImg from "@/assets/parchment.jpg";
import { AuthScreen } from "@/components/AuthScreen";
import { useAuth } from "@/lib/auth-context";
import { useCampaign } from "@/lib/campaign-context";
import {
  createInvite,
  fetchCampaignCharacters,
  fetchOpenCampaigns,
  setMyCharacters,
  type OpenCampaignCharacter,
} from "@/lib/campaign-data";
import { PARTY } from "@/lib/party";
import {
  hasLegacyData,
  isMigrated,
  migrateLocalDataToCampaign,
  type MigrationReport,
} from "@/lib/legacy-migration";
import type { MemberRole } from "@/lib/database.types";
import { downloadLegacyDataAsJson, restoreLegacyDataFromJson } from "@/lib/legacy-export";

function FullscreenLoading({ label = "Abrindo a crônica..." }: { label?: string }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{
        backgroundImage: `linear-gradient(oklch(0.05 0.01 25 / 0.65), oklch(0.05 0.01 25 / 0.65)), url(${tableBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="flex items-center gap-3 text-[oklch(0.88_0.08_75)]">
        <Loader2 className="size-5 animate-spin" />
        <span className="font-[family-name:var(--font-display)] text-[11px] uppercase tracking-[0.28em]">
          {label}
        </span>
      </div>
    </div>
  );
}

function CampaignOnboarding() {
  const { joinOpenCampaign, error } = useCampaign();
  const [campaign, setCampaign] = useState<Awaited<ReturnType<typeof fetchOpenCampaigns>>[number] | null>(null);
  const [role, setRole] = useState<"master" | "player">("player");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void fetchOpenCampaigns()
      .then((rows) => { if (alive) setCampaign(rows[0] ?? null); })
      .catch((cause) => { if (alive) setLocalError(cause instanceof Error ? cause.message : "Não foi possível abrir a campanha."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const run = async () => {
    if (!campaign) return;
    setBusy(true);
    setLocalError(null);
    try {
      await joinOpenCampaign(campaign.campaign.id, role, selected);
    } catch (cause) {
      setLocalError(cause instanceof Error ? cause.message : "Não foi possível entrar.");
    } finally {
      setBusy(false);
    }
  };

  const guildaMember = (character: OpenCampaignCharacter) => {
    const data = character.data && typeof character.data === "object" && !Array.isArray(character.data)
      ? character.data as Record<string, unknown>
      : {};
    return PARTY.find((member) => member.id === data.guilda_id || member.name === character.name);
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4"
      style={{ backgroundImage: `url(${tableBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="absolute inset-0 bg-black/55" />
      <div
        className="relative w-full max-w-[560px] rounded-md p-7 text-[var(--color-ink)]"
        style={{
          backgroundImage: `url(${parchmentImg})`,
          backgroundSize: "cover",
          border: "1px solid oklch(0.55 0.08 65 / 0.55)",
          boxShadow: "0 28px 70px oklch(0 0 0 / 0.72)",
        }}
      >
        <h1 className="font-[family-name:var(--font-display)] text-xl tracking-[0.24em]">ENTRAR EM BELAMAR</h1>
        <p className="mt-1 font-[family-name:var(--font-script)] italic text-[var(--color-ink)]/70">
          Escolha como vai participar e vincule seus personagens da Guilda.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {(["player", "master"] as const).map((option) => (
            <button key={option} onClick={() => setRole(option)} className={`rounded border p-4 text-left transition ${role === option ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[oklch(0.96_0.04_80)]" : "border-[var(--color-ink)]/20 bg-[oklch(0.96_0.04_80)]/45"}`}>
              <span className="flex items-center gap-2 font-[family-name:var(--font-display)] text-[11px] uppercase tracking-[0.2em]">
                {option === "master" ? <Shield className="size-4" /> : <Users className="size-4" />}
                {option === "master" ? "Sou Mestre" : "Sou Jogador"}
              </span>
              <span className="mt-2 block text-xs opacity-70">{option === "master" ? "Pode ajudar a editar a campanha." : "Participa com seus personagens."}</span>
            </button>
          ))}
        </div>

        <p className="mt-5 font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.2em]">Meus personagens (pode escolher mais de um)</p>
        {loading ? <div className="mt-4 flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin" /> Abrindo a Guilda...</div> : (
          <div className="mt-3 grid max-h-60 gap-2 overflow-auto sm:grid-cols-2">
            {campaign?.characters.map((character) => {
              const member = guildaMember(character);
              const unavailable = Boolean(character.owner_id);
              const checked = selected.includes(character.id);
              return <button key={character.id} type="button" disabled={unavailable} onClick={() => setSelected((current) => checked ? current.filter((id) => id !== character.id) : [...current, character.id])} className={`flex items-center gap-3 rounded border p-2 text-left ${checked ? "border-[var(--color-ink)] bg-[var(--color-ink)]/10" : "border-[var(--color-ink)]/20"} disabled:opacity-45`}>
                {member?.portrait ? <img src={member.portrait} alt="" className="size-10 rounded-full object-cover" /> : <span className="flex size-10 items-center justify-center rounded-full bg-black/10">{character.name[0]}</span>}
                <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{character.name}</strong><small className="block truncate opacity-60">{unavailable ? "Já vinculado" : member?.classLine ?? "Guilda"}</small></span>
                {checked && <Check className="size-4" />}
              </button>;
            })}
          </div>
        )}

        <button onClick={() => void run()} disabled={busy || loading || !campaign} className="mt-5 flex w-full items-center justify-center gap-2 rounded bg-[var(--color-ink)] px-3 py-3 font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.22em] text-[oklch(0.96_0.04_80)] disabled:opacity-50">
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <DoorOpen className="size-3.5" />}
          Entrar como {role === "master" ? "Mestre" : "Jogador"}
        </button>

        {(localError || error) && (
          <p className="mt-4 rounded border border-red-900/25 bg-red-900/10 px-3 py-2 text-sm text-red-950">
            {localError || error}
          </p>
        )}
      </div>
    </div>
  );
}

function copyText(text: string) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const area = document.createElement("textarea");
  area.value = text;
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  area.remove();
  return Promise.resolve();
}

function AccountPanel() {
  const { user, displayName, signOut } = useAuth();
  const {
    campaign,
    campaignId,
    role,
    isMaster,
    members,
    campaigns,
    selectCampaign,
  } = useCampaign();
  const [open, setOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<Exclude<MemberRole, "master">>("player");
  const [creating, setCreating] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [characters, setCharacters] = useState<OpenCampaignCharacter[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [charactersBusy, setCharactersBusy] = useState(false);
  const [charactersNotice, setCharactersNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !campaignId || !user) return;
    let alive = true;
    setCharactersBusy(true);
    void fetchCampaignCharacters(campaignId)
      .then((rows) => {
        if (!alive) return;
        setCharacters(rows);
        setSelectedCharacters(rows.filter((character) => character.owner_id === user.id).map((character) => character.id));
      })
      .catch((cause) => { if (alive) setError(cause instanceof Error ? cause.message : "Não foi possível carregar os personagens."); })
      .finally(() => { if (alive) setCharactersBusy(false); });
    return () => { alive = false; };
  }, [open, campaignId, user]);

  const saveCharacters = async () => {
    if (!campaignId) return;
    setCharactersBusy(true);
    setCharactersNotice(null);
    setError(null);
    try {
      await setMyCharacters(campaignId, selectedCharacters);
      setCharacters(await fetchCampaignCharacters(campaignId));
      setCharactersNotice("Personagens vinculados à sua conta.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível vincular os personagens.");
    } finally {
      setCharactersBusy(false);
    }
  };

  const generate = async () => {
    if (!user || !campaignId) return;
    setCreating(true);
    setError(null);
    try {
      const invite = await createInvite({
        campaignId,
        role: inviteRole,
        createdBy: user.id,
        maxUses: 10,
      });
      const url = new URL(window.location.href);
      url.search = "";
      url.searchParams.set("invite", invite.token);
      setInviteUrl(url.toString());
      await copyText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível gerar o convite.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed right-4 top-[5.3rem] z-[78]">
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-sm border border-[oklch(0.62_0.1_70_/_0.65)] bg-[oklch(0.11_0.02_28_/_0.92)] px-3 py-2 text-[oklch(0.86_0.08_75)] shadow-xl backdrop-blur"
        title="Campanha e conta"
      >
        <Settings className="size-3.5" />
        <span className="hidden font-[family-name:var(--font-display)] text-[9px] uppercase tracking-[0.2em] sm:inline">
          {isMaster ? "Mestre" : role === "guest" ? "Convidado" : "Jogador"}
        </span>
      </button>

      {open && (
        <div
          className="mt-2 w-[min(360px,calc(100vw-2rem))] rounded p-4 text-[var(--color-ink)] shadow-2xl"
          style={{
            backgroundImage: `url(${parchmentImg})`,
            backgroundSize: "cover",
            border: "1px solid oklch(0.55 0.08 65 / 0.6)",
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-[family-name:var(--font-display)] text-[11px] uppercase tracking-[0.22em]">
                {campaign?.name ?? "Campanha"}
              </p>
              <p className="mt-1 text-xs text-[var(--color-ink)]/65">{displayName}</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Fechar"><X className="size-4" /></button>
          </div>

          {campaigns.length > 1 && (
            <select
              value={campaignId ?? ""}
              onChange={(event) => selectCampaign(event.target.value)}
              className="mt-3 w-full rounded border border-[var(--color-ink)]/20 bg-[oklch(0.98_0.02_80)] px-2 py-1.5 text-sm"
            >
              {campaigns.map((entry) => (
                <option key={entry.campaign.id} value={entry.campaign.id}>{entry.campaign.name}</option>
              ))}
            </select>
          )}

          <div className="mt-4 rounded border border-[var(--color-ink)]/15 bg-[oklch(0.96_0.04_80)]/40 p-3">
            <div className="flex items-center justify-between">
              <span className="font-[family-name:var(--font-display)] text-[9px] uppercase tracking-[0.2em]">Participantes</span>
              <span className="text-xs opacity-60">{members.length}</span>
            </div>
            <ul className="mt-2 max-h-24 space-y-1 overflow-auto text-xs">
              {members.map((member) => (
                <li key={member.user_id} className="flex justify-between gap-2">
                  <span className="truncate">{member.profiles?.display_name || "Jogador"}</span>
                  <span className="uppercase opacity-55">{member.role}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 rounded border border-[var(--color-ink)]/15 bg-[oklch(0.96_0.04_80)]/40 p-3">
            <p className="font-[family-name:var(--font-display)] text-[9px] uppercase tracking-[0.2em]">Meus personagens</p>
            <p className="mt-1 text-[11px] opacity-60">Escolha um ou vários personagens da Guilda.</p>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {characters.map((character) => {
                const unavailable = Boolean(character.owner_id && character.owner_id !== user?.id);
                const checked = selectedCharacters.includes(character.id);
                return (
                  <label key={character.id} className={`flex items-center gap-2 rounded border border-[var(--color-ink)]/15 px-2 py-1.5 text-xs ${unavailable ? "opacity-40" : "cursor-pointer"}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={unavailable || charactersBusy}
                      onChange={() => setSelectedCharacters((current) => checked ? current.filter((id) => id !== character.id) : [...current, character.id])}
                    />
                    <span className="truncate">{character.name}</span>
                  </label>
                );
              })}
            </div>
            <button onClick={() => void saveCharacters()} disabled={charactersBusy} className="mt-2 flex w-full items-center justify-center gap-2 rounded bg-[var(--color-ink)] px-2 py-1.5 text-[10px] uppercase text-[oklch(0.96_0.04_80)] disabled:opacity-50">
              {charactersBusy && <Loader2 className="size-3 animate-spin" />} Salvar personagens
            </button>
            {charactersNotice && <p className="mt-2 text-xs text-emerald-900">{charactersNotice}</p>}
            {error && <p className="mt-2 text-xs text-red-900">{error}</p>}
          </div>

          {isMaster && (
            <div className="mt-4 border-t border-[var(--color-ink)]/15 pt-4">
              <p className="font-[family-name:var(--font-display)] text-[9px] uppercase tracking-[0.2em]">Convidar para a mesa</p>
              <div className="mt-2 flex gap-2">
                <select
                  value={inviteRole}
                  onChange={(event) => setInviteRole(event.target.value as "player" | "guest")}
                  className="min-w-0 flex-1 rounded border border-[var(--color-ink)]/20 bg-[oklch(0.98_0.02_80)] px-2 py-1.5 text-xs"
                >
                  <option value="player">Jogador</option>
                  <option value="guest">Convidado (leitura)</option>
                </select>
                <button
                  onClick={() => void generate()}
                  disabled={creating}
                  className="flex items-center gap-1 rounded bg-[var(--color-ink)] px-3 py-1.5 text-[oklch(0.96_0.04_80)] disabled:opacity-50"
                >
                  {creating ? <Loader2 className="size-3.5 animate-spin" /> : <UserPlus className="size-3.5" />}
                  <span className="text-[10px] uppercase">Gerar</span>
                </button>
              </div>
              {inviteUrl && (
                <button
                  onClick={async () => {
                    await copyText(inviteUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1800);
                  }}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded border border-[var(--color-ink)]/20 px-2 py-1.5 text-xs"
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied ? "Link copiado" : "Copiar convite novamente"}
                </button>
              )}
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[var(--color-ink)]/15 pt-3">
            <button
              onClick={() => downloadLegacyDataAsJson()}
              className="flex items-center justify-center gap-1 rounded border border-[var(--color-ink)]/20 px-2 py-1.5 text-[10px]"
              title="Baixar os dados locais deste navegador"
            >
              <Download className="size-3.5" /> Backup local
            </button>
            <button
              onClick={() => {
                window.dispatchEvent(new Event("belamar:open-migration"));
                setOpen(false);
              }}
              disabled={!isMaster}
              className="flex items-center justify-center gap-1 rounded border border-[var(--color-ink)]/20 px-2 py-1.5 text-[10px] disabled:cursor-not-allowed disabled:opacity-40"
              title={isMaster ? "Importar um backup JSON" : "Somente o Mestre pode importar dados"}
            >
              <Upload className="size-3.5" /> Importar JSON
            </button>
          </div>

          <button
            onClick={() => void signOut()}
            className="mt-3 flex w-full items-center justify-center gap-2 border-t border-[var(--color-ink)]/15 pt-3 text-xs text-[var(--color-ink)]/70 hover:text-[var(--color-ink)]"
          >
            <LogOut className="size-3.5" /> Sair da conta
          </button>
        </div>
      )}
    </div>
  );
}

function LegacyMigrationModal() {
  const { campaignId, isMaster } = useCampaign();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<MigrationReport | null>(null);
  const [fileNotice, setFileNotice] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId || !isMaster) {
      setVisible(false);
      return;
    }

    setVisible(hasLegacyData() && !isMigrated(campaignId));
    const openManually = () => {
      setReport(null);
      setFileNotice(null);
      setFileError(null);
      setVisible(true);
    };
    window.addEventListener("belamar:open-migration", openManually);
    return () => window.removeEventListener("belamar:open-migration", openManually);
  }, [campaignId, isMaster]);

  if (!visible || !campaignId) return null;

  const total = report ? Object.values(report.counts).reduce<number>((sum, value) => sum + Number(value), 0) : 0;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 px-4">
      <div
        className="w-full max-w-[500px] rounded p-6 text-[var(--color-ink)] shadow-2xl"
        style={{ backgroundImage: `url(${parchmentImg})`, backgroundSize: "cover" }}
      >
        <h2 className="font-[family-name:var(--font-display)] text-lg tracking-[0.2em]">IMPORTAR DADOS</h2>
        {!report ? (
          <>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink)]/75">
              Há dados antigos salvos neste navegador. Posso copiá-los para a campanha compartilhada. O backup local não será apagado.
            </p>
            <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded border border-dashed border-[var(--color-ink)]/30 px-3 py-3 text-xs hover:bg-[oklch(0.96_0.04_80)]/45">
              <Upload className="size-3.5" />
              Carregar backup JSON de outro domínio
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setFileError(null);
                  setFileNotice(null);
                  try {
                    const restored = restoreLegacyDataFromJson(await file.text());
                    setFileNotice(`${restored} chaves foram restauradas neste navegador.`);
                  } catch (cause) {
                    setFileError(cause instanceof Error ? cause.message : "Não foi possível ler o backup.");
                  } finally {
                    event.target.value = "";
                  }
                }}
              />
            </label>
            {fileNotice && <p className="mt-2 text-xs text-emerald-900">{fileNotice}</p>}
            {fileError && <p className="mt-2 text-xs text-red-900">{fileError}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setVisible(false)} className="px-3 py-2 text-xs">Agora não</button>
              <button
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  const result = await migrateLocalDataToCampaign(campaignId);
                  setReport(result);
                  setBusy(false);
                }}
                className="flex items-center gap-2 rounded bg-[var(--color-ink)] px-4 py-2 text-xs text-[oklch(0.96_0.04_80)] disabled:opacity-50"
              >
                {busy && <Loader2 className="size-3.5 animate-spin" />}
                Importar para a campanha
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm">
              {report.ok ? `${total} registros foram importados com sucesso.` : "A importação terminou com erros."}
            </p>
            {report.errors.length > 0 && (
              <ul className="mt-3 max-h-32 list-disc overflow-auto pl-5 text-xs text-red-900">
                {report.errors.map((message) => <li key={message}>{message}</li>)}
              </ul>
            )}
            <button onClick={() => setVisible(false)} className="mt-5 w-full rounded border border-[var(--color-ink)]/25 px-3 py-2 text-xs">
              Fechar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function BelamarGate({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const campaign = useCampaign();

  const content = useMemo(() => {
    if (auth.loading) return <FullscreenLoading />;
    if (!auth.user) return <AuthScreen />;
    if (campaign.loading) return <FullscreenLoading label="Reunindo a companhia..." />;
    if (!campaign.campaignId) return <CampaignOnboarding />;
    return children;
  }, [auth.loading, auth.user, campaign.loading, campaign.campaignId, children]);

  if (!auth.user || !campaign.campaignId) return content;

  return (
    <>
      {content}
      <AccountPanel />
      <LegacyMigrationModal />
    </>
  );
}
