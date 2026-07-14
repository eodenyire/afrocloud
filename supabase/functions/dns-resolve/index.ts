// Africa Cloud — public DNS resolver.
// Answers DNS-over-HTTPS JSON queries (RFC 8484 §4.1 style, same shape
// as Google/Cloudflare 1.1.1.1/dns-query) from records stored in the
// public.dns_records table.
//
//   GET /functions/v1/dns-resolve?name=example.com&type=A
//   -> { Status: 0, Question: [...], Answer: [ { name, type, TTL, data } ] }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const TYPE_MAP: Record<string, number> = {
  A: 1, NS: 2, CNAME: 5, SOA: 6, PTR: 12, MX: 15, TXT: 16, AAAA: 28, SRV: 33, CAA: 257,
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/dns-json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  const url = new URL(req.url);
  const name = (url.searchParams.get("name") ?? "").toLowerCase().replace(/\.$/, "");
  const typeParam = (url.searchParams.get("type") ?? "A").toUpperCase();
  const typeNum = /^\d+$/.test(typeParam) ? parseInt(typeParam) : (TYPE_MAP[typeParam] ?? 1);
  const typeName = Object.entries(TYPE_MAP).find(([, v]) => v === typeNum)?.[0] ?? "A";

  if (!name) {
    return json(400, { Status: 2, error: "Missing 'name' parameter" });
  }

  // Match records by full name (name.zone) or the record `name` field directly.
  // Records store: zone (e.g. "africloud.dev"), name (e.g. "www"), record_type, value, ttl.
  const { data, error } = await admin
    .from("dns_records")
    .select("zone,name,record_type,value,ttl")
    .eq("record_type", typeName);

  if (error) return json(500, { Status: 2, error: error.message });

  const answers = (data ?? [])
    .filter((r) => {
      const fqdn = r.name === "@" || !r.name
        ? r.zone.toLowerCase()
        : `${r.name}.${r.zone}`.toLowerCase();
      return fqdn === name || r.name?.toLowerCase() === name;
    })
    .map((r) => ({
      name: (r.name === "@" || !r.name ? r.zone : `${r.name}.${r.zone}`) + ".",
      type: typeNum,
      TTL: r.ttl ?? 300,
      data: r.value,
    }));

  return json(200, {
    Status: answers.length ? 0 : 3, // 0 = NOERROR, 3 = NXDOMAIN
    TC: false,
    RD: true,
    RA: true,
    AD: false,
    CD: false,
    Question: [{ name: name + ".", type: typeNum }],
    Answer: answers,
    Comment: "africloud-dns v1",
  });
});
