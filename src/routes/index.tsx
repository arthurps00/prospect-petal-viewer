import { createFileRoute, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getLeads, addLead, updateLeadStage, STAGES, type Lead } from "@/lib/leads.functions";

const leadsQuery = queryOptions({ queryKey: ["leads"], queryFn: () => getLeads() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Leads — Painel" },
      { name: "description", content: "Lista de todos os leads cadastrados." },
      { property: "og:title", content: "Leads — Painel" },
      { property: "og:description", content: "Lista de todos os leads cadastrados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(leadsQuery),
  component: LeadsPage,
  errorComponent: ErrorView,
  notFoundComponent: () => <p className="p-8">Nada encontrado.</p>,
});

function ErrorView({ error }: ErrorComponentProps) {
  const router = useRouter();
  return (
    <div className="p-8">
      <p className="text-destructive">Erro ao carregar leads: {error instanceof Error ? error.message : String(error)}</p>
      <button className="mt-4 underline" onClick={() => router.invalidate()}>Tentar de novo</button>
    </div>
  );
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function LeadsPage() {
  const { data: leads } = useSuspenseQuery(leadsQuery);
  const total = leads.reduce((s, l) => s + (Number(l.valor) || 0), 0);
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">{leads.length} leads cadastrados</p>
        </div>
        <div className="rounded-lg border bg-card px-5 py-3 text-right">
          <p className="text-xs uppercase text-muted-foreground">Valor total</p>
          <p className="text-xl font-semibold">{brl.format(total)}</p>
        </div>
      </header>
      <LeadForm />
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">Etapa</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3">Criado em</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Nenhum lead ainda.</td></tr>
            )}
            {leads.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="px-4 py-3 font-medium">{l.nome ?? "—"}</td>
                <td className="px-4 py-3">{l.empresa ?? "—"}</td>
                <td className="px-4 py-3"><StageSelect leadId={l.id} etapa={l.etapa} /></td>
                <td className="px-4 py-3 text-right">{l.valor != null ? brl.format(Number(l.valor)) : "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(l.created_at).toLocaleDateString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function StageSelect({ leadId, etapa }: { leadId: number; etapa: string | null }) {
  const update = useServerFn(updateLeadStage);
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const value = etapa !== null && STAGES.includes(etapa as (typeof STAGES)[number]) ? etapa : "";
  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    if (!next || next === value) return;
    setBusy(true); setErr(null);
    qc.setQueryData<Lead[]>(leadsQuery.queryKey, (old) =>
      old?.map((x) => (x.id === leadId ? { ...x, etapa: next } : x))
    );
    try {
      await update({ data: { id: leadId, etapa: next } });
      await qc.invalidateQueries({ queryKey: ["leads"] });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao atualizar etapa");
      await qc.invalidateQueries({ queryKey: ["leads"] });
    } finally { setBusy(false); }
  }
  return (
    <div>
      <select
        disabled={busy}
        value={value}
        onChange={onChange}
        className="rounded-md border bg-background px-2 py-1 text-xs disabled:opacity-50"
      >
        <option value="" disabled>—</option>
        {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      {err && <p className="text-xs text-destructive">{err}</p>}
    </div>
  );
}

function LeadForm() {
  const add = useServerFn(addLead);
  const qc = useQueryClient();
  const [nome, setNome] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [valor, setValor] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      await add({ data: { nome, empresa, valor: Number(valor.replace(",", ".")) } });
      setNome(""); setEmpresa(""); setValor("");
      await qc.invalidateQueries({ queryKey: ["leads"] });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao adicionar lead");
    } finally { setBusy(false); }
  }
  const input = "w-full rounded-md border bg-background px-3 py-2 text-sm";
  return (
    <form onSubmit={onSubmit} className="mb-8 grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-[1fr_1fr_160px_auto] sm:items-end">
      <label className="text-sm">Nome<input required maxLength={200} className={input} value={nome} onChange={(e) => setNome(e.target.value)} /></label>
      <label className="text-sm">Empresa<input maxLength={200} className={input} value={empresa} onChange={(e) => setEmpresa(e.target.value)} /></label>
      <label className="text-sm">Valor<input required inputMode="decimal" className={input} value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" /></label>
      <button disabled={busy} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">{busy ? "Adicionando..." : "Adicionar lead"}</button>
      {err && <p className="text-sm text-destructive sm:col-span-4">{err}</p>}
    </form>
  );
}
