import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { PARTY, type PartyMember } from "@/lib/party";
import { useCampaign } from "@/lib/campaign-context";
import { useDocument } from "@/lib/campaign-data";

const NOTES_KEY = "belamar.notes";
const GOALS_KEY = "belamar.party-goals";
const STATUS_KEY = "belamar.party-status";

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function PartyPanel() {
  const { campaignId } = useCampaign();
  const [selected, setSelected] = useState<PartyMember | null>(null);
  const notes = useDocument(
    campaignId,
    "guilda.notes",
    campaignId ? {} : loadJson(NOTES_KEY, {} as Record<string, string>),
  );
  const goals = useDocument<string>(
    campaignId,
    "guilda.goals",
    campaignId ? "" : loadJson<string>(GOALS_KEY, ""),
  );
  const status = useDocument(
    campaignId,
    "guilda.status",
    campaignId ? {} : loadJson(STATUS_KEY, {} as Record<string, string>),
  );

  if (selected) {
    return (
      <MemberDetail
        member={selected}
        note={notes.value[selected.id] ?? ""}
        status={status.value[selected.id] ?? ""}
        onChange={(value) => {
          notes.persist({ ...notes.value, [selected.id]: value });
        }}
        onStatusChange={(value) => {
          status.persist({ ...status.value, [selected.id]: value });
        }}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <p className="font-[family-name:var(--font-body)] text-[15px] leading-relaxed text-[var(--color-ink)]/80">
        A companhia que partilha a mesma sorte em Belamar.
      </p>

      <div className="rounded border border-[var(--color-ink)]/15 bg-[oklch(0.96_0.04_80)]/40 p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-ink)]/60">
            Objetivos do grupo
          </p>
          <span className="font-[family-name:var(--font-script)] text-[11px] italic text-[var(--color-ink)]/45">
            sincronizado com a campanha
          </span>
        </div>
        <textarea
          value={goals.value}
          onChange={(e) => goals.persist(e.target.value)}
          placeholder="O que a companhia persegue agora?…"
          className="min-h-[90px] w-full resize-none rounded border border-[var(--color-ink)]/20 bg-[oklch(0.96_0.04_80)]/50 p-3 font-[family-name:var(--font-body)] text-[14.5px] leading-relaxed text-[var(--color-ink)] outline-none placeholder:italic placeholder:text-[var(--color-ink)]/40 focus:border-[var(--color-ink)]/50"
        />
      </div>

      <Section
        title="Companhia"
        subtitle="os que se sentam à mesa"
        members={PARTY}
        status={status.value}
        onSelect={setSelected}
      />

      <p className="pt-1 text-center font-[family-name:var(--font-script)] text-xs italic text-[var(--color-ink)]/45">
        — tantas velas, uma só corrente —
      </p>
    </div>
  );
}

function Section({
  title,
  subtitle,
  members,
  status,
  onSelect,
}: {
  title: string;
  subtitle: string;
  members: PartyMember[];
  status: Record<string, string>;
  onSelect: (m: PartyMember) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between border-b border-[var(--color-ink)]/15 pb-1">
        <h3 className="font-[family-name:var(--font-display)] text-[11px] uppercase tracking-[0.32em] text-[var(--color-ink)]/75">
          {title}
        </h3>
        <span className="font-[family-name:var(--font-script)] text-[11px] italic text-[var(--color-ink)]/50">
          {subtitle}
        </span>
      </div>
      <ul className="space-y-3">
        {members.map((m) => (
          <li key={m.id}>
            <button
              onClick={() => onSelect(m)}
              className="group flex w-full items-center gap-4 rounded border border-[var(--color-ink)]/15 bg-[oklch(0.96_0.04_80)]/30 p-4 text-left transition-all hover:border-[var(--color-ink)]/40 hover:bg-[oklch(0.96_0.04_80)]/55"
            >
              <Medallion member={m} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="ink-text text-lg leading-none">{m.name}</span>
                  {m.isYou && (
                    <span
                      className="rounded-sm px-1.5 py-0.5 font-[family-name:var(--font-display)] text-[9px] uppercase tracking-[0.2em]"
                      style={{
                        color: m.accent,
                        border: `1px solid ${m.accent}`,
                      }}
                    >
                      você
                    </span>
                  )}
                </div>
                {m.epithet && m.epithet !== "—" && (
                  <p className="mt-1 font-[family-name:var(--font-script)] text-sm italic text-[var(--color-ink)]/65">
                    {m.epithet}
                  </p>
                )}
                <p className="mt-1 font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.25em] text-[var(--color-ink)]/55">
                  {m.classLine}
                </p>
                {status[m.id] && (
                  <p className="mt-1.5 font-[family-name:var(--font-script)] text-[12px] italic text-[var(--color-ember)]/85">
                    status: {status[m.id]}
                  </p>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Medallion({ member, size = 56 }: { member: PartyMember; size?: number }) {
  const Icon = member.icon;
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full"
      style={{
        width: size,
        height: size,
        border: `1px solid ${member.accent}`,
        background:
          "radial-gradient(circle at 30% 25%, oklch(0.96 0.05 80) 0%, oklch(0.86 0.06 80) 100%)",
        boxShadow: `inset 0 0 10px ${member.accent}30, 0 2px 6px oklch(0 0 0 / 0.25)`,
      }}
    >
      {member.portrait ? (
        <img
          src={member.portrait}
          alt={member.name}
          className="h-full w-full object-cover"
          style={{ filter: "sepia(0.18) saturate(0.92) contrast(1.02)" }}
          draggable={false}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span
            className="absolute font-[family-name:var(--font-display)] text-2xl"
            style={{ color: member.accent, opacity: 0.35 }}
          >
            {member.sigil}
          </span>
          <Icon
            size={Math.round(size * 0.36)}
            strokeWidth={1.4}
            style={{ color: member.accent }}
            className="relative"
          />
        </div>
      )}
    </div>
  );
}

function MemberDetail({
  member,
  note,
  status,
  onChange,
  onStatusChange,
  onBack,
}: {
  member: PartyMember;
  note: string;
  status: string;
  onChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onBack: () => void;
}) {
  const Icon = member.icon;
  return (
    <div className="flex h-full flex-col">
      <button
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-1 self-start font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-ink)]/60 transition-colors hover:text-[var(--color-ink)]"
      >
        <ChevronLeft size={14} /> voltar ao grupo
      </button>

      <div className="flex items-start gap-5">
        {member.portrait ? (
          <div
            className="relative shrink-0 overflow-hidden rounded"
            style={{
              width: 132,
              height: 168,
              border: `1px solid ${member.accent}`,
              boxShadow: `0 6px 18px oklch(0 0 0 / 0.35), inset 0 0 12px ${member.accent}25`,
            }}
          >
            <img
              src={member.portrait}
              alt={member.name}
              className="h-full w-full object-cover"
              style={{ filter: "sepia(0.18) saturate(0.92) contrast(1.02)" }}
              draggable={false}
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at center, transparent 55%, oklch(0 0 0 / 0.35) 100%)",
              }}
            />
          </div>
        ) : (
          <Medallion member={member} size={64} />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="ink-text text-2xl">{member.name}</h3>
            {member.isYou && (
              <span
                className="rounded-sm px-1.5 py-0.5 font-[family-name:var(--font-display)] text-[9px] uppercase tracking-[0.2em]"
                style={{ color: member.accent, border: `1px solid ${member.accent}` }}
              >
                você
              </span>
            )}
          </div>
          <p className="font-[family-name:var(--font-script)] text-sm italic text-[var(--color-ink)]/70">
            {member.epithet}
          </p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.25em] text-[var(--color-ink)]/55">
            {member.classLine}
          </p>
        </div>
      </div>

      <div
        className="my-6 h-px w-full"
        style={{
          background:
            "linear-gradient(to right, transparent, oklch(0.25 0.04 35 / 0.4), transparent)",
        }}
      />

      {member.stats && member.stats.length > 0 ? (
        <div className="rounded border border-[var(--color-ink)]/15 bg-[oklch(0.96_0.04_80)]/40 p-4">
          <p className="mb-3 font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-ink)]/60">
            Perfil geral
          </p>
          <dl className="grid grid-cols-1 gap-x-5 gap-y-2 sm:grid-cols-2">
            {member.stats.map((s) => (
              <div key={s.label} className="flex flex-col">
                <dt className="font-[family-name:var(--font-display)] text-[9px] uppercase tracking-[0.25em] text-[var(--color-ink)]/55">
                  {s.label}
                </dt>
                <dd className="font-[family-name:var(--font-body)] text-[14px] text-[var(--color-ink)]/85">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-ink)]/60">
            Classe
          </p>
          <p className="font-[family-name:var(--font-body)] text-base text-[var(--color-ink)]/85">
            {member.classLine}
          </p>
        </div>
      )}

      {member.dossier?.map((sec) => (
        <div
          key={sec.title}
          className="mt-5 rounded border border-[var(--color-ink)]/15 bg-[oklch(0.96_0.04_80)]/40 p-4"
        >
          <p className="mb-2 font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-ink)]/65">
            {sec.title}
          </p>
          {sec.body && (
            <p className="font-[family-name:var(--font-body)] text-[14px] leading-relaxed text-[var(--color-ink)]/85">
              {sec.body}
            </p>
          )}
          {sec.bullets && (
            <ul className="space-y-2.5">
              {sec.bullets.map((b) => (
                <li key={b.label}>
                  <span className="font-[family-name:var(--font-display)] text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink)]">
                    {b.label}
                  </span>
                  <span className="ml-2 font-[family-name:var(--font-body)] text-[13.5px] leading-relaxed text-[var(--color-ink)]/80">
                    — {b.text}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      <div className="mt-5 rounded border border-[var(--color-ink)]/15 bg-[oklch(0.96_0.04_80)]/40 p-4">
        <p className="mb-2 font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-ink)]/60">
          Status atual
        </p>
        <input
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          placeholder="ferido, em missão, desaparecido…"
          className="w-full rounded border border-[var(--color-ink)]/20 bg-[oklch(0.96_0.04_80)]/50 p-2.5 font-[family-name:var(--font-body)] text-[14px] text-[var(--color-ink)] outline-none placeholder:italic placeholder:text-[var(--color-ink)]/40 focus:border-[var(--color-ink)]/50"
        />
      </div>

      <div className="mt-6 flex flex-1 flex-col space-y-2">
        <div className="flex items-center justify-between">
          <p className="font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-ink)]/60">
            Notas de Bandolim <Icon size={12} className="ml-1 inline-block opacity-60" />
          </p>
          <span className="font-[family-name:var(--font-script)] text-[11px] italic text-[var(--color-ink)]/45">
            sincronizado com a campanha
          </span>
        </div>
        <textarea
          value={note}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Histórico, motivações, segredos, ganchos da campanha…"
          className="min-h-[200px] flex-1 resize-none rounded border border-[var(--color-ink)]/20 bg-[oklch(0.96_0.04_80)]/50 p-4 font-[family-name:var(--font-body)] text-[15px] leading-relaxed text-[var(--color-ink)] outline-none placeholder:italic placeholder:text-[var(--color-ink)]/40 focus:border-[var(--color-ink)]/50"
          style={{ boxShadow: "inset 0 1px 2px oklch(0 0 0 / 0.08)" }}
        />
      </div>
    </div>
  );
}
