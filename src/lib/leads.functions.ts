import { createServerFn } from "@tanstack/react-start";

export type Lead = {
  id: number;
  created_at: string;
  nome: string | null;
  empresa: string | null;
  valor: number | null;
  etapa: string | null;
};

export const getLeads = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("id, created_at, nome, empresa, valor, etapa")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Lead[];
});

export const STAGES = ["Novo", "Em contato", "Fechado"] as const;

export const updateLeadStage = createServerFn({ method: "POST" })
  .inputValidator((d: { id: number; etapa: string }) => {
    const id = Number(d.id);
    const etapa = String(d.etapa ?? "").trim();
    if (!Number.isInteger(id) || id <= 0) throw new Error("Lead inválido");
    if (!STAGES.includes(etapa as (typeof STAGES)[number])) throw new Error("Etapa inválida");
    return { id, etapa };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("leads").update({ etapa: data.etapa }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addLead = createServerFn({ method: "POST" })
  .inputValidator((d: { nome: string; empresa: string; valor: number }) => {
    const nome = String(d.nome ?? "").trim().slice(0, 200);
    const empresa = String(d.empresa ?? "").trim().slice(0, 200);
    const valor = Number(d.valor);
    if (!nome) throw new Error("Nome é obrigatório");
    if (!Number.isFinite(valor) || valor < 0) throw new Error("Valor inválido");
    return { nome, empresa, valor };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("leads").insert({ ...data, etapa: "Novo" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
