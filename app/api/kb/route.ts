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

  // Do NOT forward any query params like ?ts=
  const r = await fetch(`https://api.retellai.com/get-knowledge-base/${kb}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: 'no-store',
  });

  const body = await r.text();
  return new Response(body, {
    status: r.status,
    headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' },
  });
}
