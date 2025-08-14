export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const kb  = process.env.RETELL_KNOWLEDGE_BASE_ID;
  const key = process.env.RETELL_API_KEY;
  if (!kb || !key) {
    return NextResponse.json({ ok:false, error:'Missing RETELL_API_KEY or RETELL_KNOWLEDGE_BASE_ID' }, { status: 500 });
  }

  const sourceId = params.id;
  if (!sourceId) return NextResponse.json({ ok:false, error:'Missing source id' }, { status: 400 });

  const url = `https://api.retellai.com/delete-knowledge-base-source/${encodeURIComponent(kb)}/source/${encodeURIComponent(sourceId)}`;

  const r = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${key}` },
  });

  const text = await r.text();
  if (!r.ok) return NextResponse.json({ ok:false, error: text }, { status: r.status });

  try { return NextResponse.json(JSON.parse(text)); }
  catch { return new NextResponse(text, { status: 200, headers: { 'content-type': 'application/json' } }); }
}
