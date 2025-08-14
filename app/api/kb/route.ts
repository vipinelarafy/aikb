export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { unstable_noStore as noStore } from 'next/cache';

function noCacheJson(data: any, status = 200) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, private, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}

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
  noStore(); // hard-disable Next caching for this request

  try { requireRole('customer'); }
  catch { return noCacheJson({ ok:false, error:'Not authenticated' }, 401); }

  const kb  = process.env.RETELL_KNOWLEDGE_BASE_ID;
  const key = process.env.RETELL_API_KEY;
  if (!kb || !key) return noCacheJson({ ok:false, error:'Missing RETELL_KNOWLEDGE_BASE_ID or RETELL_API_KEY' }, 500);

  // cache-busting param + no-store on the upstream call
  const r = await fetch(`https://api.retellai.com/get-knowledge-base/${kb}?ts=${Date.now()}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: 'no-store',
  });

  const text = await r.text();
  if (!r.ok) {
    return new NextResponse(text, {
      status: r.status,
      headers: {
        'content-type': r.headers.get('content-type') || 'text/plain',
        'Cache-Control': 'no-store, no-cache, must-revalidate, private, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }

  let data: any; try { data = JSON.parse(text); } catch { data = {}; }
  const kbObj = data?.knowledge_base ?? data;
  return noCacheJson({ status: kbObj?.status, sources: normalizeSources(data) }, 200);
}
