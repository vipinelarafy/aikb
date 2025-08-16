// app/api/kb/sources/route.ts
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const key = process.env.RETELL_API_KEY;
  const kb  = process.env.RETELL_KNOWLEDGE_BASE_ID;
  if (!key || !kb) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing RETELL_API_KEY or RETELL_KNOWLEDGE_BASE_ID' }), {
      status: 500, headers: { 'content-type': 'application/json' }
    });
  }

  const inForm = await req.formData();

  // Accept urls[]/texts[] and urls/texts
  const grabAll = (name: string) => [...inForm.getAll(name), ...inForm.getAll(`${name}[]`)];
  const urls = grabAll('urls')
    .map(v => String(v).trim())
    .filter(Boolean)
    .map(u => /^https?:\/\//i.test(u) ? u : `https://${u}`);

  const texts = grabAll('texts')
    .map(v => String(v).trim())
    .filter(Boolean);

  const outForm = new FormData();
  if (urls.length)  outForm.append('knowledge_base_urls', JSON.stringify(urls));
  if (texts.length) outForm.append('knowledge_base_texts', JSON.stringify(
    texts.map((t, i) => ({ text: t, title: `Snippet ${i + 1}` }))
  ));

  // files[] (multiple)
  const files = [...inForm.getAll('files'), ...inForm.getAll('files[]')];
  for (const f of files) {
    if (f instanceof File) outForm.append('knowledge_base_files', f, f.name);
  }

  if (!urls.length && !texts.length && files.length === 0) {
    return new Response(JSON.stringify({ ok: false, error: 'Nothing to add' }), {
      status: 400, headers: { 'content-type': 'application/json' }
    });
  }

  const r = await fetch(`https://api.retellai.com/add-knowledge-base-sources/${kb}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: outForm,
  });

  const body = await r.text();
  return new Response(body, {
    status: r.status,
    headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' },
  });
}
