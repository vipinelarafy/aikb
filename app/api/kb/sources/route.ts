export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

function isFile(x: unknown): x is File {
  // works on Node runtime with the web File API
  return typeof File !== 'undefined' && x instanceof File;
}

export async function POST(req: NextRequest) {
  // (simple auth guard — keep if you had one)
  const cookie = req.cookies.get('auth');
  if (!cookie) return NextResponse.json({ ok:false, error:'Not authenticated' }, { status: 401 });

  const kb  = process.env.RETELL_KNOWLEDGE_BASE_ID;
  const key = process.env.RETELL_API_KEY;
  if (!kb || !key) {
    return NextResponse.json({ ok:false, error:'RETELL_API_KEY or RETELL_KNOWLEDGE_BASE_ID missing' }, { status: 500 });
  }

  const incoming = await req.formData();
  const out = new FormData();

 // ---- URLs (accept UI field + Retell's; send as JSON array) ----
const urlVals = [
  ...incoming.getAll('urls[]').map(v => String(v)),
  ...incoming.getAll('knowledge_base_urls').map(v => String(v)),
]
  .map(s => s.trim())
  .filter(Boolean)
  .map(u => (/^https?:\/\//i.test(u) ? u : `https://${u}`));

if (urlVals.length) {
  // Retell examples show arrays; some servers expect a single JSON string for arrays in multipart.
  out.append('knowledge_base_urls', JSON.stringify(urlVals));
}

  // ---- Texts ----
  // If caller already sent Retell's JSON payload, just pass it through.
  const kbTextsRaw = incoming.get('knowledge_base_texts');
  if (kbTextsRaw) {
    out.append('knowledge_base_texts', String(kbTextsRaw));
  } else {
    const textSnippets = [
      ...incoming.getAll('texts[]').map(v => String(v)),
      ...incoming.getAll('text[]').map(v => String(v)), // tolerate a common typo
    ]
      .map(s => s.trim())
      .filter(Boolean);

    if (textSnippets.length) {
      const payload = textSnippets.map((t, i) => ({ text: t, title: `Snippet ${i + 1}` }));
      out.append('knowledge_base_texts', JSON.stringify(payload));
    }
  }

  // ---- Files (accept both our UI field and Retell's) ----
  const files = [
    ...incoming.getAll('files[]').filter(isFile),
    ...incoming.getAll('knowledge_base_files').filter(isFile),
  ];
  for (const f of files) out.append('knowledge_base_files', f, f.name);

  // If nothing collected, return a clear 400 BEFORE calling Retell
  const hasSomething =
    out.has('knowledge_base_urls') ||
    out.has('knowledge_base_texts') ||
    out.has('knowledge_base_files');

  if (!hasSomething) {
    return NextResponse.json(
      { ok:false, error: 'Nothing to add: please provide at least one URL, text snippet, or file.' },
      { status: 400 }
    );
  }

  // Call Retell
  const res  = await fetch(`https://api.retellai.com/add-knowledge-base-sources/${kb}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: out,
  });

  const text = await res.text();
  if (!res.ok) return NextResponse.json({ ok:false, error: text }, { status: res.status });

  try { return NextResponse.json(JSON.parse(text)); }
  catch { return new NextResponse(text, { status: 200 }); }
}
