export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';

export async function GET() {
  try { requireRole('customer'); } catch {
    return NextResponse.json({ ok:false, error:'Not authenticated' }, { status: 401 });
  }
  const kb = process.env.RETELL_KNOWLEDGE_BASE_ID;
  const key = process.env.RETELL_API_KEY;
  if (!kb || !key) {
    return NextResponse.json({ ok:false, error:'Missing RETELL_KNOWLEDGE_BASE_ID or RETELL_API_KEY' }, { status: 500 });
  }

  const r = await fetch(`https://api.retellai.com/get-knowledge-base/${kb}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const text = await r.text();
  if (!r.ok) {
    return new NextResponse(text, {
      status: r.status,
      headers: { 'content-type': r.headers.get('content-type') || 'text/plain' },
    });
  }

  const data = JSON.parse(text);
  const sources = (data?.sources || data?.knowledge_base?.sources || []).map((s: any) => ({
    id: s.source_id || s.id || s.locator,
    kind: s.source_type || s.kind || 'unknown',
    locator: s.locator || s.url || s.name || '',
    status: s.status || 'indexed',
    size: s.size || null,
    created_at: s.created_at || null,
  }));
  return NextResponse.json(sources);
}
