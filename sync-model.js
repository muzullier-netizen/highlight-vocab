/* Three-way merging: local changes since the acknowledged base + latest cloud state. */
(() => {
  const clone=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
  const canonical=x=>x===undefined?'undefined':x&&typeof x==='object'?Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).filter(k=>x[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}':JSON.stringify(x);
  const equal=(a,b)=>canonical(a)===canonical(b);
  const newer=(a,b)=>!a?clone(b):!b?clone(a):clone((Number(a.updated)||0)>(Number(b.updated)||0)?a:(Number(a.updated)||0)<(Number(b.updated)||0)?b:canonical(a)>canonical(b)?a:b);
  const bookmark=(local,base,remote)=>base&&equal(local,base)?clone(remote):base&&equal(remote,base)?clone(local):newer(local,remote);
  function record(local={},base,remote={}){
    if(!base)return {...clone(local),...clone(remote),...newer(local,remote)};
    const result={};
    for(const k of new Set([...Object.keys(local),...Object.keys(remote)])){
      if(k==='updated')continue;
      const l=local[k],b=base[k],r=remote[k];
      result[k]=clone(equal(l,b)?r:equal(r,b)||equal(l,r)?l:(Number(local.updated)||0)>(Number(remote.updated)||0)?l:r);
      if(result[k]===undefined)delete result[k];
    }
    result.updated=Math.max(Number(local.updated)||0,Number(remote.updated)||0);
    return result;
  }
  const count=(l,b,r,first)=>first?Math.max(l||0,r||0):(r||0)+Math.max(0,(l||0)-(b||0));
  function mapRecords(local={},base={},remote={},merge=record){
    return Object.fromEntries([...new Set([...Object.keys(local),...Object.keys(remote)])].map(id=>[id,!local[id]?clone(remote[id]):!remote[id]?clone(local[id]):merge(local[id],base?.[id],remote[id])]));
  }
  function dictation(local,base,remote){
    if(!local)return clone(remote);if(!remote)return clone(local);
    const out=record(local,base,remote);out.version=1;out.stats={};out.rounds={};
    for(const type of ['word','sentence','synthetic']){
      out.stats[type]=mapRecords(local.stats?.[type],base?.stats?.[type],remote.stats?.[type],(l,b,r)=>{
        const s=record(l,b,r);
        for(const k of ['attempts','correct','wrong','reveals','firstAttempts','firstCorrect'])s[k]=count(l[k],b?.[k],r[k],!base);
        return s;
      });
      if(local.rounds?.[type]||remote.rounds?.[type])out.rounds[type]=bookmark(local.rounds?.[type],base?.rounds?.[type],remote.rounds?.[type]);
    }
    const materials=mapRecords(Object.fromEntries((local.materials||[]).map(c=>[c.id,c])),{},Object.fromEntries((remote.materials||[]).map(c=>[c.id,c])),(l,b,r)=>newer(l,r));
    out.materials=Object.values(materials);
    const bookmarks=mapRecords(local.bookmarks,base?.bookmarks,remote.bookmarks,bookmark);
    // Also preserve active contexts from older clients that do not yet store filter bookmarks.
    for(const d of [local,remote])for(const[type,r]of Object.entries(d.rounds||{}))if(typeof r.signature==='string'){const key=JSON.stringify([type,r.signature]);bookmarks[key]=bookmarks[key]?bookmark(r,base?.rounds?.[type],bookmarks[key]):clone(r)}
    out.bookmarks=Object.fromEntries(Object.entries(bookmarks).sort((a,b)=>(b[1].updated||0)-(a[1].updated||0)).slice(0,40));
    if(out.materials.length>500)throw Error('两台设备合并后的自定义原句超过 500 条，请先导出备份并整理。');
    return out;
  }
  function deck(local,base,remote){
    if(!local)return clone(remote);if(!remote)return clone(local);
    const pristine=!Object.keys(local.items||{}).length&&!Object.values(local.days||{}).some(Boolean)&&!(local.dictation?.materials||[]).length&&!Object.values(local.dictation?.stats||{}).some(group=>Object.values(group).some(s=>s.attempts||s.reveals))&&!Object.values(local.dictation?.rounds||{}).some(r=>r.draft||r.cursor>0);
    // Opening the page creates a fresh timestamped round, but it must not replace a cloud bookmark on a new computer.
    if(!base&&pristine)return clone(remote);
    const out={items:mapRecords(local.items,base?.items,remote.items),days:{}};
    for(const day of new Set([...Object.keys(local.days||{}),...Object.keys(remote.days||{})]))out.days[day]=count(local.days?.[day],base?.days?.[day],remote.days?.[day],!base);
    if(local.round||remote.round)out.round=bookmark(local.round,base?.round,remote.round);
    if(local.dictation||remote.dictation)out.dictation=dictation(local.dictation,base?.dictation,remote.dictation);
    return out;
  }
  function merge(local,base,remote){
    const out={version:1,decks:{},clips:{}};
    for(const k of ['highlight','reading','listening'])if(local?.decks?.[k]||remote?.decks?.[k])out.decks[k]=deck(local?.decks?.[k],base?.decks?.[k],remote?.decks?.[k]);
    out.clips=mapRecords(local?.clips,{},remote?.clips,(l,b,r)=>newer(l,r));
    return out;
  }
  globalThis.SyncModel={clone,canonical,equal,merge};
})();
