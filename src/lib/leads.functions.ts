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
