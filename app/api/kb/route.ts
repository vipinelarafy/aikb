// app/api/kb/route.ts
export const dynamic = 'force-dynamic';

export async function GET() {
  const key = process.env.RETELL_API_KEY;
  const kb  = process.env.RETELL_KNOWLEDGE_BASE_ID;

  if (!key || !kb) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing RETELL_API_KEY or RETELL_KNOWLEDGE_BASE_ID' }), {
      status: 500, headers: { 'content-type': 'application/json' }
    });
  }

  const r = await fetch(`https://api.retellai.com/get-knowledge-base/${kb}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: 'no-store',
  });

  const text = await r.text();
  if (!r.ok) {
    return new Response(text, {
      status: r.status,
      headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' }
    });
  }

  let payload: any = {};
  try { payload = JSON.parse(text); } catch {}

  const kbObj = payload.knowledge_base ?? payload;
  const rawSources: any[] = kbObj?.knowledge_base_sources ?? kbObj?.sources ?? [];

  // Normalize Retell fields -> UI-friendly fields
  const sources = rawSources.map((s) => {
    const kind = s.type === 'document' ? 'file' : (s.type ?? 'unknown');
    const locator = s.url ?? s.file_url ?? s.filename ?? s.title ?? s.source_id ?? '—';
    return {
      id: s.source_id ?? s.id ?? null,          // use this when deleting
      source_id: s.source_id ?? s.id ?? null,   // backwards compatibility
      type: s.type ?? null,                     // original
      kind,                                     // UI column
      locator,                                  // UI column
      status: s.status ?? null,                 // may be null (Retell doesn’t always return per-source status)
      size: s.file_size ?? null,                // may be null
      added: s.added_at ?? null,                // may be null
      raw: s,                                   // keep original for debugging if needed
    };
  });

  return new Response(JSON.stringify({
    knowledge_base_id: kbObj?.knowledge_base_id ?? kb,
    knowledge_base_name: kbObj?.knowledge_base_name ?? null,
    status: kbObj?.status ?? null,              // "in_progress" | "complete"
    enable_auto_refresh: kbObj?.enable_auto_refresh ?? null,
    last_refreshed_timestamp: kbObj?.last_refreshed_timestamp ?? null,
    sources,
  }), { status: 200, headers: { 'content-type': 'application/json' }});
}
