export async function GET() {
  const key = process.env.RETELL_API_KEY;
  if (!key) return new Response(JSON.stringify({ ok:false, error:'RETELL_API_KEY missing' }), { status: 500 });

  const r = await fetch('https://api.retellai.com/list-knowledge-bases', {
    headers: { Authorization: `Bearer ${key}` }
  });
  const body = await r.text();
  return new Response(body, {
    status: r.status,
    headers: { 'content-type': r.headers.get('content-type') || 'application/json' }
  });
}
