// app/api/kb/route.ts
export const dynamic = 'force-dynamic'; // disable caching on Vercel

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

  // If Retell returned an error, just forward it
  if (!r.ok) {
    return new Response(text, {
      status: r.status,
      headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' }
    });
  }

  // Normalize to { status, sources }
  let payload: any = {};
  try { payload = JSON.parse(text); } catch { payload = {}; }

  const kbObj   = payload.knowledge_base ?? payload;
  const status  = kbObj?.status ?? null;
  const sources = kbObj?.knowledge_base_sources ?? kbObj?.sources ?? [];

  return new Response(JSON.stringify({ status, sources }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
}
