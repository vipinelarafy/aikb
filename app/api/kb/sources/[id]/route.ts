// app/api/kb/sources/[id]/route.ts
export const dynamic = 'force-dynamic';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const key = process.env.RETELL_API_KEY;
  const kb  = process.env.RETELL_KNOWLEDGE_BASE_ID;
  if (!key || !kb) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing RETELL_API_KEY or RETELL_KNOWLEDGE_BASE_ID' }), {
      status: 500, headers: { 'content-type': 'application/json' }
    });
  }

  const r = await fetch(
    `https://api.retellai.com/delete-knowledge-base-source/${kb}/source/${encodeURIComponent(params.id)}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${key}` } }
  );

  const body = await r.text();
  return new Response(body, {
    status: r.status,
    headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' },
  });
}
