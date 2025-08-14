'use client'; import { useEffect, useState } from 'react';
 type Source={ id:string; kind:string; locator:string; status?:string; size?:number; created_at?:string };
export default function KBPage(){ const [tab,setTab]=useState<'url'|'file'|'text'>('url'); const [urls,setUrls]=useState(''); const [texts,setTexts]=useState(''); const [files,setFiles]=useState<FileList|null>(null); const [sources,setSources]=useState<Source[]>([]); const [loading,setLoading]=useState(true); const [msg,setMsg]=useState<string|null>(null); const [err,setErr]=useState<string|null>(null);
 async function refresh() {
  setLoading(true);
  try {
    const r = await fetch('/api/kb');
    const t = await r.text();
    if (!r.ok) throw new Error(`KB fetch failed: ${t}`);

    let data: any = {};
    try { data = JSON.parse(t); } catch { data = t; }

    // Accept both the old array shape and the new { status, sources } shape
    const list =
      Array.isArray(data)
        ? data
        : (data?.sources ??
           data?.knowledge_base_sources ??
           data?.knowledge_base?.knowledge_base_sources ??
           []);

    setSources(Array.isArray(list) ? list : []);

    // Optional: show KB status message if present
    if (!Array.isArray(data) && data?.status) {
      setMsg(`KB status: ${data.status}`);
    } else {
      setMsg(null);
    }
  } catch (e: any) {
    setErr(e.message || 'Failed to load');
  } finally {
    setLoading(false);
  }
}

 useEffect(()=>{ refresh(); },[]);
 async function onAdd(){ setErr(null); setMsg(null); const form=new FormData(); if(tab==='url') urls.split('\n').map(s=>s.trim()).filter(Boolean).forEach(u=>form.append('urls[]',u)); if(tab==='text') texts.split('\n\n').map(s=>s.trim()).filter(Boolean).forEach(t=>form.append('texts[]',t)); if(tab==='file'&&files) Array.from(files).forEach(f=>form.append('files[]',f)); const res=await fetch('/api/kb/sources',{method:'POST',body:form}); const data=await res.text(); if(!res.ok){ setErr(data||'Failed to add'); return;} setMsg('Submitted to ingestion.'); setUrls(''); setTexts(''); (document.getElementById('fileinput') as HTMLInputElement | null)?.value && ((document.getElementById('fileinput') as HTMLInputElement).value=''); setFiles(null); await refresh(); }
 async function onDelete(id:string){ setErr(null); setMsg(null); const r=await fetch('/api/kb/sources/'+id,{method:'DELETE'}); const d=await r.json(); if(!r.ok){ setErr(d?.error||'Delete failed'); return;} await refresh(); }
 return(<div className='card'><h1>Knowledge Base</h1><div className='row' style={{marginTop:8,marginBottom:12}}><button className={'btn '+(tab==='url'?'':'secondary')} onClick={()=>setTab('url')}>Add URLs</button><button className={'btn '+(tab==='file'?'':'secondary')} onClick={()=>setTab('file')}>Upload Files</button><button className={'btn '+(tab==='text'?'':'secondary')} onClick={()=>setTab('text')}>Add Text</button></div>{tab==='url' && (<div style={{marginBottom:12}}><label>One URL per line</label><textarea className='input' rows={6} placeholder='https://docs.example.com/faq\nhttps://www.example.com/help' value={urls} onChange={e=>setUrls(e.target.value)} /></div>)}{tab==='file' && (<div style={{marginBottom:12}}><label>Upload PDF/TXT/DOCX (multiple allowed)</label><br/><input id='fileinput' type='file' multiple onChange={e=>setFiles(e.target.files)} /><div className='badge' style={{marginTop:6}}>{files?`${files.length} file(s) selected`:'no files selected'}</div></div>)}{tab==='text' && (<div style={{marginBottom:12}}><label>Custom text snippets (separate snippets with a blank line)</label><textarea className='input' rows={8} placeholder='Return policy: ...\n\nShipping policy: ...' value={texts} onChange={e=>setTexts(e.target.value)} /></div>)}<div className='row' style={{marginBottom:16}}><button className='btn' onClick={onAdd}>Submit</button><a className='btn secondary' href='/login' onClick={()=>{ document.cookie='auth=; Max-Age=0; path=/;'; }}>Logout</a></div>{msg && <div style={{color:'green'}}>{msg}</div>}{err && <div style={{color:'crimson'}}>{err}</div>}<h3 style={{marginTop:24}}>Sources</h3>{loading ? (<div>Loading…</div>) : (<table className='table'><thead><tr><th>Kind</th><th>Locator</th><th>Status</th><th>Size</th><th>Added</th><th></th></tr></thead><tbody>{sources.map(s=>(<tr key={s.id}><td><span className='badge'>{s.kind}</span></td><td style={{maxWidth:520,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.locator}</td><td>{s.status||'—'}</td><td>{s.size||'—'}</td><td>{s.created_at||'—'}</td><td><button className='btn secondary' onClick={()=>onDelete(s.id)}>Delete</button></td></tr>))}</tbody></table>)} </div>); }
