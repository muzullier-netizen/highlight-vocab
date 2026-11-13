import {setup} from './validate-listening.mjs';
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
const cp=x=>JSON.parse(JSON.stringify(x));
const UID='sync-test-user',receipts=new Map(),files=new Map();
let cloud={revision:0,payload:{version:1,decks:{},clips:{}},updated_at:'2026-11-05T11:00:00Z'},loseResponse=false,onPush=null,pushes=0;
async function browser(storage=new Map(),id=UID){
 const audio=new Map();
 const indexedDB={open(){const req={result:{createObjectStore(){},transaction(){const tx={objectStore(){return {getAll(){const r={};queueMicrotask(()=>{r.result=[...audio.values()];r.onsuccess()});return r},put(c){audio.set(c.id,c);queueMicrotask(()=>tx.oncomplete?.())}}}};return tx}}};queueMicrotask(()=>req.onsuccess());return req}};
 const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
 const speech={cancel(){},getVoices:()=>[],addEventListener(){}};
 const client={auth:{onAuthStateChange(){},getSession:async()=>({data:{session:{user:{id,email:'test@example.invalid'}}}}),signOut:async()=>({}),signInWithOtp:async()=>({})},storage:{from:()=>({upload:async(key,blob)=>{if(files.has(key))return {error:{statusCode:409}};files.set(key,blob);return {}},download:async key=>({data:files.get(key)})})},rpc:async(name,p)=>{
   if(name==='vocab_sync_pull')return {data:cp(cloud)};
   assert.equal(name,'vocab_sync_push');pushes++;
   if(receipts.has(p.p_request_id))return {data:{...cp(cloud),replay:true,conflict:false}};
   if(p.p_expected_revision!==cloud.revision)return {data:{...cp(cloud),conflict:true}};
   cloud={revision:cloud.revision+1,payload:cp(p.p_payload),updated_at:'2026-11-05T11:01:00Z'};receipts.set(p.p_request_id,true);
   onPush?.();onPush=null;
   if(loseResponse){loseResponse=false;throw Error('NetworkError fixture: response lost after accepted write')}
   return {data:{...cp(cloud),conflict:false}};
 }};
 const extra={dictation:true,indexedDB,localStorage,speechSynthesis:speech,structuredClone,atob,Uint8Array,Blob,crypto:webcrypto,navigator:{onLine:true},setInterval(){},clearInterval(){},clearTimeout(){},SpeechSynthesisUtterance:class{},window:{indexedDB,speechSynthesis:speech,addEventListener(){},supabase:{createClient:()=>client},VOCAB_CLOUD_CONFIG:{url:'https://test.supabase.co',publishableKey:'sb_publishable_test',bucket:'test-private'}}};
 const s=await setup('#listening',extra);await new Promise(r=>setTimeout(r,0));
 vm.runInContext(fs.readFileSync('sync-model.js','utf8'),s.env);vm.runInContext(fs.readFileSync('cloud-sync.js','utf8'),s.env);await new Promise(r=>setTimeout(r,0));
 return {...s,storage,audio,sync:()=>s.env.window.CloudSync.sync()};
}
function increment(s,n){s.run(`state.days['2026-11-05']=(state.days['2026-11-05']||0)+${n};state.items['listening:water']={seen:true,level:1,updated:Date.now()};state.dictation||={version:1,mode:'word',rate:1,stats:{word:{},sentence:{}},rounds:{}};state.dictation.stats.word||={};var previous=state.dictation.stats.word['listening:water']||{};state.dictation.stats.word['listening:water']={attempts:(previous.attempts||0)+${n},correct:(previous.correct||0)+${n},firstAttempts:(previous.firstAttempts||0)+${n},firstCorrect:(previous.firstCorrect||0)+${n},needsReview:false,updated:Date.now()};save();`)}
const day=s=>s.run("state.days['2026-11-05']");
let a=await browser();increment(a,2);await a.sync();assert.equal(cloud.payload.decks.listening.days['2026-11-05'],2);
const b=await browser();await b.sync();assert.equal(day(b),2,'A new browser receives existing cloud history');
increment(a,1);increment(b,2);await a.sync();await b.sync();assert.equal(cloud.payload.decks.listening.days['2026-11-05'],5);
assert.equal(cloud.payload.decks.listening.dictation.stats.word['listening:water'].attempts,5);
const pushCount=pushes;let applies=0;const apply=b.env.window.VocabState.apply;b.env.window.VocabState.apply=x=>{applies++;apply(x)};await b.sync();assert.equal(pushes,pushCount);assert.equal(applies,0,'An unchanged periodic sync does not flip/reset the visible card');
increment(a,1);loseResponse=true;await a.sync();assert.equal(cloud.payload.decks.listening.days['2026-11-05'],6);assert(JSON.parse(a.storage.get('translation-cloud-meta-v1:'+UID)).pending);
increment(b,1);await b.sync();assert.equal(cloud.payload.decks.listening.days['2026-11-05'],7);
const oldStorage=a.storage;a=await browser(oldStorage);await a.sync();assert.equal(day(a),7);assert.equal(cloud.payload.decks.listening.days['2026-11-05'],7,'Retry after a lost response and browser reload does not double count');
increment(a,1);onPush=()=>increment(a,1);await a.sync();assert.equal(day(a),9,'A practice edit during the request is retained');assert.equal(cloud.payload.decks.listening.days['2026-11-05'],8);await a.sync();assert.equal(cloud.payload.decks.listening.days['2026-11-05'],9);
// Original audio is sent to private storage and fetched into the second browser's IndexedDB.
const clip={id:'fixture-clip',wordId:'listening:water',source:'UNIT TEST AUDIO ONLY',sentence:'Please bring [water] with you.',start:0,end:1,updated:Date.now(),blob:new Blob(['UNIT TEST AUDIO BYTES'],{type:'audio/mpeg'})};
await a.env.window.Dictation.storeClips([clip]);await a.sync();assert.equal(files.size,1);assert.equal(Object.keys(cloud.payload.clips).length,1);
await b.sync();assert.equal(b.audio.get('fixture-clip').blob.size,clip.blob.size);
a.env.navigator.onLine=false;increment(a,1);await a.sync();assert(a.nodes.cloudStatus.textContent.includes('离线'));assert.equal(day(a),10);a.env.navigator.onLine=true;await a.sync();assert.equal(cloud.payload.decks.listening.days['2026-11-05'],10);
const other=await browser(a.storage,'another-account');const before=pushes;await other.sync();assert.equal(pushes,before);assert(other.nodes.cloudStatus.textContent.includes('另一账号'),'Changing accounts cannot mix retained local progress');
// Real UI handlers, separate browser stores and the production sync/merge code.
a.nodes.mode.value='every';a.nodes.search.value='';a.nodes.listeningKind.value='';a.nodes.search.oninput();
function completeWord(s){s.nodes.spellingInput.value=s.run('window.Dictation.round().item.w.spoken||window.Dictation.round().item.w.word');s.nodes.dictationForm.onsubmit({preventDefault(){}});s.nodes.nextSpelling.onclick()}
completeWord(a);completeWord(a);
const fullBookmark=a.run('window.Dictation.round().item.id');
a.nodes.spellingInput.value='cross-device draft';a.nodes.spellingInput.oninput();
a.nodes.listeningKind.value='月份';a.nodes.listeningKind.onchange();completeWord(a);
const monthsBookmark=a.run('window.Dictation.round().item.id');await a.sync();
const c=await browser();await c.sync();
assert.equal(c.nodes.listeningKind.value,'月份');assert.equal(c.run('window.Dictation.round().item.id'),monthsBookmark,'A new computer resumes the selected monthly round');
c.nodes.listeningKind.value='';c.nodes.listeningKind.onchange();
assert.equal(c.run('window.Dictation.round().item.id'),fullBookmark);assert.equal(c.nodes.spellingInput.value,'cross-device draft','The other filter and its draft also transfer');
completeWord(c);await c.sync();
a.nodes.listeningKind.value='';a.nodes.listeningKind.onchange();await a.sync();
assert.equal(a.run('window.Dictation.round().item.id'),c.run('window.Dictation.round().item.id'),'The first computer receives the continued position from the second');
console.log('PASS: two browser stores, concurrent counters, no-op polling, lost-response and reload recovery, edits during network requests, private audio transfer, offline catch-up and account isolation.');
console.log('PASS: filtered listening bookmarks and drafts transfer to a fresh computer and continue back on the original computer.');
