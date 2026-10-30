import { createFileRoute, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getLeads } from "@/lib/leads.functions";

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
      <p className="text-destructive">Erro ao carregar leads: {error.message}</p>
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
                <td className="px-4 py-3">
                  {l.etapa ? <span className="rounded-full bg-secondary px-2 py-1 text-xs">{l.etapa}</span> : "—"}
                </td>
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
