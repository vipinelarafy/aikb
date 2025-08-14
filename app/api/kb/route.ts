import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // simple auth check
  const cookie = req.cookies.get('auth');
  if (!cookie) return NextResponse.json({ ok:false, error:'Not authenticated' }, { status: 401 });

  const kb = process.env.RETELL_KNOWLEDGE_BASE_ID;
  const key = process.env.RETELL_API_KEY;
  if (!kb || !key) {
    return NextResponse.json({ ok:false, error:'RETELL_API_KEY or RETELL_KNOWLEDGE_BASE_ID missing' }, { status: 500 });
  }

  // read incoming form (from the UI)
  const incoming = await req.formData();

  // build the form Retell expects
  const out = new FormData();

  // URLs: repeat `knowledge_base_urls`
  for (const u of incoming.getAll('urls[]')) {
    const url = String(u).trim();
    if (url) out.append('knowledge_base_urls', url);
  }

  // Texts: JSON array of { text, title }
  const textSnippets = incoming.getAll('texts[]').map(v => String(v).trim()).filter(Boolean);
  if (textSnippets.length) {
    const payload = textSnippets.map((t, i) => ({ text: t, title: `Snippet ${i+1}` }));
    out.append('knowledge_base_texts', JSON.stringify(payload));
  }

  // Files: repeat `knowledge_base_files`
  for (const f of incoming.getAll('files[]')) {
    if (f instanceof File) out.append('knowledge_base_files', f as File, (f as File).name);
  }

  // call Retell
  const res = await fetch(`https://api.retellai.com/add-knowledge-base-sources/${kb}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: out,
  });

  const text = await res.text();
  if (!res.ok) {
    // bubble up Retell's error message for easy debugging
    return NextResponse.json({ ok:false, error: text }, { status: res.status });
  }

  try { return NextResponse.json(JSON.parse(text)); }
  catch { return new NextResponse(text, { status: 200 }); }
}
