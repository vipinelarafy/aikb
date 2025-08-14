export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';

function normalizeSources(payload: any) {
  const kbObj = payload?.knowledge_base ?? payload;
  const arr: any[] = kbObj?.knowledge_base_sources ?? kbObj?.sources ?? [];
  return arr.map((s: any) => ({
    id: s.source_id || s.id || s.locator || s.url || s.file_url || s.filename,
    kind: s.type || s.source_type || 'unknown',
    locator: s.url || s.file_url || s.filename || s.name || s.locator || '',
    status: s.status || kbObj?.status || 'in_progress',
    size: s.size ?? null,
    created_at: s.created_at ?? null,
  }));
}

export async function GET() {
  try { requireRole('customer'); } catch { 
    return NextResponse.json({ ok:false, error:'Not authenticated' }, { status: 401 });
  }
  const kb = process.env.RETELL_KNOWLEDGE_BASE_ID;
  const key = process.env.RETELL_API_KEY;
  if (!kb || !key) return NextResponse.json({ ok:false, error:'Missing RETELL_KNOWLEDGE_BASE_ID or RETELL_API_KEY' }, { status: 500 });

  const r = await fetch(`https://api.retellai.com/get-knowledge-base/${kb}`, {
    headers: { Authorization: `Bearer ${key}` }
  });
  const text = await r.text();
  if (!r.ok) return new NextResponse(text, { status: r.status, headers: { 'content-type': r.headers.get('content-type') || 'text/plain' }});

  let data: any; try { data = JSON.parse(text); } catch { data = {}; }
  const kbObj = data?.knowledge_base ?? data;
  return NextResponse.json({ status: kbObj?.status, sources: normalizeSources(data) });
}
